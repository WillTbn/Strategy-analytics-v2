import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

// Exercise the real interceptors with deferred responses, without contacting the API.
async function harness() {
  const cookies = new Map([["SA_token", "session-a"], ["SA_refresh", "refresh-a"]]);
  const requests = [], redirects = [];
  let requestHandler, successHandler, failureHandler, resolveRefresh, rejectRefresh;
  const api = async config => {
    const request = requestHandler({ headers: {}, ...config });
    requests.push(request);
    if (request.url === "/api/v1/auth/refresh") {
      const payload = await new Promise((resolve, reject) => { resolveRefresh = resolve; rejectRefresh = reject; });
      return successHandler({ config: request, data: { data: payload } });
    }
    return successHandler({ config: request, data: { success: true } });
  };
  api.post = (url, body, config) => api({ ...config, url, data: body, method: "post" });
  api.interceptors = {
    request: { use: fn => { requestHandler = fn; } },
    response: { use: (ok, fail) => { successHandler = ok; failureHandler = fail; } },
  };
  const context = vm.createContext({
    process: { env: {} }, Date, Set, Number, Math,
    crypto: { randomUUID: () => "test-key" },
    window: { location: { pathname: "/system/dashboard", assign: path => redirects.push(path) } },
  });
  const modules = new Map();
  for (const [name, values] of Object.entries({
    axios: { default: { create: () => api } },
    quasar: { Cookies: { get: name => cookies.get(name), set: (name, value) => cookies.set(name, value), remove: name => cookies.delete(name) } },
  })) {
    modules.set(name, new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context }));
  }
  const load = async name => {
    if (modules.has(name)) return modules.get(name);
    const source = await readFile(new URL(`../src/services/${name}.js`, import.meta.url), "utf8");
    const mod = new vm.SourceTextModule(source, { context });
    modules.set(name, mod);
    await mod.link(spec => load(spec.replace(/^\.\//, "")));
    return mod;
  };
  const mod = await load("clientApi"); await mod.evaluate();
  return {
    cookies, requests, redirects, session: mod.namespace, identity: modules.get("sessionIsolation").namespace.assertLoginIdentity,
    request: (url = "/api/v1/client/home") => requestHandler({ url, headers: {} }),
    ok: config => successHandler({ config, data: {} }),
    unauthorized: config => failureHandler({ config, response: { status: 401 } }),
    resolve: payload => resolveRefresh(payload),
    reject: () => rejectRefresh(new Error("Refresh failed")),
  };
}

test("a response from the previous login cannot populate the next session", async () => {
  const h = await harness(); const old = h.request();
  h.session.resetClientSession(); h.cookies.set("SA_token", "session-b");
  assert.throws(() => h.ok(old), error => error.code === "ERR_SESSION_CHANGED");
  await assert.rejects(h.unauthorized(old), error => error.code === "ERR_SESSION_CHANGED");
  assert.equal(h.requests.length, 0);
  assert.equal(h.cookies.get("SA_token"), "session-b");
});

test("late refresh cannot restore a logged out account or replace a new login", async () => {
  const h = await harness(); const pending = h.unauthorized(h.request());
  h.session.resetClientSession();
  h.cookies.set("SA_token", "session-b"); h.cookies.set("SA_refresh", "refresh-b");
  h.resolve({ accessToken: "renewed-a", refreshToken: "renewed-refresh-a" });
  await assert.rejects(pending, error => error.code === "ERR_SESSION_CHANGED");
  assert.equal(h.cookies.get("SA_token"), "session-b");
  assert.equal(h.cookies.get("SA_refresh"), "refresh-b");
  assert.equal(h.requests.length, 1); assert.equal(h.redirects.length, 0);
});

test("cross-tab login during refresh is preserved even without a local reset", async () => {
  const h = await harness(); const pending = h.unauthorized(h.request());
  h.cookies.set("SA_token", "session-b");
  h.resolve({ accessToken: "renewed-a" });
  await assert.rejects(pending, error => error.code === "ERR_SESSION_CHANGED");
  assert.equal(h.cookies.get("SA_token"), "session-b");
  assert.equal(h.redirects.length, 0);
});

test("concurrent expired requests share one refresh and retain idempotency keys", async () => {
  const h = await harness();
  const first = h.request(), second = h.request();
  first.headers["Idempotency-Key"] = "original-key";
  const pending = [h.unauthorized(first), h.unauthorized(second)];
  assert.equal(h.requests.length, 1);
  h.resolve({ accessToken: "renewed-a", refreshToken: "renewed-refresh-a" });
  await Promise.all(pending);
  assert.equal(h.requests.length, 3);
  assert.equal(h.requests[1].headers.Authorization, "Bearer renewed-a");
  assert.equal(h.requests[1].headers["Idempotency-Key"], "original-key");
  assert.equal(h.cookies.get("SA_refresh"), "renewed-refresh-a");
});

test("failed refresh expires only the current session", async () => {
  const h = await harness(); const pending = h.unauthorized(h.request());
  h.reject(); await assert.rejects(pending);
  assert.equal(h.cookies.has("SA_token"), false);
  assert.deepEqual(h.redirects, ["/login?session=expired"]);
});

test("same-account refresh preserves in-flight responses and retries late 401 without another refresh", async () => {
  const h = await harness();
  const inFlight = h.request(), lateExpired = h.request();
  const pending = h.unauthorized(h.request());
  h.resolve({ accessToken: "renewed-a" }); await pending;
  assert.doesNotThrow(() => h.ok(inFlight));
  await h.unauthorized(lateExpired);
  assert.equal(h.requests.filter(request => request.url === "/api/v1/auth/refresh").length, 1);
  assert.equal(h.requests.at(-1).headers.Authorization, "Bearer renewed-a");
  h.cookies.set("SA_token", "session-b");
  assert.throws(() => h.ok(inFlight), error => error.code === "ERR_SESSION_CHANGED");
});

test("login checks the submitted email and the API identity before entering", async () => {
  const h = await harness();
  const payload = { accessToken: "session", user: { id: "a" } };
  assert.doesNotThrow(() => h.identity(" A@example.test ", payload, { id: "a", email: "a@example.test" }));
  for (const user of [{ id: "b", email: "a@example.test" }, { id: "a", email: "b@example.test" }, {}]) {
    assert.throws(() => h.identity("a@example.test", payload, user), /confirmar a identidade/);
  }
  assert.throws(() => h.identity("a@example.test", {}, { id: "a", email: "a@example.test" }));
});
