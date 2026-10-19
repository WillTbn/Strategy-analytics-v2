import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createPreferenceEditor,
  preferencePayload,
  primaryResidentialCountry,
} from "../src/services/preferenceEditor.js";

const values = {
  primaryCurrencyCode: "BRL",
  secondaryCurrencyCode: "USD",
  languageCode: "pt-PT",
  timeZoneId: "America/Sao_Paulo",
  theme: "Dark",
  countryId: null,
};
const catalog = {
  currencies: [
    { value: "BRL", label: "Real" },
    { value: "USD", label: "Dólar" },
  ],
  languages: [{ value: "pt-BR" }, { value: "pt-PT" }],
  timeZones: [{ value: "America/Sao_Paulo" }],
};
function harness(overrides = {}) {
  const writes = [];
  const state = {
    values: {},
    catalog: {},
    ready: false,
    loading: true,
    saving: false,
    loadError: "",
    saveError: "",
  };
  const editor = createPreferenceEditor({
    state,
    read: async () => ({ ...values }),
    readCatalog: async () => catalog,
    write: async (payload) => {
      writes.push(payload);
      return { ...payload };
    },
    errorMessage: (_, fallback) => fallback,
    ...overrides,
  });
  return { state, writes, ...editor };
}

test("a missing preference country reuses only the registered primary residential country on save", async () => {
  const profile = {
    addresses: [
      { kind: "Residential", isPrimary: true, countryId: "registered-country" },
    ],
  };
  const h = harness({ readProfile: async () => profile });
  await h.load();
  assert.equal(h.writes.length, 0);
  assert.equal(h.state.values.countryId, null);
  await h.select("languageCode", "pt-BR");
  assert.equal(h.writes[0].countryId, "registered-country");
});

test("country is never guessed from currency, language or an ambiguous address", () => {
  assert.equal(primaryResidentialCountry({ preferences: values }), null);
  assert.equal(
    primaryResidentialCountry({
      addresses: [{ kind: "Commercial", isPrimary: true, countryId: "other" }],
    }),
    null,
  );
  assert.equal(
    primaryResidentialCountry({
      addresses: [
        { kind: "Residential", isPrimary: false, countryId: "other" },
      ],
    }),
    null,
  );
  const address = {
    kind: "Residential",
    isPrimary: true,
    countryId: "country",
  };
  assert.equal(
    primaryResidentialCountry({ addresses: [address, address] }),
    null,
  );
});

test("an existing preference country is preserved and profile errors do not disable the form", async () => {
  const h = harness({
    read: async () => ({ ...values, countryId: "current-country" }),
    readProfile: async () => {
      throw Error("must not be called");
    },
  });
  await h.load();
  await h.select("languageCode", "pt-BR");
  assert.equal(h.writes[0].countryId, "current-country");
  const missingProfile = harness({
    readProfile: async () => {
      throw Error("unavailable");
    },
  });
  await missingProfile.load();
  assert.equal(missingProfile.state.ready, true);
});

test("loading reads the actual preferences without writing defaults", async () => {
  const h = harness();
  await h.load();
  assert.equal(h.state.values.languageCode, "pt-PT");
  assert.equal(h.state.values.theme, "Dark");
  assert.equal(h.writes.length, 0);
  assert.equal(h.state.loading, false);
});

test("changing a control persists the complete contract and keeps hidden metadata", async () => {
  const h = harness();
  await h.load();
  assert.equal(await h.select("languageCode", "pt-BR"), true);
  assert.deepEqual(h.writes[0], { ...values, languageCode: "pt-BR" });
  assert.equal(h.state.values.languageCode, "pt-BR");
  assert.equal(h.state.saving, false);
  assert.deepEqual(
    preferencePayload({ ...values, customerId: "omit", updatedAtUtc: "omit" }),
    values,
  );
});

test("failed writes restore confirmed values and allow retrying", async () => {
  let fail = true;
  const h = harness({
    write: async (payload) => {
      if (fail) throw Error("failed");
      return payload;
    },
  });
  await h.load();
  assert.equal(await h.select("languageCode", "pt-BR"), false);
  assert.equal(h.state.values.languageCode, "pt-PT");
  assert.match(h.state.saveError, /anteriores foram mantidas/);
  fail = false;
  assert.equal(await h.select("languageCode", "pt-BR"), true);
  assert.equal(h.state.saveError, "");
});

test("concurrent changes cannot overwrite a pending save", async () => {
  let finish;
  const h = harness({
    write: (payload) =>
      new Promise((resolve) => {
        finish = () => resolve(payload);
      }),
  });
  await h.load();
  const pending = h.select("languageCode", "pt-BR");
  assert.equal(await h.select("primaryCurrencyCode", "USD"), false);
  finish();
  await pending;
  assert.equal(h.state.values.languageCode, "pt-BR");
  assert.equal(h.state.values.primaryCurrencyCode, "BRL");
});

test("a failed read after an accepted save does not claim the old values were preserved", async () => {
  let reads = 0;
  const h = harness({
    read: async () => {
      if (++reads > 1) throw Error("unavailable");
      return { ...values };
    },
    write: async () => null,
  });
  await h.load();
  assert.equal(await h.select("languageCode", "pt-BR"), false);
  assert.equal(h.state.values.languageCode, "pt-BR");
  assert.match(h.state.saveError, /enviada.*confirmar/);
});

test("loading failures disable persistence without fabricated values", async () => {
  const h = harness({
    read: async () => {
      throw Error("forbidden");
    },
  });
  assert.equal(await h.load(), false);
  assert.equal(h.state.ready, false);
  assert.deepEqual(h.state.values, {});
  assert.equal(await h.select("languageCode", "pt-BR"), false);
  assert.equal(h.writes.length, 0);
});

test("unmounting discards late responses and unknown controls are not written", async () => {
  let finish;
  const h = harness({
    write: (payload) =>
      new Promise((resolve) => {
        finish = () => resolve(payload);
      }),
  });
  await h.load();
  assert.equal(await h.select("countryId", "invented"), false);
  assert.equal(await h.select("languageCode", "invented"), false);
  const pending = h.select("languageCode", "pt-BR");
  h.dispose();
  h.state.values = {};
  finish();
  assert.equal(await pending, false);
  assert.deepEqual(h.state.values, {});
});
