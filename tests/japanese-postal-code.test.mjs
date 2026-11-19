import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createJapanesePostalReader,
  createJapaneseRegistrationPostalLookup,
  normalizeJapanesePostalCode,
  JAPANESE_POSTAL_DATA,
} from "../src/services/japanesePostalCode.js";
import { registrationSubdivisions } from "../src/services/registrationSubdivisions.js";
const dir = "public" + JAPANESE_POSTAL_DATA;
const readJson = (file) => JSON.parse(readFileSync(dir + file, "utf8"));
function reader() {
  const calls = [];
  return {
    calls,
    read: createJapanesePostalReader({
      fetcher: async (url, options) => {
        calls.push({ url, options });
        return {
          ok: true,
          json: async () => JSON.parse(readFileSync("public" + url, "utf8")),
        };
      },
    }),
  };
}
function controller(read) {
  const values = {
      postalCode: "100-0001",
      region: "01",
      city: "Manual",
      street: "Endereço manual",
      complement: "Sala 2",
    },
    state = { loading: false, error: "" };
  return {
    values,
    state,
    ...createJapaneseRegistrationPostalLookup({ values, state, read }),
  };
}
const defer = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { resolve, reject, promise };
};
test("Japanese postal format preserves leading zeros and normalizes the local keyboard", () => {
  assert.equal(normalizeJapanesePostalCode("０６０－００００"), "0600000");
  assert.equal(normalizeJapanesePostalCode("1000001"), "1000001");
  for (const value of [
    "",
    null,
    "100000",
    "10000011",
    "100 0001",
    "abc0001",
    "../1000001",
  ])
    assert.equal(normalizeJapanesePostalCode(value), null);
});
test("official nationwide dataset has valid locations and keeps every ambiguous municipality", () => {
  const catalog = readJson("catalog.json"),
    manifest = readJson("manifest.json"),
    prefectures = new Set();
  let total = 0,
    ambiguous = 0;
  for (const prefix of catalog.prefixes) {
    assert.match(prefix, /^\d{2}$/);
    const shard = readJson(prefix + ".json");
    for (const [suffix, id] of Object.entries(shard)) {
      assert.match(suffix, /^\d{5}$/);
      total++;
      const ids = Array.isArray(id) ? id : [id];
      if (Array.isArray(id)) {
        assert.ok(id.length > 1);
        assert.equal(new Set(id).size, id.length);
        ambiguous++;
      }
      for (const i of ids) {
        assert.ok(
          Number.isInteger(i) && i >= 0 && i < catalog.municipalities.length,
        );
        const [code, city] = catalog.municipalities[i];
        assert.ok(registrationSubdivisions.JP.some((p) => p.value === code));
        assert.ok(city.trim());
        prefectures.add(code);
      }
    }
  }
  assert.equal(total, manifest.postalCodes);
  assert.ok(total > 100000);
  assert.equal(ambiguous, manifest.ambiguousPostalCodes);
  assert.equal(prefectures.size, 47);
});
test("actual data fills Tokyo, Osaka and a leading-zero Hokkaido code without auth or vendor requests", async () => {
  const f = reader();
  assert.deepEqual(await f.read("100-0001"), {
    status: "found",
    postalCode: "1000001",
    regionCode: "13",
    city: "千代田区",
  });
  assert.equal((await f.read("0600000")).regionCode, "01");
  assert.equal((await f.read("5300001")).regionCode, "27");
  for (const { url, options } of f.calls) {
    assert.ok(url.startsWith(JAPANESE_POSTAL_DATA));
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers.Authorization, undefined);
    assert.ok(!url.includes("1000001"));
  }
  const count = f.calls.length;
  await f.read("1000002");
  assert.equal(f.calls.length, count);
});
test("not found and actual ambiguous codes never pick the first municipality", async () => {
  const f = reader();
  assert.equal((await f.read("9999999")).status, "not-found");
  const catalog = readJson("catalog.json");
  let code;
  for (const prefix of catalog.prefixes) {
    const hit = Object.entries(readJson(prefix + ".json")).find(([, id]) =>
      Array.isArray(id),
    );
    if (hit) {
      code = prefix + hit[0];
      break;
    }
  }
  assert.ok(code);
  assert.equal((await f.read(code)).status, "ambiguous");
});
test("failed static requests are evicted and allow retry", async () => {
  let failed = true,
    count = 0;
  const read = createJapanesePostalReader({
    fetcher: async (url) => {
      count++;
      if (failed) return { ok: false };
      return {
        ok: true,
        json: async () => JSON.parse(readFileSync("public" + url, "utf8")),
      };
    },
  });
  await assert.rejects(read("1000001"));
  failed = false;
  assert.equal((await read("1000001")).status, "found");
  assert.equal(count, 3);
});
test("controller changes only province/city and deduplicates a successful code", async () => {
  let calls = 0;
  const f = controller(async (code) => {
    calls++;
    return {
      status: "found",
      postalCode: code,
      regionCode: "13",
      city: "千代田区",
    };
  });
  await f.lookup();
  assert.equal(f.values.region, "13");
  assert.equal(f.values.postalCode, "100-0001");
  assert.equal(f.values.city, "千代田区");
  assert.equal(f.values.street, "Endereço manual");
  assert.equal(f.values.complement, "Sala 2");
  f.values.city = "Correção manual";
  await f.lookup();
  assert.equal(calls, 1);
  assert.equal(f.values.city, "Correção manual");
});
test("controller ignores late responses after a new code, country or unmount invalidation", async () => {
  const pending = defer(),
    f = controller(() => pending.promise);
  const task = f.lookup();
  f.invalidate();
  f.values.postalCode = "0600000";
  pending.resolve({
    status: "found",
    postalCode: "1000001",
    regionCode: "13",
    city: "Old",
  });
  await task;
  assert.equal(f.values.city, "Manual");
  assert.equal(f.state.loading, false);
  assert.equal(f.state.error, "");
});
test("edits while loading survive and failures do not erase existing address", async () => {
  const pending = defer(),
    f = controller(() => pending.promise);
  const task = f.lookup();
  f.values.city = "Correção durante consulta";
  pending.resolve({
    status: "found",
    postalCode: "1000001",
    regionCode: "13",
    city: "千代田区",
  });
  await task;
  assert.equal(f.values.city, "Correção durante consulta");
  assert.equal(f.values.region, "13");
  const missing = controller(async (code) => ({
    status: "not-found",
    postalCode: code,
  }));
  await missing.lookup();
  assert.equal(missing.values.city, "Manual");
  assert.match(missing.state.error, /não encontrado/);
  const ambiguous = controller(async (code) => ({
    status: "ambiguous",
    postalCode: code,
  }));
  await ambiguous.lookup();
  assert.equal(ambiguous.values.region, "01");
  assert.match(ambiguous.state.error, /mais de uma cidade/);
});
test("invalid response and interrupted lookup keep manual entry available", async () => {
  const f = controller(async () => ({
    status: "found",
    postalCode: "2000000",
    regionCode: "99",
    city: "Wrong",
  }));
  await f.lookup();
  assert.equal(f.values.city, "Manual");
  assert.match(f.state.error, /manualmente/);
  assert.equal(f.state.loading, false);
  f.values.postalCode = "123";
  await f.lookup();
  assert.match(f.state.error, /7 dígitos/);
});
