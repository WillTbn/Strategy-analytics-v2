import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse, compileTemplate } from "@vue/compiler-sfc";
import * as Vue from "vue";
import { renderToString } from "@vue/server-renderer";
const descriptor = parse(
  readFileSync(
    new URL(
      "../src/system/layouts/config/AccountBankSettingLayout.vue",
      import.meta.url,
    ),
    "utf8",
  ),
).descriptor;
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
async function harness() {
  const context = vm.createContext({}),
    lists = [],
    catalogs = [],
    details = [],
    writes = [],
    notifications = [],
    dispose = [];
  let session = 0;
  const queued = (queue, value) =>
    new Promise((resolve, reject) => queue.push({ resolve, reject, value }));
  const services = {
    listAllClientBanks: () => queued(catalogs),
    listClientBankAccounts: () => queued(lists),
    getClientBankAccount: (id) => queued(details, id),
    ...Object.fromEntries(
      [
        "createClientBankAccount",
        "updateClientBankAccount",
        "setPrimaryClientBankAccount",
        "archiveClientBankAccount",
      ].map((key) => [key, (...args) => queued(writes, { key, args })]),
    ),
  };
  const modules = {
    vue: {
      computed: Vue.computed,
      reactive: Vue.reactive,
      ref: Vue.ref,
      onScopeDispose: (fn) => dispose.push(fn),
    },
    "src/system/components/form/LabelForm.vue": { default: {} },
    "src/composables/useNotify": {
      default: () => ({
        successNotify: (message) => notifications.push(message),
        errorNotify: (message) => notifications.push(message),
      }),
    },
    "src/services/clientAuthService": { getApiErrorMessage: (e) => e.message },
    "src/services/clientProfileService": services,
    "src/services/clientApi": {
      captureClientSession: () => session,
      isClientSessionCurrent: (value) => value === session,
    },
  };
  const mod = new vm.SourceTextModule(
    descriptor.scriptSetup.content +
      "\nexport { load, accounts, banks, loading, saving, error, form, masks, formDialog, formRef, openCreate, openEdit, closeForm, save, makePrimary, askArchive, confirmArchive, archiveDialog };",
    { context },
  );
  await mod.link((specifier) => {
    const values = modules[specifier];
    assert.ok(values, specifier);
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
  const ready = async () => {
    catalogs[0].resolve([{ id: "bank", name: "Banco QA", isActive: true }]);
    lists[0].resolve([
      { id: "account", bankId: "bank", accountNumberMasked: "****0001" },
    ]);
    await flush();
  };
  return {
    model: mod.namespace,
    lists,
    catalogs,
    details,
    writes,
    notifications,
    ready,
    dispose: () => dispose.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
test("save locks before async validation and rejects duplicate submits", async () => {
  const h = await harness();
  await h.ready();
  h.model.openCreate();
  h.model.form.holderName = "Titular fictício QA";
  const validations = [];
  h.model.formRef.value = {
    validate: () => new Promise((resolve) => validations.push(resolve)),
    resetValidation() {},
  };
  const first = h.model.save(),
    second = h.model.save();
  assert.equal(validations.length, 1);
  validations[0](true);
  await flush();
  assert.equal(h.writes.length, 1);
  assert.equal(h.model.saving.value, true);
  h.model.closeForm();
  assert.equal(h.model.formDialog.value, true);
  h.writes[0].reject(Error("temporary failure"));
  await Promise.all([first, second]);
  assert.equal(h.model.saving.value, false);
  assert.equal(h.model.form.holderName, "Titular fictício QA");
  assert.equal(h.model.formDialog.value, true);
});
test("primary and archive writes cannot be submitted twice", async () => {
  for (const kind of ["primary", "archive"]) {
    const h = await harness();
    await h.ready();
    if (kind === "archive") h.model.askArchive({ id: "account" });
    const call = () =>
      kind === "primary"
        ? h.model.makePrimary({ id: "account" })
        : h.model.confirmArchive();
    const first = call(),
      second = call();
    assert.equal(h.writes.length, 1);
    h.writes[0].reject(Error("temporary failure"));
    await Promise.all([first, second]);
    assert.equal(h.model.saving.value, false);
  }
});
test("latest bank list survives an older request failure", async () => {
  const h = await harness(),
    retry = h.model.load();
  h.catalogs[1].resolve([{ id: "new-bank", name: "Banco atual" }]);
  h.lists[1].resolve([{ id: "new-account" }]);
  await retry;
  h.catalogs[0].reject(Error("old error"));
  h.lists[0].resolve([]);
  await flush();
  assert.equal(h.model.error.value, "");
  assert.equal(h.model.accounts.value[0].id, "new-account");
  assert.equal(h.model.banks.value[0].id, "new-bank");
});
test("loading clears old rows and an old success cannot hide a newer failure", async () => {
  const h = await harness();
  await h.ready();
  const old = h.model.load(),
    latest = h.model.load();
  assert.equal(h.model.accounts.value.length, 0);
  assert.equal(h.model.banks.value.length, 0);
  h.catalogs[2].reject(Error("new error"));
  h.lists[2].resolve([]);
  await latest;
  h.catalogs[1].resolve([{ id: "old-bank" }]);
  h.lists[1].resolve([{ id: "old-account" }]);
  await old;
  assert.equal(h.model.error.value, "new error");
  assert.equal(h.model.accounts.value.length, 0);
  h.model.openCreate();
  assert.equal(h.model.formDialog.value, false);
});
test("late details after disposal cannot reopen a banking form or publish a notification", async () => {
  const h = await harness();
  await h.ready();
  const edit = h.model.openEdit({ id: "account" });
  h.dispose();
  h.details[0].resolve({
    id: "account",
    bankId: "bank",
    holderName: "Pessoa QA",
    accountNumberMasked: "****0001",
  });
  await edit;
  assert.equal(h.model.formDialog.value, false);
  assert.equal(h.model.form.holderName, "");
  assert.equal(h.notifications.length, 0);
});
test("changing session during validation prevents any write", async () => {
  const h = await harness();
  await h.ready();
  h.model.openCreate();
  let finish;
  h.model.formRef.value = {
    validate: () => new Promise((resolve) => (finish = resolve)),
  };
  const save = h.model.save();
  h.changeSession();
  finish(true);
  await flush();
  assert.equal(h.writes.length, 0);
  await save;
});
test("successful save clears sensitive form fields and unlocks only after refreshing", async () => {
  const h = await harness();
  await h.ready();
  h.model.openCreate();
  Object.assign(h.model.form, {
    holderName: "Pessoa fictícia QA",
    holderDocument: "00000000000",
    accountNumber: "0000001",
    pixKey: "qa@example.com",
  });
  h.model.formRef.value = { validate: async () => true, resetValidation() {} };
  const save = h.model.save();
  await flush();
  assert.equal(h.writes.length, 1);
  h.writes[0].resolve({ id: "created" });
  await flush();
  assert.equal(h.model.formDialog.value, false);
  assert.equal(h.model.form.holderDocument, "");
  assert.equal(h.model.form.accountNumber, "");
  assert.equal(h.model.form.pixKey, null);
  assert.equal(h.model.saving.value, true);
  h.catalogs[1].resolve([{ id: "bank", name: "Banco QA" }]);
  h.lists[1].resolve([{ id: "created", accountNumberMasked: "****0001" }]);
  await save;
  assert.equal(h.model.saving.value, false);
  assert.equal(h.model.loading.value, false);
  assert.equal(h.model.accounts.value[0].id, "created");
  assert.equal(h.notifications.length, 1);
});
test("a late successful write cannot notify or refresh a disposed or changed session", async () => {
  for (const invalidate of ["dispose", "changeSession"]) {
    const h = await harness();
    await h.ready();
    const write = h.model.makePrimary({ id: "account" });
    h[invalidate]();
    h.writes[0].resolve({});
    await write;
    assert.equal(h.notifications.length, 0);
    assert.equal(h.lists.length, 1);
  }
});
const compiled = compileTemplate({
  source: descriptor.template.content,
  filename: "AccountBankSettingLayout.vue",
  id: "bank-state",
  compilerOptions: { mode: "function" },
});
assert.deepEqual(compiled.errors, []);
const render = new Function("Vue", compiled.code)(Vue);
test("existing fields are disabled during submission without introducing new actions", async () => {
  const passthrough = {
    setup:
      (_, { slots }) =>
      () =>
        Vue.h("div", slots.default?.()),
  };
  const state = {
    accounts: [],
    banks: [],
    loading: false,
    error: "",
    saving: true,
    formDialog: true,
    archiveDialog: false,
    editingId: null,
    form: {},
    masks: {},
    bankOptions: [],
    accountTypes: [],
    holderTypes: [],
    pixTypes: [],
    requiredRules: [],
    bankName() {},
    openCreate() {},
    openEdit() {},
    makePrimary() {},
    askArchive() {},
    closeForm() {},
    save() {},
    confirmArchive() {},
    load() {},
  };
  const app = Vue.createSSRApp({ render, setup: () => state });
  for (const name of [
    "QCard",
    "QCardSection",
    "QSeparator",
    "QCardActions",
    "QForm",
    "LabelForm",
    "QBanner",
    "QSpinner",
    "QAvatar",
    "QItemSection",
    "QItemLabel",
    "QBadge",
    "QItem",
    "QList",
  ])
    app.component(name, passthrough);
  app.component("QDialog", {
    props: ["modelValue"],
    setup:
      (p, { slots }) =>
      () =>
        p.modelValue ? Vue.h("div", slots.default?.()) : null,
  });
  app.component("QInput", {
    props: ["disable", "modelValue"],
    setup: (p) => () =>
      Vue.h("input", { disabled: p.disable, value: p.modelValue }),
  });
  app.component("QSelect", {
    props: ["disable"],
    setup: (p) => () => Vue.h("select", { disabled: p.disable }),
  });
  app.component("QCheckbox", {
    props: ["disable"],
    setup: (p) => () =>
      Vue.h("input", { type: "checkbox", disabled: p.disable }),
  });
  app.component("QBtn", {
    props: ["disable", "label"],
    setup: (p) => () => Vue.h("button", { disabled: p.disable }, p.label),
  });
  app.component("QIcon", { render: () => null });
  const html = await renderToString(app);
  assert.equal((html.match(/<(?:input|select)\b/g) || []).length, 11);
  for (const tag of html.match(/<(?:input|select)\b[^>]*>/g) || [])
    assert.match(tag, /disabled/);
  assert.match(html, />Salvar<\/button>/);
  assert.match(html, />Descartar<\/button>/);
});
