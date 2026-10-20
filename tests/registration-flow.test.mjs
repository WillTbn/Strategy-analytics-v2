import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { ref, reactive } from "vue";
import * as integration from "../src/services/registrationIntegration.js";
import { newRegistrationPersonal } from "../src/services/registrationPersonal.js";
import { newRegistrationEmployment } from "../src/services/registrationEmployment.js";
import { newRegistrationTrustedContacts } from "../src/services/registrationTrustedContacts.js";
import { newRegistrationDocuments } from "../src/services/registrationDocuments.js";

async function harness() {
  const mounted = [];
  let sessionVersion = 0;
  const drafts = {
    personalPreviewDraft: ref(newRegistrationPersonal()),
    employmentDraft: ref(newRegistrationEmployment()),
    trustedContactsDraft: ref(newRegistrationTrustedContacts()),
    documentDrafts: reactive({}),
    activeDocumentVariant: ref(null),
  };
  const responses = {
    professional: { occupation: "Atividade existente" },
    financial: { individualMonthlyIncome: "1234.56", declaredNetWorth: 0 },
    contacts: [{ id: "contact", name: "Contato teste", phoneNumber: "123" }],
  };
  const read = (key) => async () => {
    if (responses[key] instanceof Error) throw responses[key];
    return responses[key];
  };
  const profile = { customerId: "client", contacts: [], personalDetails: {} };
  const exports = {
    ref,
    reactive,
    onMounted: (fn) => mounted.push(fn),
    onBeforeUnmount: () => {},
    useRouter: () => ({ push: async () => {} }),
    useRoute: () => ({ params: {}, query: {} }),
    getClientProfile: async () => profile,
    getPreferenceCatalog: async () => ({}),
    getOnboardingStatus: async () => ({}),
    getClientProfessionalProfile: read("professional"),
    getClientFinancialProfile: read("financial"),
    getClientTrustedContacts: read("contacts"),
    listClientDocumentTypes: async () => [],
    getClientDocumentDataDefinition: async () => ({}),
    captureClientSession: () => sessionVersion,
    isClientSessionCurrent: (snapshot) => snapshot === sessionVersion,
    assertClientSessionCurrent: () => {},
    registrationWrite: async () => {
      throw Error("Unexpected write");
    },
    registrationUpload: async () => {
      throw Error("Unexpected upload");
    },
    resetRegistrationUploads: () => {},
    ...integration,
    ...drafts,
    newRegistrationPersonal,
    newRegistrationEmployment,
    newRegistrationTrustedContacts,
    newRegistrationDocuments,
  };
  const context = vm.createContext({});
  const mod = new vm.SourceTextModule(
    await readFile(
      new URL(
        "../src/composables/system/useRegistrationFlow.js",
        import.meta.url,
      ),
      "utf8",
    ),
    { context },
  );
  await mod.link(
    () =>
      new vm.SyntheticModule(
        Object.keys(exports),
        function () {
          for (const [key, value] of Object.entries(exports))
            this.setExport(key, value);
        },
        { context },
      ),
  );
  await mod.evaluate();
  return {
    ...drafts,
    responses,
    newSession: () => {
      sessionVersion++;
    },
    state: mod.namespace.registrationContext,
    async mount(step) {
      const flow = mod.namespace.useRegistrationFlow(step);
      await mounted.pop()();
      return flow;
    },
  };
}

test("review hydrates successful financial data independently from a failed professional read", async () => {
  const h = await harness();
  h.responses.professional = Error("unavailable");
  const flow = await h.mount(7);
  assert.equal(flow.ready.value, true);
  assert.equal(h.employmentDraft.value.individualMonthlyIncome, "1234,56");
  assert.equal(h.employmentDraft.value.declaredNetWorth, "0");
  assert.equal(h.state.readErrors.professional, true);
  assert.equal(h.trustedContactsDraft.value.contacts[0].id, "contact");
});

test("failed review reads preserve drafts and report all failed sections together", async () => {
  const h = await harness();
  h.responses.professional = Error("professional");
  h.responses.financial = Error("financial");
  h.responses.contacts = Error("contacts");
  await h.mount(7);
  h.employmentDraft.value.individualMonthlyIncome = "9,99";
  h.trustedContactsDraft.value = {
    noContact: true,
    contacts: [{ name: "Rascunho" }],
  };
  await h.mount(7);
  assert.equal(h.employmentDraft.value.individualMonthlyIncome, "9,99");
  assert.equal(h.trustedContactsDraft.value.noContact, true);
  assert.equal(h.trustedContactsDraft.value.contacts[0].name, "Rascunho");
  assert.match(
    h.state.notices[7],
    /atividade trabalhista, dados financeiros, contatos de confiança/,
  );
});

test("successful retry clears unavailable state without overwriting hydrated financial edits", async () => {
  const h = await harness();
  h.responses.professional = Error("professional");
  await h.mount(7);
  h.employmentDraft.value.individualMonthlyIncome = "9,99";
  h.responses.professional = { occupation: "Atividade recuperada" };
  await h.mount(7);
  assert.equal(h.employmentDraft.value.individualMonthlyIncome, "9,99");
  assert.equal(h.employmentDraft.value.occupation, "Atividade recuperada");
  assert.equal(Object.keys(h.state.readErrors).length, 0);
  assert.equal(h.state.notices[7], "");
});

test("an unavailable financial read blocks its editing step without clearing successful occupation", async () => {
  const h = await harness();
  h.responses.financial = Error("financial");
  const flow = await h.mount(5);
  assert.equal(flow.ready.value, false);
  assert.equal(h.employmentDraft.value.occupation, "Atividade existente");
  assert.match(h.state.notices[5], /dados financeiros/);
});

test("logging in again to the same customer reloads saved data instead of previous-session drafts", async () => {
  const h = await harness();
  await h.mount(5);
  h.employmentDraft.value.individualMonthlyIncome = "99,99";
  h.personalPreviewDraft.value.birthCity = "Unsaved";
  h.documentDrafts.br = { files: { front: { name: "unsaved.pdf" } } };
  h.newSession();
  await h.mount(5);
  assert.equal(h.employmentDraft.value.individualMonthlyIncome, "1234,56");
  assert.equal(h.personalPreviewDraft.value.birthCity, "");
  assert.equal(Object.keys(h.documentDrafts).length, 0);
});

test("an old mounted stage cannot write after logout and a new login to the same customer", async () => {
  const h = await harness();
  const flow = await h.mount(5);
  h.newSession();
  await flow.save();
  assert.match(h.state.notices[5], /sessão mudou/);
});
