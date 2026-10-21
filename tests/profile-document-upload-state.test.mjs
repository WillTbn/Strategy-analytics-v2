import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import * as Vue from "vue";
import {
  profileDocumentRows,
  documentReplacementValues,
} from "../src/services/documentPresentation.js";
import { onboardingBlockMessage } from "../src/services/onboardingBlock.js";
const descriptor = parse(
  readFileSync(
    new URL(
      "../src/system/layouts/config/DocumentationSettingLayout.vue",
      import.meta.url,
    ),
    "utf8",
  ),
).descriptor;
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
async function harness() {
  const context = vm.createContext({
    FormData: class {
      fields = [];
      append(...args) {
        this.fields.push(args);
      }
    },
  });
  const reads = [],
    definitions = [],
    writes = [],
    notifications = [],
    dispose = [];
  let session = 0;
  const queue = (list, value) =>
    new Promise((resolve, reject) => list.push({ resolve, reject, value }));
  const methods = [
    "getClientDocumentOverview",
    "getClientDocumentProgress",
    "listClientDocuments",
    "listClientDocumentTypes",
  ];
  const services = {
    ...Object.fromEntries(methods.map((key) => [key, () => queue(reads, key)])),
    getClientDocumentDataDefinition: (type, country) =>
      queue(definitions, { type, country }),
    uploadClientDocument: (data) => queue(writes, { kind: "upload", data }),
    replaceClientDocument: (id, data) =>
      queue(writes, { kind: "replace", id, data }),
    downloadClientDocument: () => {
      throw Error("Unexpected download");
    },
    getClientDocumentTemporaryUrl: () => {
      throw Error("Unexpected link");
    },
  };
  const modules = {
    vue: {
      computed: Vue.computed,
      reactive: Vue.reactive,
      ref: Vue.ref,
      onScopeDispose: (fn) => dispose.push(fn),
    },
    "src/services/documentPresentation": {
      profileDocumentRows,
      documentReplacementValues,
    },
    "src/services/onboardingBlock": { onboardingBlockMessage },
    "src/system/components/form/LabelForm.vue": { default: {} },
    "src/composables/useNotify": {
      default: () => ({
        successNotify: (v) => notifications.push(v),
        errorNotify: (v) => notifications.push(v),
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
      "\nexport { load, loading, error, guardBlocked, overview, progress, documents, types, form, formRef, dialog, saving, definition, openUpload, openReplace, closeDialog, typeChanged, loadDefinition, save };",
    { context },
  );
  await mod.link((specifier) => {
    const values = modules[specifier];
    assert.ok(values, specifier);
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await mod.evaluate();
  const settle = (offset = 0) => {
    reads[offset].resolve({ totalDocuments: 0 });
    reads[offset + 1].resolve({ percentage: 100 });
    reads[offset + 2].resolve([]);
    reads[offset + 3].resolve([
      { id: "type", name: "RG", countries: [{ id: "br", name: "Brasil" }] },
    ]);
  };
  return {
    model: mod.namespace,
    reads,
    definitions,
    writes,
    notifications,
    settle,
    ready: async () => {
      settle();
      await flush();
    },
    dispose: () => dispose.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
test("upload and replacement lock before validation and preserve drafts after failure", async () => {
  for (const replace of [false, true]) {
    const h = await harness();
    await h.ready();
    if (replace)
      h.model.openReplace({
        id: "rejected",
        documentTypeId: "type",
        countryId: "br",
        issuedOn: "2025-01-01",
      });
    else h.model.openUpload();
    const file = { name: "ficticio.pdf", type: "application/pdf", size: 10 };
    Object.assign(h.model.form, {
      documentTypeId: "type",
      countryId: "br",
      file,
    });
    const checks = [];
    h.model.formRef.value = {
      validate: () => new Promise((resolve) => checks.push(resolve)),
      resetValidation() {},
    };
    const first = h.model.save(),
      second = h.model.save();
    assert.equal(checks.length, 1);
    checks[0](true);
    await flush();
    assert.equal(h.writes.length, 1);
    assert.equal(h.writes[0].value.kind, replace ? "replace" : "upload");
    if (replace) assert.equal(h.writes[0].value.id, "rejected");
    h.model.closeDialog();
    assert.equal(h.model.dialog.value, true);
    h.writes[0].reject(Error("temporary failure"));
    await Promise.all([first, second]);
    assert.equal(h.model.saving.value, false);
    assert.equal(h.model.form.file.name, "ficticio.pdf");
    assert.equal(h.model.dialog.value, true);
  }
});
test("a definition for an old country cannot replace the current instructions", async () => {
  const h = await harness();
  await h.ready();
  h.model.openUpload();
  Object.assign(h.model.form, { documentTypeId: "type", countryId: "br" });
  const old = h.model.loadDefinition();
  h.model.form.countryId = "pt";
  const latest = h.model.loadDefinition();
  h.definitions[1].resolve({ description: "Portugal" });
  await latest;
  h.definitions[0].resolve({ description: "Brasil" });
  await old;
  assert.equal(h.model.definition.value.description, "Portugal");
});
test("closing a dialog invalidates definitions, including old errors", async () => {
  for (const fail of [false, true]) {
    const h = await harness();
    await h.ready();
    h.model.openUpload();
    Object.assign(h.model.form, { documentTypeId: "type", countryId: "br" });
    const request = h.model.loadDefinition();
    h.model.closeDialog();
    if (fail) h.definitions[0].reject(Error("old instructions error"));
    else h.definitions[0].resolve({ description: "old instructions" });
    await request;
    assert.equal(h.model.definition.value, null);
    assert.equal(h.notifications.length, 0);
  }
});
test("a superseded load cannot publish old documents or clear a newer failure", async () => {
  const h = await harness(),
    retry = h.model.load();
  h.reads[4].reject(Error("latest failure"));
  for (let i = 5; i < 8; i++) h.reads[i].resolve([]);
  await retry;
  h.settle(0);
  await flush();
  assert.equal(h.model.error.value, "latest failure");
  assert.equal(h.model.documents.value.length, 0);
  assert.equal(h.model.types.value.length, 0);
  h.model.openUpload();
  assert.equal(h.model.dialog.value, false);
});
test("session change during validation prevents upload", async () => {
  const h = await harness();
  await h.ready();
  h.model.openUpload();
  let finish;
  h.model.formRef.value = {
    validate: () => new Promise((resolve) => (finish = resolve)),
  };
  const request = h.model.save();
  h.changeSession();
  finish(true);
  await flush();
  assert.equal(h.writes.length, 0);
  await request;
});
test("successful upload clears the file and closes before refreshing", async () => {
  const h = await harness();
  await h.ready();
  h.model.openUpload();
  Object.assign(h.model.form, {
    documentTypeId: "type",
    file: { name: "ficticio.pdf" },
  });
  h.model.formRef.value = { validate: async () => true, resetValidation() {} };
  const request = h.model.save();
  await flush();
  h.writes[0].resolve({ id: "new" });
  await flush();
  assert.equal(h.model.form.file, null);
  assert.equal(h.model.dialog.value, false);
  assert.equal(h.model.saving.value, true);
  h.settle(4);
  await request;
  assert.equal(h.model.saving.value, false);
  assert.equal(h.notifications.length, 1);
});
test("leaving the view suppresses late upload notifications and refreshes", async () => {
  const h = await harness();
  await h.ready();
  h.model.openUpload();
  Object.assign(h.model.form, {
    documentTypeId: "type",
    file: { name: "ficticio.pdf" },
  });
  h.model.formRef.value = { validate: async () => true, resetValidation() {} };
  const request = h.model.save();
  await flush();
  h.dispose();
  h.writes[0].resolve({ id: "new" });
  await flush();
  assert.equal(h.notifications.length, 0);
  assert.equal(h.reads.length, 4);
  assert.equal(h.model.form.file, null);
  await request;
});
