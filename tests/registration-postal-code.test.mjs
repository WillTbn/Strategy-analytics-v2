import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRegistrationPostalLookup,
  normalizeBrazilianPostalCode,
} from "../src/services/registrationPostalCode.js";
const response = (cep = "01001-000") => ({
  cep,
  logradouro: "Praça da Sé",
  bairro: "Sé",
  localidade: "São Paulo",
  uf: "SP",
  estado: "São Paulo",
  complemento: "Do serviço",
});
function harness(read = async () => response()) {
  const values = {
    postalCode: "01001-000",
    street: "Rua anterior",
    district: "Bairro anterior",
    city: "Cidade anterior",
    region: "RJ",
    number: "100",
    complement: "Sala 2",
  };
  const state = { loading: false, error: "" },
    regions = [],
    calls = [];
  const controller = createRegistrationPostalLookup({
    values,
    state,
    read: async (cep) => {
      calls.push(cep);
      return read(cep);
    },
    region: (...v) => regions.push(v),
  });
  return { ...controller, values, state, regions, calls };
}
test("CEP accepts eight digits with optional hyphen, rejects invalid text without sending a request", async () => {
  assert.equal(normalizeBrazilianPostalCode("01001000"), "01001000");
  for (const value of ["", "123", "01001A000", "010010000", "01 001000"])
    assert.equal(normalizeBrazilianPostalCode(value), null);
  const h = harness();
  h.values.postalCode = "123";
  await h.lookup();
  assert.equal(h.calls.length, 0);
  assert.match(h.state.error, /8 dígitos/);
  h.values.postalCode = "";
  await h.lookup();
  assert.equal(h.state.error, "");
});
test("lookup fills only the four Figma address fields and preserves number and complement", async () => {
  const h = harness();
  await h.lookup();
  assert.equal(h.values.street, "Praça da Sé");
  assert.equal(h.values.district, "Sé");
  assert.equal(h.values.city, "São Paulo");
  assert.equal(h.values.region, "SP");
  assert.equal(h.values.number, "100");
  assert.equal(h.values.complement, "Sala 2");
  assert.deepEqual(h.regions, [["SP", "São Paulo"]]);
  h.values.street = "Correção manual";
  await h.lookup();
  assert.equal(h.calls.length, 1);
  assert.equal(h.values.street, "Correção manual");
});
test("generic CEP does not erase street or district when the response omits them", async () => {
  const h = harness(async () => ({
    ...response(),
    logradouro: "",
    bairro: "",
  }));
  await h.lookup();
  assert.equal(h.values.street, "Rua anterior");
  assert.equal(h.values.district, "Bairro anterior");
  assert.equal(h.values.city, "São Paulo");
});
test("not found and unavailable lookup preserve manual data and allow retry", async () => {
  let mode = 0;
  const h = harness(async () => {
    if (mode === 0) return { erro: true };
    if (mode === 1) throw Error("unavailable");
    return response();
  });
  await h.lookup();
  assert.match(h.state.error, /não encontrado/);
  assert.equal(h.values.street, "Rua anterior");
  mode = 1;
  await h.lookup();
  assert.match(h.state.error, /manualmente/);
  assert.equal(h.state.loading, false);
  mode = 2;
  await h.lookup();
  assert.equal(h.state.error, "");
  assert.equal(h.values.street, "Praça da Sé");
});
test("late responses cannot overwrite another CEP or edits made during lookup", async () => {
  let resolve;
  const h = harness(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const first = h.lookup();
  assert.equal(h.state.loading, true);
  h.values.postalCode = "20000-000";
  h.invalidate();
  resolve(response());
  await first;
  assert.equal(h.values.street, "Rua anterior");
  h.values.postalCode = "01001-000";
  const second = h.lookup();
  h.values.street = "Editado durante consulta";
  resolve(response());
  await second;
  assert.equal(h.values.street, "Editado durante consulta");
  assert.equal(h.values.city, "São Paulo");
});
test("unmount or a newer request invalidates old results and old failures", async () => {
  const pending = [];
  const h = harness(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  );
  const first = h.lookup();
  h.invalidate();
  h.values.postalCode = "20000-000";
  const second = h.lookup();
  pending[0].reject(Error("old error"));
  await first;
  assert.equal(h.state.loading, true);
  assert.equal(h.state.error, "");
  h.invalidate();
  pending[1].resolve(response("20000-000"));
  await second;
  assert.equal(h.values.city, "Cidade anterior");
});
test("incomplete or mismatched responses never partially fill the address", async () => {
  for (const result of [{ ...response(), uf: "" }, response("99999-999"), {}]) {
    const h = harness(async () => result);
    await h.lookup();
    assert.equal(h.values.city, "Cidade anterior");
    assert.match(h.state.error, /consultar/);
  }
});

import vm from "node:vm";
import { readFile } from "node:fs/promises";
test("shared legacy lookup sends only CEP without authenticated credentials and bounds request duration", async () => {
  let config;
  const calls = [];
  const context = vm.createContext({});
  const mod = new vm.SourceTextModule(
    await readFile(
      new URL("../src/services/postalCodeService.js", import.meta.url),
      "utf8",
    ),
    { context },
  );
  await mod.link(
    () =>
      new vm.SyntheticModule(
        ["default"],
        function () {
          this.setExport("default", {
            create: (options) => {
              config = options;
              return {
                post: async (url, body) => {
                  calls.push({ url, body });
                  return { data: response() };
                },
              };
            },
          });
        },
        { context },
      ),
  );
  await mod.evaluate();
  assert.equal(
    (await mod.namespace.lookupBrazilianPostalCode("01001000")).uf,
    "SP",
  );
  assert.equal(config.withCredentials, false);
  assert.equal(config.timeout, 10000);
  assert.equal(config.baseURL, "https://sources.strategyanalytics.com.br/api/");
  assert.equal(calls[0].url, "validator-cep");
  assert.deepEqual(Object.keys(calls[0].body), ["cep"]);
  assert.equal(calls[0].body.cep, "01001000");
});

test("returning to a previously queried CEP after changing it performs a fresh lookup", async () => {
  const h = harness();
  await h.lookup();
  h.values.postalCode = "99999-999";
  h.invalidate();
  h.values.postalCode = "01001-000";
  h.invalidate();
  h.values.street = "Endereço de outro CEP";
  await h.lookup();
  assert.equal(h.calls.length, 2);
  assert.equal(h.values.street, "Praça da Sé");
});
