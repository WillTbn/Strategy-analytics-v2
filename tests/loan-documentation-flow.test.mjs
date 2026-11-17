import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as Vue from "vue";
import { parse, compileScript } from "@vue/compiler-sfc";
import * as rules from "../src/services/loanDocumentation.js";
import * as drafts from "../src/services/loanRequestDraft.js";
async function mount(overrides = {}) {
  const context = vm.createContext({ console, Function });
  const cache = new Map();
  const deps = {
    vue: Vue,
    "src/services/loanDocumentation": rules,
    "src/services/loanRequestDraft": drafts,
    "src/services/onboardingBlock": { onboardingBlockMessage: () => "" },
  };
  async function dependency(name) {
    if (cache.has(name)) return cache.get(name);
    if (name === "src/composables/useFinanceResource") {
      const module = new vm.SourceTextModule(
        readFileSync("src/composables/useFinanceResource.js", "utf8"),
        { context },
      );
      cache.set(name, module);
      await module.link(dependency);
      return module;
    }
    const values = deps[name] || { default: {} };
    const module = new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const key in values) this.setExport(key, values[key]);
      },
      { context },
    );
    cache.set(name, module);
    return module;
  }
  const file = "src/system/components/loan/PropertyLoanDocuments.vue";
  const { descriptor } = parse(readFileSync(file, "utf8"));
  const script = compileScript(descriptor, { id: file });
  const module = new vm.SourceTextModule(script.content, { context });
  await module.link(dependency);
  await module.evaluate();
  const props = Vue.reactive({
    reader: async () => [],
    uploader: null,
    remover: null,
    proceedAction: null,
    helpAction: null,
    canContinue: false,
    ...overrides,
  });
  const scope = Vue.effectScope();
  const h = scope.run(() =>
    module.namespace.default.setup(props, { expose() {}, emit() {} }),
  );
  await h.load();
  return { h, props, stop: () => scope.stop() };
}

const row = { id: "qa-doc", name: "ficticio.pdf", group: "identification" };
const file = { name: "ficticio.pdf", size: 32 };
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
test("document response rejects unknown groups, duplicates and incomplete persisted files", () => {
  for (const rows of [
    [{ ...row, id: "" }],
    [row, row],
    [{ ...row, group: "invented" }],
    [{ ...row, name: "" }],
  ])
    assert.throws(() => rules.readLoanDocuments(rows));
});
test("failed upload preserves persisted files; retry appends only confirmed valid records", async () => {
  let fail = true;
  const f = await mount({
    reader: async () => [row],
    uploader: async (group) => {
      if (fail) throw Error("qa");
      return { id: "second", name: "verso.pdf", group };
    },
  });
  await f.h.upload("identification", [file]);
  assert.equal(f.h.files.value.length, 1);
  assert.ok(f.h.errors.value.identification);
  fail = false;
  await f.h.upload("identification", [file]);
  assert.equal(f.h.files.value.length, 2);
  assert.equal(f.h.errors.value.identification, "");
  f.stop();
});
test("wrong-group or unconfirmed upload does not show a stored file", async () => {
  const f = await mount({
    uploader: async () => ({ ...row, group: "photos" }),
  });
  await f.h.upload("identification", [file]);
  assert.equal(f.h.files.value.length, 0);
  assert.ok(f.h.errors.value.identification);
  f.stop();
});
test("removal requires persisted confirmation and preserves the list on failure", async () => {
  let confirmed = false;
  const f = await mount({
    reader: async () => [row],
    remover: async () => ({ removed: confirmed }),
  });
  await f.h.remove(row);
  assert.equal(f.h.files.value.length, 1);
  confirmed = true;
  await f.h.remove(row);
  assert.equal(f.h.files.value.length, 0);
  f.stop();
});
test("pending upload cannot be duplicated and unmounted responses are ignored", async () => {
  let finish,
    writes = 0;
  const f = await mount({
    uploader: () => {
      writes++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  const pending = f.h.upload("identification", [file]);
  await flush();
  await f.h.upload("identification", [file]);
  assert.equal(writes, 1);
  f.stop();
  finish(row);
  await pending;
  assert.equal(f.h.files.value.length, 0);
});
test("missing API adapters and unmet continuation cannot cause an upload or progression", async () => {
  let progressed = 0;
  const f = await mount({
    reader: null,
    proceedAction: async () => progressed++,
  });
  await f.h.upload("identification", [file]);
  await f.h.proceed();
  assert.equal(f.h.files.value.length, 0);
  assert.equal(progressed, 0);
  f.stop();
});
