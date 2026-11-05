import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
async function service(consents, overview) {
  const context = vm.createContext({});
  const modules = {
    "./clientApi": {
      clientApi: {
        get: async (path) => {
          assert.equal(path, "/api/v1/client/profile/documents/overview");
          return { data: { data: await overview() } };
        },
      },
    },
    "./registrationConsents": { getOnboardingConsents: consents },
  };
  const module = new vm.SourceTextModule(
    readFileSync(
      new URL("../src/services/profileDocumentsService.js", import.meta.url),
      "utf8",
    ),
    { context },
  );
  await module.link(
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
  await module.evaluate();
  return module.namespace.listProfileTerms();
}
test("profile terms reuse published consent content and the platform files without moving asset or fiscal files", async () => {
  const result = await service(
    async () => ({
      items: [
        {
          versionId: "term",
          kind: "Agreement",
          content: { title: "Termos de Uso", body: "Conteúdo real" },
        },
        { versionId: "marketing", kind: "Consent" },
      ],
    }),
    async () => ({
      sections: [
        {
          code: "PLATFORM",
          items: [
            { documentId: "platform", documentTypeName: "Termo assinado" },
          ],
        },
        { code: "PATRIMONIO", items: [{ documentId: "asset" }] },
        { code: "FISCAL", items: [{ documentId: "tax" }] },
      ],
    }),
  );
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].versionId, "term");
  assert.equal(result.items[1].documentId, "platform");
  assert.equal(result.partialError, "");
});
test("one terms source failure retains the other source and exposes retry; both failures reject", async () => {
  const failure = async () => {
    throw Error("temporary read failure");
  };
  const result = await service(failure, async () => ({
    sections: [{ code: "PLATFORM", items: [{ documentId: "kept" }] }],
  }));
  assert.equal(result.items[0].documentId, "kept");
  assert.match(result.partialError, /Tente novamente/);
  await assert.rejects(service(failure, failure), /temporary read failure/);
});
