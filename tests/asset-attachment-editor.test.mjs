import { createDocumentWindow } from "../src/services/documentWindow.js";
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parse } from "@vue/compiler-sfc";
import { ref } from "vue";
import { fileFormat } from "../src/services/profileDocumentation.js";
const source = parse(
  readFileSync(
    new URL(
      "../src/system/components/profile/AssetAttachmentEditor.vue",
      import.meta.url,
    ),
    "utf8",
  ),
).descriptor.scriptSetup.content;
async function harness() {
  let uploads = 0,
    links = 0,
    unlinks = [],
    failLink = true,
    session = 1;
  const dispose = [];
  const modules = {
    "src/services/clientAuthService": { getApiErrorMessage: e => e.message },
    "src/services/documentWindow": { createDocumentWindow },
    vue: { ref, onScopeDispose: (fn) => dispose.push(fn) },
    "src/services/clientProfileService": {
      listClientDocumentTypes: async () => [],
      uploadClientDocument: async () => {
        uploads++;
        return { id: "uploaded" };
      },
    },
    "src/services/clientAssetsService": {
      getClientAssetDocuments: async () => [],
      getClientAssetDocumentUrl: async () => ({
        url: "https://example.com/file",
      }),
      linkClientAssetDocument: async () => {
        links++;
        if (failLink) throw Error("temporary link failure");
      },
      unlinkClientAssetDocument: async (id, doc) => {
        unlinks.push([id, doc]);
      },
    },
    "src/services/clientApi": {
      captureClientSession: () => session,
      isClientSessionCurrent: (value) => value === session,
      assertClientSessionCurrent: (value) => assert.equal(value, session),
    },
    "src/services/profileDocumentation": { fileFormat },
  };
  const context = vm.createContext({
    defineProps: () => ({ assetId: null, disabled: false }),
    defineExpose: () => {},
    URL: { createObjectURL: () => "", revokeObjectURL: () => {} },
    FormData: class {
      append() {}
    },
    setTimeout,
  });
  const mod = new vm.SourceTextModule(
    source + "\nexport {items,removed,loading,save};",
    { context },
  );
  await mod.link(
    (name) =>
      new vm.SyntheticModule(
        Object.keys(modules[name]),
        function () {
          for (const [key, value] of Object.entries(modules[name]))
            this.setExport(key, value);
        },
        { context },
      ),
  );
  await mod.evaluate();
  for (let i = 0; i < 10; i++) await Promise.resolve();
  return {
    model: mod.namespace,
    counts: () => ({ uploads, links, unlinks }),
    allowLink: () => (failLink = false),
    dispose: () => dispose.forEach((fn) => fn()),
    changeSession: () => session++,
  };
}
test("asset upload retries the failed link using the uploaded ID and removes only the selected existing relationship", async () => {
  const h = await harness();
  h.model.items.value = [
    { key: "new", file: { name: "ficticio.pdf" }, documentTypeId: "IPTU" },
  ];
  h.model.removed.value = ["old-link"];
  await assert.rejects(h.model.save("asset"), /temporary link failure/);
  assert.equal(h.counts().uploads, 1);
  assert.equal(h.counts().unlinks.length, 0);
  h.allowLink();
  await h.model.save("asset");
  assert.equal(h.counts().uploads, 1);
  assert.equal(h.counts().links, 2);
  assert.deepEqual(h.counts().unlinks, [["asset", "old-link"]]);
  await h.model.save("asset");
  assert.equal(h.counts().links, 2);
});
test("disposing the editor prevents any late upload or unlink from starting", async () => {
  const h = await harness();
  h.model.items.value = [
    { key: "new", file: { name: "ficticio.pdf" }, documentTypeId: "IPTU" },
  ];
  h.dispose();
  await assert.rejects(h.model.save("asset"), /Edição encerrada/);
  assert.equal(h.counts().uploads, 0);
  assert.equal(h.counts().unlinks.length, 0);
});
