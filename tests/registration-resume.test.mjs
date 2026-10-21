import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { ref } from "vue";
import { assertLoginIdentity } from "../src/services/sessionIsolation.js";
import {
  registrationResumePath,
  rememberRegistrationStep,
  readRegistrationStep,
  registrationLoginDestination,
} from "../src/services/registrationResume.js";
const memory = () => {
  const values = new Map();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};
test("resume accepts only existing authenticated registration screens without arbitrary destinations", () => {
  for (const path of [
    "/cadastro/etapa-3",
    "/cadastro/etapa-5/br",
    "/cadastro/etapa-5/europe",
    "/cadastro/etapa-7",
  ])
    assert.equal(registrationResumePath(path), path);
  for (const path of [
    "/cadastro/enviado",
    "/cadastro/etapa-1",
    "/cadastro/etapa-2",
    "/cadastro/etapa-4/br",
    "/cadastro/etapa-5/unknown",
    "/cadastro/etapa-8",
    "https://example.com",
    "//example.com",
    "/cadastro/etapa-3?token=secret",
    ["/cadastro/etapa-3"],
  ])
    assert.equal(registrationResumePath(path), null);
});
test("last visited step survives a new login and is isolated by authenticated user", () => {
  const storage = memory();
  rememberRegistrationStep("a", "/cadastro/etapa-5/br", storage);
  rememberRegistrationStep("b", "/cadastro/etapa-6", storage);
  assert.equal(readRegistrationStep("a", storage), "/cadastro/etapa-5/br");
  assert.equal(
    registrationLoginDestination("b", null, storage).path,
    "/cadastro/etapa-6",
  );
  assert.equal(registrationLoginDestination("c", null, storage).name, "inicio");
  assert.deepEqual(
    [...storage.values.values()],
    ["/cadastro/etapa-5/br", "/cadastro/etapa-6"],
  );
});
test("Home and invalid paths never overwrite registration progress and no anonymous progress is stored", () => {
  const storage = memory();
  assert.equal(
    rememberRegistrationStep(null, "/cadastro/etapa-3", storage),
    false,
  );
  rememberRegistrationStep("a", "/cadastro/etapa-5/br", storage);
  assert.equal(
    rememberRegistrationStep("a", "/system/dashboard", storage),
    false,
  );
  assert.equal(
    rememberRegistrationStep("a", "/cadastro/enviado", storage),
    false,
  );
  assert.equal(readRegistrationStep("a", storage), "/cadastro/etapa-5/br");
});
test("explicit safe return takes precedence; corrupted storage and unavailable storage fail safely", () => {
  const storage = memory();
  rememberRegistrationStep("a", "/cadastro/etapa-7", storage);
  assert.equal(
    registrationLoginDestination("a", "/cadastro/etapa-3", storage).path,
    "/cadastro/etapa-3",
  );
  assert.equal(
    registrationLoginDestination("a", "//external", storage).path,
    "/cadastro/etapa-7",
  );
  for (const key of storage.values.keys())
    storage.values.set(key, "https://external");
  assert.equal(registrationLoginDestination("a", null, storage).name, "inicio");
  const unavailable = {
    getItem() {
      throw Error("disabled");
    },
    setItem() {
      throw Error("quota");
    },
  };
  assert.equal(
    rememberRegistrationStep("a", "/cadastro/etapa-3", unavailable),
    false,
  );
  assert.equal(
    registrationLoginDestination("a", null, unavailable).name,
    "inicio",
  );
});

async function authHarness(storage) {
  const cookies = new Map(),
    destinations = [],
    errors = [];
  let version = 0,
    identity;
  const store = {
    data: {},
    login: {},
    $reset() {
      this.data = {};
      this.login = {};
    },
  };
  const context = vm.createContext({ process: { env: {} } });
  const capture = () => ({ version, token: cookies.get("SA_token") });
  const current = (snapshot) =>
    snapshot.version === version && snapshot.token === cookies.get("SA_token");
  const modules = {
    "src/services/clientAuthService": {
      login: async ({ email }) => {
        identity = {
          id: email === "a@example.test" ? "a" : "b",
          email,
          roles: ["Client"],
        };
        return {
          accessToken: `token-${identity.id}`,
          refreshToken: "refresh",
          user: identity,
        };
      },
      getCurrentUser: async () => identity,
      clientPing: async () => {},
      logout: async () => {},
      getApiErrorMessage: () => "error",
    },
    "src/stores/user": { useUserStore: () => store },
    quasar: {
      Cookies: {
        get: (k) => cookies.get(k),
        set: (k, v) => cookies.set(k, v),
        remove: (k) => cookies.delete(k),
      },
    },
    "vue-router": {
      useRouter: () => ({ replace: async (to) => destinations.push(to) }),
      useRoute: () => ({ query: {} }),
    },
    "../useNotify": {
      default: () => ({
        errorNotify: (error) => errors.push(error),
        infoNotify: () => {},
      }),
    },
    vue: { ref },
    "../useCookies": {
      default: () => ({
        tokenName: "SA_token",
        setTokenCookie: ({ token }) => cookies.set("SA_token", token),
        deleteTokenCookie: () => cookies.clear(),
        setUserCookie: (user) => {
          store.data = user;
        },
      }),
    },
    "src/services/clientApi": {
      resetClientSession: () => {
        cookies.clear();
        return ++version;
      },
      clientSessionVersion: () => version,
      isClientSessionVersion: (v) => v === version,
      captureClientSession: capture,
      isClientSessionCurrent: current,
      assertClientSessionCurrent: (s) => {
        if (!current(s)) throw Error("stale");
      },
    },
    "src/services/sessionIsolation": { assertLoginIdentity },
    "src/services/registrationResume": {
      registrationLoginDestination: (id, next) =>
        registrationLoginDestination(id, next, storage),
    },
  };
  const mod = new vm.SourceTextModule(
    await readFile(
      new URL("../src/composables/system/useAuth.js", import.meta.url),
      "utf8",
    ),
    { context },
  );
  await mod.link((name) => {
    const values = modules[name];
    if (!values) throw Error(`Missing mock ${name}`);
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await mod.evaluate();
  return { ...mod.namespace.default(), destinations, errors, store };
}
test("real authentication restores the same user's stage after logout and login without changing progress", async () => {
  const storage = memory();
  rememberRegistrationStep("a", "/cadastro/etapa-5/br", storage);
  const h = await authHarness(storage);
  assert.equal(
    await h.auth({ person: "a@example.test", password: "test" }),
    true,
  );
  assert.equal(h.destinations.at(-1).path, "/cadastro/etapa-5/br");
  await h.setLogout();
  assert.equal(h.destinations.at(-1).path, "/login");
  assert.equal(
    await h.auth({ person: "a@example.test", password: "test" }),
    true,
  );
  assert.equal(h.destinations.at(-1).path, "/cadastro/etapa-5/br");
  assert.equal(h.errors.length, 0);
});
test("real authentication never sends another account to the previous user's stage", async () => {
  const storage = memory();
  rememberRegistrationStep("a", "/cadastro/etapa-6", storage);
  const h = await authHarness(storage);
  await h.auth({ person: "a@example.test", password: "test" });
  await h.setLogout();
  await h.auth({ person: "b@example.test", password: "test" });
  assert.equal(h.store.data.id, "b");
  assert.equal(h.destinations.at(-1).name, "inicio");
});

async function routerHarness() {
  const storage = memory();
  const store = { data: { id: "a" } };
  let before,
    after,
    authenticated = true;
  const router = {
    beforeEach: (fn) => {
      before = fn;
    },
    afterEach: (fn) => {
      after = fn;
    },
  };
  const context = vm.createContext({ process: { env: {} }, document: {} });
  const modules = {
    "quasar/wrappers": { route: (fn) => fn },
    quasar: { Cookies: { has: () => true } },
    "vue-router": {
      createRouter: () => router,
      createMemoryHistory: () => {},
      createWebHistory: () => {},
      createWebHashHistory: () => {},
    },
    "./routes": { default: [] },
    "src/composables/system/useAuth": {
      default: () => ({ verifyLogged: async () => authenticated }),
    },
    "src/composables/useCookies": {
      default: () => ({ tokenName: "SA_token" }),
    },
    "src/stores/user": { useUserStore: () => store },
    "src/services/registrationResume": {
      registrationLoginDestination: (id, next) =>
        registrationLoginDestination(id, next, storage),
      rememberRegistrationStep: (id, path) =>
        rememberRegistrationStep(id, path, storage),
    },
  };
  const mod = new vm.SourceTextModule(
    await readFile(new URL("../src/router/index.js", import.meta.url), "utf8"),
    {
      context,
      initializeImportMeta: (meta) => {
        meta.env = {
          QUASAR_SERVER: false,
          QUASAR_VUE_ROUTER_MODE: "history",
          QUASAR_VUE_ROUTER_BASE: "/",
        };
      },
    },
  );
  await mod.link((name) => {
    const values = modules[name];
    if (!values) throw Error(`Missing mock ${name}`);
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [key, value] of Object.entries(values))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await mod.evaluate();
  mod.namespace.default();
  return {
    storage,
    store,
    before,
    after,
    expire: () => {
      authenticated = false;
    },
  };
}
test("real router records only successful authenticated stage navigation and retains it through Home", async () => {
  const h = await routerHarness();
  h.after(
    { path: "/cadastro/etapa-5/br", meta: { auth: true } },
    { path: "/" },
  );
  assert.equal(readRegistrationStep("a", h.storage), "/cadastro/etapa-5/br");
  h.after(
    { path: "/cadastro/etapa-6", meta: { auth: true } },
    { path: "/" },
    Error("cancelled"),
  );
  h.after({ path: "/system/dashboard", meta: { auth: true } }, { path: "/" });
  assert.equal(readRegistrationStep("a", h.storage), "/cadastro/etapa-5/br");
  const to = await h.before({
    name: "login",
    path: "/login",
    query: {},
    meta: {},
  });
  assert.equal(to.path, "/cadastro/etapa-5/br");
});
test("expired-session router requires login and preserves only the safe return route", async () => {
  const h = await routerHarness();
  h.expire();
  const result = await h.before({
    path: "/cadastro/etapa-5/br",
    meta: { auth: true },
  });
  assert.equal(result.name, "login");
  assert.equal(result.query.next, "/cadastro/etapa-5/br");
  assert.equal(readRegistrationStep("a", h.storage), null);
});

test("old progress migrates documents to 5 and employment to 4 without changing another account", () => {
  const storage = memory();
  storage.setItem("SA_registration_resume:v1:doc", "/cadastro/etapa-4/br");
  storage.setItem("SA_registration_resume:v1:work", "/cadastro/etapa-5");
  assert.equal(readRegistrationStep("doc", storage), "/cadastro/etapa-5/br");
  assert.equal(readRegistrationStep("work", storage), "/cadastro/etapa-4");
  assert.equal(readRegistrationStep("other", storage), null);
  assert.equal(
    storage.getItem("SA_registration_resume:v2:doc"),
    "/cadastro/etapa-5/br",
  );
});
