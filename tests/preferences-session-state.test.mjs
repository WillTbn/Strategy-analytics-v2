import test from "node:test";
import assert from "node:assert/strict";
import { createPreferenceEditor } from "../src/services/preferenceEditor.js";
const values = {
  primaryCurrencyCode: "BRL",
  secondaryCurrencyCode: "USD",
  languageCode: "pt-BR",
  timeZoneId: "America/Sao_Paulo",
  theme: "Dark",
  countryId: "br",
};
const catalog = {
  currencies: [{ value: "BRL" }, { value: "USD" }],
  languages: [{ value: "pt-BR" }, { value: "en-US" }],
  timeZones: [{ value: "America/Sao_Paulo" }],
};
const state = () => ({
  values: {},
  catalog: {},
  ready: false,
  loading: false,
  saving: false,
  loadError: "",
  saveError: "",
});
const setup = (options = {}) => {
  const target = state();
  return {
    state: target,
    ...createPreferenceEditor({
      state: target,
      read: async () => ({ ...values }),
      readCatalog: async () => catalog,
      write: async (p) => p,
      errorMessage: (_, fallback) => fallback,
      ...options,
    }),
  };
};
test("disposed editor does not read preferences after a late accepted write", async () => {
  let reads = 0,
    finish;
  const h = setup({
    read: async () => {
      reads++;
      return { ...values };
    },
    write: () => new Promise((resolve) => (finish = resolve)),
  });
  await h.load();
  const save = h.select("languageCode", "en-US");
  h.dispose();
  finish(null);
  assert.equal(await save, false);
  assert.equal(reads, 1);
});
test("disposed initial load does not read a residential profile from a later session", async () => {
  let finish,
    profileReads = 0;
  const h = setup({
    read: () => new Promise((resolve) => (finish = resolve)),
    readProfile: async () => {
      profileReads++;
      return { addresses: [] };
    },
  });
  const loading = h.load();
  h.dispose();
  finish({ ...values, countryId: null });
  assert.equal(await loading, false);
  assert.equal(profileReads, 0);
  assert.equal(h.state.ready, false);
});
test("changed session suppresses old initial preference and catalog results", async () => {
  let session = 0,
    finish;
  const h = setup({
    captureSession: () => session,
    isSessionCurrent: (captured) => captured === session,
    read: () => new Promise((resolve) => (finish = resolve)),
  });
  const loading = h.load();
  session++;
  finish({ ...values });
  assert.equal(await loading, false);
  assert.equal(h.state.ready, false);
  assert.deepEqual(h.state.values, {});
});
test("changed session after write prevents confirmation reads and success publication", async () => {
  for (const response of [null, { ...values, languageCode: "en-US" }]) {
    let session = 0,
      finish,
      reads = 0;
    const h = setup({
      captureSession: () => session,
      isSessionCurrent: (captured) => captured === session,
      read: async () => {
        reads++;
        return { ...values };
      },
      write: () => new Promise((resolve) => (finish = resolve)),
    });
    await h.load();
    const saving = h.select("languageCode", "en-US");
    session++;
    finish(response);
    assert.equal(await saving, false);
    assert.equal(reads, 1);
  }
});
test("unconfirmed accepted preferences disable further writes until a successful reload", async () => {
  let reads = 0,
    writes = 0,
    saved = { ...values };
  const h = setup({
    read: async () => {
      if (++reads === 2) throw Error("unavailable");
      return { ...saved };
    },
    write: async (payload) => {
      writes++;
      saved = { ...payload };
      return writes === 1 ? null : { ...payload };
    },
  });
  await h.load();
  assert.equal(await h.select("languageCode", "en-US"), false);
  assert.equal(h.state.ready, false);
  assert.match(h.state.saveError, /enviada.*confirmar/);
  assert.equal(await h.select("primaryCurrencyCode", "USD"), false);
  assert.equal(writes, 1);
  await h.load();
  assert.equal(h.state.ready, true);
  assert.equal(h.state.values.languageCode, "en-US");
  assert.equal(h.state.values.countryId, "br");
  assert.equal(h.state.values.theme, "Dark");
  assert.equal(await h.select("primaryCurrencyCode", "USD"), true);
  assert.equal(writes, 2);
});
test("disposed editor cannot be revived by a late load callback", async () => {
  let reads = 0;
  const h = setup({
    read: async () => {
      reads++;
      return { ...values };
    },
  });
  await h.load();
  h.dispose();
  assert.equal(await h.load(), false);
  assert.equal(await h.select("languageCode", "en-US"), false);
  assert.equal(reads, 1);
});

test("loaded preferences from an earlier session cannot be written by the next session", async () => {
  let session = 0,
    writes = 0;
  const h = setup({
    captureSession: () => session,
    isSessionCurrent: (captured) => captured === session,
    write: async (payload) => {
      writes++;
      return payload;
    },
  });
  await h.load();
  session++;
  assert.equal(await h.select("languageCode", "en-US"), false);
  assert.equal(writes, 0);
  assert.equal(h.state.values.languageCode, "pt-BR");
});
