import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Load the actual client modules with an in-memory transport, never real credentials.
async function harness() {
  const calls = [], requestHandlers = [], responseHandlers = [];
  const api = {
    interceptors: {
      request: { use: fn => requestHandlers.push(fn) },
      response: { use: (ok, fail) => responseHandlers.push(fail) },
    },
    post: async (url, body, config = {}) => {
      const request = { url, method: "post", headers: {}, ...config };
      for (const handler of requestHandlers) handler(request);
      calls.push({ ...request, body });
      return { data: { data: { accepted: true, succeeded: true } } };
    },
  };
  const context = vm.createContext({
    process: { env: {} }, console, Date, Set, Number, Math,
    crypto: { randomUUID: () => "test-idempotency-key" },
    window: { location: { assign: () => { throw Error("Unexpected redirect"); } } },
  });
  const modules = new Map();
  const synthetic = (name, values) => {
    const mod = new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
    modules.set(name, mod);
  };
  synthetic("axios", { default: { create: () => api } });
  synthetic("quasar", { Cookies: { get: () => "existing-test-session", set() {}, remove() {} } });
  const load = async name => {
    if (modules.has(name)) return modules.get(name);
    const source = await readFile(new URL("../src/services/" + name + ".js", import.meta.url), "utf8");
    const mod = new vm.SourceTextModule(source, { context });
    modules.set(name, mod);
    await mod.link(spec => load(spec.replace(/^\.\//, "")));
    return mod;
  };
  const auth = await load("clientAuthService"); await auth.evaluate();
  const account = await load("clientAccountService"); await account.evaluate();
  return { calls, responseHandlers, auth: auth.namespace, account: account.namespace, helpers: modules.get("publicAuth").namespace };
}

test("registration uses the documented endpoint, envelope and stable key", async () => {
  const h = await harness();
  const payload = h.helpers.registrationPayload({
    name: " QA ", email: " qa@example.test ", password: "test-only",
    address: "must not be sent", password_confirmation: "must not be sent",
  });
  assert.deepEqual(Object.keys(payload).sort(), ["email", "name", "password", "referralCode"]);
  assert.equal(payload.name, "QA");
  assert.equal(payload.referralCode, null);
  assert.equal((await h.auth.register(payload, "stable-key")).accepted, true);
  assert.equal(h.calls[0].url, "/api/v1/auth/register");
  assert.equal(h.calls[0].headers["Idempotency-Key"], "stable-key");
  assert.equal(h.calls[0].headers.Authorization, undefined);
  assert.equal(h.calls[0].skipAuthRefresh, true);
});

test("confirmation and resend are public and transmit the code unchanged", async () => {
  const h = await harness();
  await h.account.confirmEmail("qa@example.test", "TEST1234");
  await h.account.requestEmailConfirmation("qa@example.test");
  assert.equal(h.calls[0].url, "/api/v1/auth/email-confirmation/confirm");
  assert.equal(h.calls[0].body.code, "TEST1234");
  assert.equal(h.calls[1].url, "/api/v1/auth/email-confirmation/request");
  for (const call of h.calls) {
    assert.equal(call.skipAuthRefresh, true);
    assert.equal(call.headers.Authorization, undefined);
    assert.ok(call.headers["Idempotency-Key"]);
  }
});

test("public 401 preserves original error instead of refreshing or redirecting", async () => {
  const h = await harness();
  await h.auth.login({ email: "qa@example.test", password: "test-only" });
  const error = { response: { status: 401 }, config: h.calls[0] };
  await assert.rejects(h.responseHandlers[0](error), value => value === error);
  assert.equal(h.calls.length, 1);
  assert.equal(h.helpers.isPublicAuthRequest("/api/v1/auth/logout"), false);
});

test("rate limits and verification errors have safe messages", async () => {
  const h = await harness();
  const error = { response: { status: 429, headers: { "retry-after": "120" }, data: { errors: [{ code: "verification_code_attempts_exceeded" }] } } };
  assert.equal(h.helpers.retrySeconds(error), 120);
  error.response.data.errors[0].retryAfterSeconds = 180;
  assert.equal(h.helpers.retrySeconds(error), 180);
  assert.match(h.helpers.identityErrorMessage(error, "fallback"), /Limite de tentativas/);
  assert.equal(h.helpers.identityErrorMessage({ response: { data: { message: "private" } } }, "fallback"), "fallback");
});
