import test from "node:test";
import assert from "node:assert/strict";
import {
  countryName,
  localizedCountryCatalog,
} from "../src/services/countryNames.js";
import { assetPayload } from "../src/services/clientAssetModel.js";
test("country ISO labels follow the client language and keep unknown API labels", () => {
  assert.equal(
    countryName({ isoCode: "BR", name: "Brasil" }, "en-US"),
    "Brazil",
  );
  assert.equal(
    countryName({ isoCode: "DE", name: "Alemanha" }, "pt-BR"),
    "Alemanha",
  );
  assert.equal(
    countryName({ isoCode: "bad", name: "Nome recebido" }, "en-US"),
    "Nome recebido",
  );
  const catalog = {
    countries: [{ id: "id", isoCode: "US", name: "Estados Unidos" }],
  };
  assert.equal(
    localizedCountryCatalog(catalog, "en-US").countries[0].name,
    "United States",
  );
  assert.equal(catalog.countries[0].name, "Estados Unidos");
});
test("asset creation delegates currency to the account; editing preserves original currency", () => {
  const draft = {
    licensePlate: "QA00000",
    brand: "Marca QA",
    model: "Modelo QA",
    manufactureYear: 2020,
    declaredValue: "100.01",
    paidOff: true,
  };
  assert.equal(
    Object.hasOwn(assetPayload(draft, "Vehicle", null), "currencyId"),
    false,
  );
  assert.equal(
    assetPayload(draft, "Vehicle", "attempted-change", {
      currencyId: "original",
      status: "PaidOff",
    }).currencyId,
    "original",
  );
});

import vm from "node:vm";
import { readFileSync } from "node:fs";
import { profileEditingAllowed } from "../src/services/profilePresentation.js";
test("profile edit follows official lock including rejected identities and fails closed on unavailable status", () => {
  assert.equal(
    profileEditingAllowed({ submission: { profileEditingLocked: false } }),
    true,
  );
  assert.equal(
    profileEditingAllowed({
      submission: { status: "Rejected", profileEditingLocked: false },
    }),
    true,
  );
  assert.equal(
    profileEditingAllowed({ submission: { profileEditingLocked: true } }),
    false,
  );
  assert.equal(profileEditingAllowed(null), false);
});
test("bank create and edit strip all obsolete holder fields at the HTTP boundary", async () => {
  const calls = [],
    context = vm.createContext({});
  const mod = new vm.SourceTextModule(
    readFileSync(
      new URL("../src/services/clientProfileService.js", import.meta.url),
      "utf8",
    ),
    { context },
  );
  await mod.link((name) => {
    const values = name.includes("clientBankCatalog")
      ? { readBankCatalog: () => {} }
      : {
          clientApi: {
            post: async (path, data) => {
              calls.push({ path, data });
              return { data: { data: {} } };
            },
            patch: async (path, data) => {
              calls.push({ path, data });
              return { data: { data: {} } };
            },
          },
          captureClientSession: () => 0,
          assertClientSessionCurrent: () => {},
        };
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await mod.evaluate();
  const input = {
    bankId: "bank",
    branch: "1",
    accountNumber: "test",
    accountType: "Checking",
    isPrimary: true,
    holderType: "Organization",
    holderName: "obsolete",
    holderDocument: "obsolete",
  };
  await mod.namespace.createClientBankAccount(input);
  await mod.namespace.updateClientBankAccount("account", input);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.data.bankId, "bank");
    for (const key of ["holderType", "holderName", "holderDocument"])
      assert.equal(Object.hasOwn(call.data, key), false);
  }
  assert.equal(input.holderName, "obsolete");
});

import {
  clearRegistrationStep,
  rememberRegistrationStep,
  readRegistrationStep,
} from "../src/services/registrationResume.js";
test("confirmed submission clears only its account's remembered registration step", () => {
  const data = new Map();
  const storage = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  rememberRegistrationStep("one", "/cadastro/etapa-7", storage);
  rememberRegistrationStep("two", "/cadastro/etapa-6", storage);
  assert.equal(clearRegistrationStep("one", storage), true);
  assert.equal(readRegistrationStep("one", storage), null);
  assert.equal(readRegistrationStep("two", storage), "/cadastro/etapa-6");
});
