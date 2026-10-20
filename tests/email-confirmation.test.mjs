import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createEmailConfirmation,
  maskedConfirmationEmail,
} from "../src/services/emailConfirmation.js";

function harness(transport = {}) {
  let now = 1000,
    tick;
  const calls = [];
  const state = createEmailConfirmation({
    initialEmail: "qa@example.test",
    confirmEmail: async (...args) => {
      calls.push(["confirm", ...args]);
      return { succeeded: true };
    },
    requestEmailConfirmation: async (...args) => {
      calls.push(["resend", ...args]);
      return { accepted: true };
    },
    clock: {
      now: () => now,
      setInterval: (fn) => {
        tick = fn;
        return 1;
      },
      clearInterval: () => {
        tick = undefined;
      },
    },
    ...transport,
  });
  return {
    state,
    calls,
    advance: (seconds) => {
      now += seconds * 1000;
      tick?.();
    },
    hasTimer: () => Boolean(tick),
  };
}
const limited = (code, seconds) => ({
  response: {
    status: 429,
    headers: { "retry-after": String(seconds) },
    data: { errors: [{ code }] },
  },
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
};

test("only a masked address is presented and local validation never submits an empty code", async () => {
  assert.equal(
    maskedConfirmationEmail(" some.person@example.test "),
    "s•••@example.test",
  );
  assert.equal(maskedConfirmationEmail("invalid"), "");
  const h = harness();
  assert.equal(await h.state.confirm(), false);
  assert.match(h.state.codeError.value, /Informe o código/);
  h.state.email.value = "";
  h.state.code.value = "CODE1234";
  assert.equal(await h.state.confirm(), false);
  assert.equal(await h.state.resend(), false);
  assert.equal(h.calls.length, 0);
  h.state.dispose();
});
test("the existing contract receives alphanumeric code unchanged and success clears it", async () => {
  const h = harness();
  h.state.code.value = "CODE1234";
  assert.equal(await h.state.confirm(), true);
  assert.deepEqual(h.calls, [["confirm", "qa@example.test", "CODE1234"]]);
  assert.equal(h.state.code.value, "");
  assert.equal(h.state.confirmed.value, true);
  assert.equal(await h.state.confirm(), false);
  assert.equal(await h.state.resend(), false);
  h.state.dispose();
});
test("unaccepted or malformed responses are never reported as success", async () => {
  for (const succeeded of [false, undefined, "true"]) {
    const h = harness({
      confirmEmail: async () => ({ succeeded }),
      requestEmailConfirmation: async () => ({ accepted: succeeded }),
    });
    h.state.code.value = "CODE";
    assert.equal(await h.state.confirm(), false);
    assert.equal(h.state.confirmed.value, false);
    assert.equal(await h.state.resend(), false);
    assert.equal(h.state.remaining.value, 0);
    h.state.dispose();
  }
});
test("invalid, expired and used verification codes show safe messages without echoing server data", async () => {
  for (const code of [
    "verification_code_invalid",
    "verification_code_expired",
    "verification_code_used",
    "verification_code_revoked",
  ]) {
    const h = harness({
      confirmEmail: async () => {
        throw {
          response: {
            data: { errors: [{ code, message: "PRIVATE-CODE-AND-EMAIL" }] },
          },
        };
      },
    });
    h.state.code.value = "PRIVATE-CODE";
    assert.equal(await h.state.confirm(), false);
    assert.ok(h.state.error.value);
    assert.ok(!h.state.error.value.includes("PRIVATE"));
    assert.equal(h.state.confirmed.value, false);
    h.state.dispose();
  }
});
test("confirmation and resend share the concurrency guard", async () => {
  const pending = deferred();
  let calls = 0;
  const h = harness({
    confirmEmail: () => {
      calls++;
      return pending.promise;
    },
  });
  h.state.code.value = "CODE";
  const operation = h.state.confirm();
  assert.equal(h.state.busy.value, true);
  assert.equal(await h.state.confirm(), false);
  assert.equal(await h.state.resend(), false);
  assert.equal(calls, 1);
  pending.resolve({ succeeded: true });
  assert.equal(await operation, true);
  assert.equal(h.state.busy.value, false);
  h.state.dispose();
});
test("accepted resend clears the old code and uses elapsed time, including after a background pause", async () => {
  const h = harness();
  h.state.code.value = "OLD";
  assert.equal(await h.state.resend(), true);
  assert.equal(h.state.code.value, "");
  assert.equal(h.state.remaining.value, 60);
  assert.equal(await h.state.resend(), false);
  h.advance(30);
  assert.equal(h.state.remaining.value, 30);
  h.advance(100);
  assert.equal(h.state.remaining.value, 0);
  assert.equal(h.hasTimer(), false);
  h.state.dispose();
});
test("attempt limits block confirmation and resend until Retry-After expires", async () => {
  const h = harness({
    confirmEmail: async () => {
      throw limited("verification_code_attempts_exceeded", 120);
    },
  });
  h.state.code.value = "CODE";
  assert.equal(await h.state.confirm(), false);
  assert.equal(h.state.remaining.value, 120);
  assert.equal(h.state.blocked.value, true);
  assert.equal(await h.state.confirm(), false);
  assert.equal(await h.state.resend(), false);
  h.advance(120);
  assert.equal(h.state.blocked.value, false);
  assert.equal(h.state.remaining.value, 0);
  h.state.dispose();
});
test("resend limits preserve the server interval without blocking a valid confirmation", async () => {
  const h = harness({
    requestEmailConfirmation: async () => {
      throw limited("verification_code_resend_wait", 90);
    },
  });
  assert.equal(await h.state.resend(), false);
  assert.equal(h.state.remaining.value, 90);
  assert.equal(h.state.blocked.value, false);
  h.state.code.value = "CODE";
  assert.equal(await h.state.confirm(), true);
  assert.equal(h.hasTimer(), false);
  h.state.dispose();
});
test("changing address or leaving discards late responses and clears the code/timer", async () => {
  const pending = deferred();
  const h = harness({ confirmEmail: () => pending.promise });
  h.state.code.value = "OLD";
  const operation = h.state.confirm();
  h.state.email.value = "new@example.test";
  assert.equal(h.state.code.value, "");
  assert.equal(h.state.busy.value, false);
  pending.resolve({ succeeded: true });
  assert.equal(await operation, false);
  assert.equal(h.state.confirmed.value, false);
  await h.state.resend();
  assert.equal(h.hasTimer(), true);
  h.state.dispose();
  assert.equal(h.hasTimer(), false);
  assert.equal(h.state.email.value, "");
  assert.equal(await h.state.resend(), false);
});
test("leaving while a request is pending cannot start a cooldown or show stale errors", async () => {
  const pending = deferred();
  const h = harness({ requestEmailConfirmation: () => pending.promise });
  const operation = h.state.resend();
  h.state.dispose();
  pending.reject(limited("verification_code_send_limit_reached", 120));
  assert.equal(await operation, false);
  assert.equal(h.state.error.value, "");
  assert.equal(h.hasTimer(), false);
});

test("default browser timers are called without the clock object as receiver", async (t) => {
  let scheduled = false;
  let cleared = false;
  t.mock.method(globalThis, "setInterval", function () {
    assert.ok(this === undefined || this === globalThis);
    scheduled = true;
    return 42;
  });
  t.mock.method(globalThis, "clearInterval", function () {
    assert.ok(this === undefined || this === globalThis);
    cleared = true;
  });
  const state = createEmailConfirmation({
    initialEmail: "qa@example.test",
    confirmEmail: async () => ({ succeeded: true }),
    requestEmailConfirmation: async () => ({ accepted: true }),
  });
  assert.equal(await state.resend(), true);
  assert.equal(scheduled, true);
  assert.equal(state.remaining.value, 60);
  state.dispose();
  assert.equal(cleared, true);
  assert.equal(state.email.value, "");
});