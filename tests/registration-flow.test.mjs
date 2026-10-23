import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { ref, reactive } from "vue";
import * as consentRules from "../src/services/registrationConsentRules.js";
import * as resumeDocuments from "../src/services/registrationDocumentResume.js";
import * as integration from "../src/services/registrationIntegration.js";
import { newRegistrationPersonal } from "../src/services/registrationPersonal.js";
import { newRegistrationEmployment } from "../src/services/registrationEmployment.js";
import { newRegistrationTrustedContacts } from "../src/services/registrationTrustedContacts.js";
import { newRegistrationDocuments } from "../src/services/registrationDocuments.js";

// Keep one VM realm alive; each SourceTextModule still owns isolated flow state.
const testContext = vm.createContext({ Date });

async function harness({ allowWrites = false } = {}) {
  const writes = [],
    destinations = [];
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
  const profile = {
    customerId: "client",
    contacts: [],
    personalDetails: {},
    preferences: {
      primaryCurrencyCode: "BRL",
      secondaryCurrencyCode: "USD",
      countryId: "BR-id",
      countryIsoCode: "BR",
      languageCode: "pt-BR",
      timeZoneId: "America/Sao_Paulo",
      theme: "Dark",
    },
  };
  const exports = {
    useUserStore: () => ({ data: { id: "user" } }),
    clearRegistrationStep: () => {},
    ref,
    reactive,
    onMounted: (fn) => mounted.push(fn),
    onBeforeUnmount: () => {},
    useRouter: () => ({
      push: async (to) => destinations.push(to),
      replace: async (to) => destinations.push(to),
    }),
    useRoute: () => ({ params: {}, query: {} }),
    getClientProfile: async () => profile,
    getPreferenceCatalog: async () => ({
      currencies: [
        { value: "BRL", label: "Real Brasileiro" },
        { value: "USD", label: "Dólar Americano" },
      ],
    }),
    getOnboardingStatus: async () => responses.onboarding || {},
    getOnboardingConsents: async () => {
      if (responses.consents instanceof Error) throw responses.consents;
      return (
        responses.consents || {
          context: "Onboarding",
          items: ["terms-of-use", "privacy-policy"].map((code) => ({
            code,
            kind: "Agreement",
            versionId: code,
            status: "Accepted",
            content: { body: "Texto atual", locale: "pt-BR" },
          })),
        }
      );
    },
    getClientProfessionalProfile: read("professional"),
    getClientFinancialProfile: read("financial"),
    getClientTrustedContacts: read("contacts"),
    getClientTrustedContactDeclaration: async () =>
      responses.declaration || { hasNoTrustedContact: false },
    listClientDocumentTypes: async () => responses.types || [],
    getClientDocumentDataDefinition: async () => ({}),
    captureClientSession: () => sessionVersion,
    isClientSessionCurrent: (snapshot) => snapshot === sessionVersion,
    assertClientSessionCurrent: () => {},
    registrationWrite: async (method, path, body) => {
      if (!allowWrites) throw Error("Unexpected write");
      writes.push({ method, path, body });
      if (responses.failWrite === path) throw Error("Write failed");
      if (path.endsWith("/trusted-contacts") && method === "post") {
        const created = {
          ...body,
          id: `contact-${responses.contacts.length + 1}`,
        };
        responses.contacts.push(created);
        return created;
      }
      if (path.endsWith("/professional-profile")) responses.professional = body;
      if (path.endsWith("/financial-profile")) responses.financial = body;
      if (path.endsWith("/preferences"))
        profile.preferences = { ...profile.preferences, ...body };
      if (path.endsWith("/onboarding/submit"))
        return (
          responses.submission || {
            status: "Submitted",
            submittedAtUtc: "2026-10-22T20:00:00Z",
            profileEditingLocked: true,
          }
        );
      if (path.endsWith("/consents/decisions")) {
        responses.consents = {
          ...responses.consents,
          items: responses.consents.items.map((item) =>
            body.decisions.some((d) => d.versionId === item.versionId)
              ? { ...item, status: "Accepted" }
              : item,
          ),
        };
        return responses.consents;
      }
      return body;
    },
    registrationUpload: async () => {
      throw Error("Unexpected upload");
    },
    resetRegistrationUploads: () => {},
    ...consentRules,
    ...integration,
    ...resumeDocuments,
    ...drafts,
    newRegistrationPersonal,
    newRegistrationEmployment,
    newRegistrationTrustedContacts,
    newRegistrationDocuments,
  };
  const context = testContext;
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
    profile,
    writes,
    destinations,
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

test("new contacts use POST and retain IDs on partial failure and retry", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.contacts = [
    { id: "existing", name: "Existing", phoneNumber: "11999990000" },
  ];
  const flow = await h.mount(6);
  h.trustedContactsDraft.value.contacts = [
    { name: "New", phoneNumber: "11999990001" },
    { id: "existing", name: "Edited", phoneNumber: "11999990002" },
  ];
  h.responses.failWrite = "/api/v1/client/profile/trusted-contacts/existing";
  await flow.save();
  assert.equal(h.writes[0].method, "post");
  assert.equal(h.writes[0].path, "/api/v1/client/profile/trusted-contacts");
  assert.ok(h.trustedContactsDraft.value.contacts[0].id);
  h.responses.failWrite = null;
  await flow.save();
  assert.equal(h.writes.filter((w) => w.method === "post").length, 1);
  assert.ok(h.writes.every((w) => !w.path.includes("undefined")));
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-7");
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
  const flow = await h.mount(4);
  assert.equal(flow.ready.value, false);
  assert.equal(h.employmentDraft.value.occupation, "Atividade existente");
  assert.match(h.state.notices[4], /dados financeiros/);
});

test("logging in again to the same customer reloads saved data instead of previous-session drafts", async () => {
  const h = await harness();
  await h.mount(4);
  h.employmentDraft.value.individualMonthlyIncome = "99,99";
  h.personalPreviewDraft.value.birthCity = "Unsaved";
  h.documentDrafts.br = { files: { front: { name: "unsaved.pdf" } } };
  h.newSession();
  await h.mount(4);
  assert.equal(h.employmentDraft.value.individualMonthlyIncome, "1234,56");
  assert.equal(h.personalPreviewDraft.value.birthCity, "");
  assert.equal(h.documentDrafts.br.files.front, undefined);
});

test("an old mounted stage cannot write after logout and a new login to the same customer", async () => {
  const h = await harness();
  const flow = await h.mount(4);
  h.newSession();
  await flow.save();
  assert.match(h.state.notices[4], /sessão mudou/);
});

test("new stage 4 writes professional, financial and both preferences before entering documents", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.professional = null;
  h.responses.financial = null;
  h.profile.preferences.primaryCurrencyCode = null;
  h.profile.preferences.secondaryCurrencyCode = null;
  const flow = await h.mount(4);
  Object.assign(h.employmentDraft.value, {
    occupation: " Analista QA ",
    employerName: " Empresa QA ",
    individualMonthlyIncome: "1.234,56",
    householdMonthlyIncome: "",
    declaredNetWorth: "0",
    primaryCurrencyCode: "BRL",
    secondaryCurrencyCode: "USD",
  });
  await flow.save();
  assert.deepEqual(
    h.writes.map((call) => call.path.split("/").at(-1)),
    ["professional-profile", "financial-profile"],
  );
  assert.equal(h.writes[0].body.occupation, "Analista QA");
  assert.equal(h.writes[0].body.employerName, "Empresa QA");
  assert.equal(h.writes[0].body.isCurrent, true);
  assert.equal(h.writes[1].body.householdMonthlyIncome, null);
  assert.equal(h.writes[1].body.declaredNetWorth, "0.00");
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-5");
});
test("server-defaulted currencies do not block professional step or cause a preference write", async () => {
  const h = await harness({ allowWrites: true });
  h.profile.preferences.secondaryCurrencyCode = null;
  const flow = await h.mount(4);
  await flow.save();
  assert.equal(h.writes.length, 2);
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-5");
});
test("a financial write failure keeps drafts and retry skips confirmed professional data", async () => {
  const h = await harness({ allowWrites: true });
  const flow = await h.mount(4);
  h.responses.failWrite = "/api/v1/client/profile/financial-profile";
  await flow.save();
  assert.equal(h.destinations.length, 0);
  assert.equal(h.employmentDraft.value.occupation, "Atividade existente");
  h.responses.failWrite = null;
  await flow.save();
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-5");
  assert.equal(
    h.writes.filter((call) => call.path.endsWith("/professional-profile"))
      .length,
    1,
  );
  assert.equal(
    h.writes.filter((call) => call.path.endsWith("/financial-profile")).length,
    2,
  );
  assert.equal(
    h.writes.filter((call) => call.path.endsWith("/preferences")).length,
    0,
  );
});
test("a resumed documents deep link returns to stage 4 if professional prerequisites are missing", async () => {
  const h = await harness();
  h.responses.professional = null;
  const flow = await h.mount(5);
  assert.equal(flow.ready.value, false);
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-4");
  assert.equal(h.writes.length, 0);
});

test("stage five restores masked document fields and reuses confirmed evidence without writing a masked number", async () => {
  const h = await harness({ allowWrites: true });
  h.profile.addresses = [
    {
      kind: "Residential",
      isPrimary: true,
      line1: "Rua QA, 100",
      city: "Teste",
    },
  ];
  h.profile.identificationDocuments = {
    documents: [
      {
        documentCode: "RG",
        documentId: "typed",
        documentTypeId: "rg",
        source: "ProvidedDocument",
        status: "Active",
        countryIsoCode: "BR",
        numberMasked: "***0001",
        issuer: "ORGAO QA",
        issuedOn: "2025-01-01",
        evidenceSummary: { count: 2, latestStatus: "Uploaded" },
      },
    ],
  };
  h.responses.types = [{ code: "RG", id: "rg" }];
  const flow = await h.mount(5);
  assert.equal(
    h.documentDrafts.br.details[h.documentDrafts.br.type].documentNumber,
    "***0001",
  );
  assert.equal(
    h.documentDrafts.br.details[h.documentDrafts.br.type].issuer,
    "ORGAO QA",
  );
  assert.equal(
    h.documentDrafts.br.details[h.documentDrafts.br.type].issuedDate,
    "01/01/2025",
  );
  await flow.save();
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-6");
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].path, "/api/v1/client/profile");
});

test("no trusted contact declaration persists and restores on another session", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.contacts = [];
  h.responses.declaration = { hasNoTrustedContact: true };
  const flow = await h.mount(6);
  assert.equal(h.trustedContactsDraft.value.noContact, true);
  await flow.save();
  assert.equal(h.writes.length, 1);
  assert.equal(
    h.writes[0].path,
    "/api/v1/client/profile/trusted-contacts/declaration",
  );
  assert.equal(h.writes[0].body.hasNoTrustedContact, true);
  assert.equal(h.destinations.at(-1), "/cadastro/etapa-7");
});
test("final submission requires explicit truthfulness and sends only the confirmed flag", async () => {
  const h = await harness({ allowWrites: true });
  const flow = await h.mount(7);
  await flow.save();
  assert.equal(h.writes.length, 0);
  await flow.save({ truthfulnessConfirmed: true });
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].path, "/api/v1/client/onboarding/submit");
  assert.equal(
    JSON.stringify(h.writes[0].body),
    '{"truthfulnessConfirmed":true}',
  );
  assert.equal(h.destinations.at(-1), "/cadastro/enviado");
});
test("official profile lock prevents writes and preserves registration drafts", async () => {
  const h = await harness({ allowWrites: true });
  const flow = await h.mount(4);
  h.responses.onboarding = { submission: { profileEditingLocked: true } };
  await flow.save();
  assert.equal(h.writes.length, 0);
  assert.match(h.state.notices[4], /análise/);
});

const pendingConsents = () => ({
  context: "Onboarding",
  isSatisfied: false,
  items: ["terms-of-use", "privacy-policy", "marketing-communications"].map(
    (code) => ({
      code,
      kind: code === "marketing-communications" ? "Consent" : "Agreement",
      versionId: code,
      status: "Pending",
      content: { body: "Texto atual", locale: "pt-BR" },
    }),
  ),
});
test("guard consent flag never bypasses actual versioned acceptance", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.onboarding = { requiredConsentsCompleted: true };
  h.responses.consents = pendingConsents();
  const flow = await h.mount(7);
  await flow.save({ truthfulnessConfirmed: true });
  assert.equal(h.writes.length, 0);
  assert.match(h.state.notices[7], /aceite/);
});
test("explicit consent saves only legal agreements before submission", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.consents = pendingConsents();
  const flow = await h.mount(7);
  await flow.save({
    truthfulnessConfirmed: true,
    consentAcceptance: {
      accepted: true,
      versionIds: ["terms-of-use", "privacy-policy"],
    },
  });
  assert.equal(h.writes.length, 2);
  assert.equal(h.writes[0].path, "/api/v1/client/consents/decisions");
  assert.deepEqual(
    h.writes[0].body.decisions.map((d) => d.versionId),
    ["terms-of-use", "privacy-policy"],
  );
  assert.equal(h.responses.consents.items[2].status, "Pending");
  assert.equal(h.destinations.at(-1), "/cadastro/enviado");
});
test("a policy version changed after reading requires a fresh acceptance", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.consents = pendingConsents();
  const flow = await h.mount(7);
  h.responses.consents.items[0].versionId = "new-version";
  await flow.save({
    truthfulnessConfirmed: true,
    consentAcceptance: {
      accepted: true,
      versionIds: ["terms-of-use", "privacy-policy"],
    },
  });
  assert.equal(h.writes.length, 0);
  assert.match(h.state.notices[7], /termos atuais/);
});
test("failed requirements read never submits and keeps review drafts", async () => {
  const h = await harness({ allowWrites: true });
  const flow = await h.mount(7);
  h.responses.consents = Error("Consulta indisponível");
  await flow.save({ truthfulnessConfirmed: true });
  assert.equal(h.writes.length, 0);
  assert.equal(h.destinations.length, 0);
});
test("unconfirmed submission never navigates to success", async () => {
  const h = await harness({ allowWrites: true });
  h.responses.submission = { status: "NotSubmitted" };
  const flow = await h.mount(7);
  await flow.save({ truthfulnessConfirmed: true });
  assert.equal(h.destinations.length, 0);
  assert.match(h.state.notices[7], /confirmar o envio/);
});
test("an already locked submitted registration is never submitted twice", async () => {
  const h = await harness({ allowWrites: true });
  const flow = await h.mount(7);
  h.responses.onboarding = {
    submission: {
      status: "Submitted",
      submittedAtUtc: "2026-10-22T20:00:00Z",
      profileEditingLocked: true,
    },
  };
  await flow.save({ truthfulnessConfirmed: true });
  assert.equal(h.writes.length, 0);
  assert.equal(h.destinations.at(-1), "/cadastro/enviado");
});
