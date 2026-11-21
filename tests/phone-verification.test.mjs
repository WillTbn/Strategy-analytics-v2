import test from "node:test";
import assert from "node:assert/strict";
import {
  createPhoneVerification,
  normalizePhoneNumber,
  phoneInputMask,
} from "../src/services/phoneVerification.js";
function harness(overrides = {}) {
  const state = {
    number: "+5511999999999",
    code: "",
    sentTo: "",
    busy: "",
    error: "",
    message: "",
  };
  const calls = [];
  let version = 0;
  const flow = createPhoneVerification(state, {
    capture: () => version,
    isCurrent: (value) => value === version,
    request: async (number) => { calls.push(["send", number]); return { accepted: true }; },
    confirm: async (number, code) => { calls.push(["confirm", number, code]); return { succeeded: true }; },
    verified: () => calls.push(["verified"]),
    errorMessage: () => "Falha controlada",
    ...overrides,
  });
  return { state, calls, flow, changeSession: () => version++ };
}
test("phone confirmation requires a successful request for the same number", async () => {
  const h = harness();
  h.state.code = "test-code";
  await h.flow.confirm();
  assert.equal(h.calls.length, 0);
  await h.flow.send();
  h.state.number = "+5511888888888";
  await h.flow.confirm();
  assert.equal(h.calls.length, 1);
});
test("successful confirmation clears the code and requests server progress reload", async () => {
  const h = harness();
  await h.flow.send();
  h.state.code = "test-code";
  await h.flow.confirm();
  assert.deepEqual(
    h.calls.map((x) => x[0]),
    ["send", "confirm", "verified"],
  );
  assert.equal(h.state.code, "");
  assert.equal(h.state.busy, "");
});
test("duplicate sends and disposed results cannot update the view", async () => {
  let resolve;
  let requests = 0;
  const h = harness({
    request: () => {
      requests++;
      return new Promise((r) => {
        resolve = r;
      });
    },
  });
  const pending = h.flow.send();
  await h.flow.send();
  assert.equal(requests, 1);
  h.flow.dispose();
  resolve();
  await pending;
  assert.equal(h.state.sentTo, "");
  assert.equal(h.state.number, "");
});
test("changed session cannot grant success after verification", async () => {
  let resolve;
  const h = harness({
    confirm: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  await h.flow.send();
  h.state.code = "test-code";
  const pending = h.flow.confirm();
  h.changeSession();
  resolve();
  await pending;
  assert.equal(
    h.calls.some((x) => x[0] === "verified"),
    false,
  );
  h.flow.dispose();
  assert.equal(h.state.code, "");
});
test("errors clear the one-time code and retain retry context without approval", async () => {
  const h = harness({
    confirm: async () => {
      throw Error("rejected");
    },
  });
  await h.flow.send();
  h.state.code = "test-code";
  await h.flow.confirm();
  assert.equal(h.state.code, "");
  assert.equal(h.state.error, "Falha controlada");
  assert.equal(h.state.sentTo, h.state.number);
  assert.equal(
    h.calls.some((x) => x[0] === "verified"),
    false,
  );
});

test("formatted Brazilian and international numbers are normalized for both requests", async () => {
  const h = harness();
  h.state.number = "+55 (11) 99999-9999";
  await h.flow.send();
  h.state.code = "test-code";
  await h.flow.confirm();
  assert.equal(h.calls[0][1], "+5511999999999");
  assert.equal(h.calls[1][1], "+5511999999999");
  assert.equal(normalizePhoneNumber("+44 7700 900123"), "+447700900123");
  assert.equal(phoneInputMask("BR"), "+## (##) #####-####");
  assert.equal(phoneInputMask("INTL"), "+###############");
});
test("normalization does not silently accept letters or a missing country prefix", async () => {
  const h = harness();
  for (const number of [
    "55 11 99999-9999",
    "+55 11 wrong99999",
    "+55+11999999999",
  ]) {
    h.state.number = number;
    await h.flow.send();
  }
  assert.equal(h.calls.length, 0);
});

test("Brazilian mode rejects incomplete numbers and a different calling code", async () => {
  const h = harness();
  h.state.format = "BR";
  for (const number of [
    "+55 (21) 9",
    "+44 7700 900123",
    "+55 (11) 99999-99999",
  ]) {
    h.state.number = number;
    await h.flow.send();
  }
  assert.equal(h.calls.length, 0);
});

test("HTTP success without accepted=true cannot open code confirmation", async () => {
  for (const result of [{ accepted: false }, {}, undefined]) {
    const h = harness({ request: async () => result });
    await h.flow.send();
    assert.equal(h.state.sentTo, "");
    assert.notEqual(h.state.error, "");
    assert.equal(h.state.message, "");
  }
});
test("HTTP success without succeeded=true cannot announce verification or reload progress", async () => {
  for (const result of [{ succeeded: false }, {}, undefined]) {
    const h = harness({ confirm: async () => result });
    await h.flow.send();
    h.state.code = "invalid-or-expired";
    await h.flow.confirm();
    assert.equal(h.calls.some(x => x[0] === "verified"), false);
    assert.equal(h.state.code, "");
    assert.notEqual(h.state.error, "");
    assert.equal(h.state.message, "");
    assert.equal(h.state.sentTo, h.state.number);
  }
});