import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as Vue from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";

async function formHarness(auth, loading) {
  const source = await readFile(
    new URL("../src/system/layouts/auth/LoginLayout.vue", import.meta.url),
    "utf8",
  );
  const { descriptor } = parse(source);
  const script = compileScript(descriptor, { id: "login-form-test" });
  const context = vm.createContext({});
  let unmount;
  const modules = {
    vue: {
      ...Vue,
      onBeforeUnmount: (callback) => {
        unmount = callback;
      },
    },
    "src/system/components/form/LabelField.vue": { default: {} },
    "src/composables/system/useAuth": { default: () => ({ auth, loading }) },
    "src/Utils/ViewInput": { inputWhite: {} },
  };
  const component = new vm.SourceTextModule(script.content, { context });
  await component.link((name) => {
    assert.ok(modules[name], name);
    return new vm.SyntheticModule(
      Object.keys(modules[name]),
      function () {
        for (const [key, value] of Object.entries(modules[name]))
          this.setExport(key, value);
      },
      { context },
    );
  });
  await component.evaluate();
  const state = component.namespace.default.setup(
    {},
    { expose() {}, emit() {} },
  );
  return { state, unmount: () => unmount() };
}

test("login keeps its credentials independent during an attempt and blocks duplicate submissions", async () => {
  const loading = Vue.ref(false);
  let finish,
    calls = 0,
    received;
  const { state, unmount } = await formHarness((credentials) => {
    calls++;
    received = { ...credentials };
    loading.value = true;
    return new Promise((resolve) => {
      finish = () => {
        loading.value = false;
        resolve();
      };
    });
  }, loading);
  state.credentials.person = "client@example.com";
  state.credentials.password = "test-password";
  const attempt = state.submit();
  await state.submit();
  assert.equal(calls, 1);
  assert.equal(received.person, "client@example.com");
  assert.equal(received.password, "test-password");
  finish();
  await attempt;
  assert.equal(state.credentials.person, "client@example.com");
  assert.equal(state.credentials.password, "");
  state.credentials.password = "another-value";
  unmount();
  assert.equal(state.credentials.password, "");
});

test("an unexpected authentication failure still clears the password and preserves the address", async () => {
  const { state } = await formHarness(async () => {
    throw new Error("unavailable");
  }, Vue.ref(false));
  state.credentials.person = "client@example.com";
  state.credentials.password = "test-password";
  await assert.rejects(state.submit(), /unavailable/);
  assert.equal(state.credentials.password, "");
  assert.equal(state.credentials.person, "client@example.com");
});
