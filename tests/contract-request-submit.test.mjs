import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import * as draftModel from "../src/services/contractRequestDraft.js";
const currencyId = "11111111-1111-4111-8111-111111111111";
const draft = () => ({
  objective: "Renda Passiva",
  time: "Curto Prazo: 1 à 2 anos",
  modality: "Aplicação Única",
  amount: "1.234,56",
  amount_mensal: null,
  types: [1, 5],
  regions: ["EUA"],
});
const defer = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
async function service({
  catalog = { data: { currencies: [{ value: "BRL", id: currencyId }] } },
  write,
  read,
} = {}) {
  const calls = [];
  let current = true;
  const context = vm.createContext({ JSON, Error });
  const module = new vm.SourceTextModule(
    readFileSync("src/services/contractRequestService.js", "utf8"),
    { context },
  );
  const deps = {
    "./financeService": {
      financeGet: async (path) => {
        calls.push(["get", path]);
        return read ? read() : catalog;
      },
      financeWrite: async (...args) => {
        calls.push(args);
        return write ? write(...args) : { id: "request-qa" };
      },
    },
    "./clientApi": {
      captureClientSession: () => "session-qa",
      assertClientSessionCurrent: () => {
        if (!current) throw Error("stale");
      },
    },
    "./contractRequestDraft": draftModel,
  };
  await module.link(async (name) => {
    const values = deps[name];
    return new vm.SyntheticModule(
      Object.keys(values),
      function () {
        for (const [k, v] of Object.entries(values)) this.setExport(k, v);
      },
      { context },
    );
  });
  await module.evaluate();
  return {
    send: module.namespace.sendContractRequest,
    calls,
    expire: () => {
      current = false;
    },
  };
}
test("single, recurring and hybrid requests map only the fields visible in the existing BRL form", () => {
  const d = draft();
  let p = draftModel.contractRequestPayload(d, currencyId);
  assert.equal(p.modality, "SinglePayment");
  assert.equal(p.initialAmount, 1234.56);
  assert.equal(p.monthlyAmount, null);
  assert.deepEqual(p.assetTypes, ["Ações", "Criptoativos"]);
  assert.equal(p.period, d.time);
  d.modality = "Com Aportes Recorrentes";
  p = draftModel.contractRequestPayload(d, currencyId);
  assert.equal(p.modality, "Recurring");
  assert.equal(p.initialAmount, null);
  assert.equal(p.monthlyAmount, 1234.56);
  d.modality = "Aplicação Híbrida";
  d.amount_mensal = "250,10";
  p = draftModel.contractRequestPayload(d, currencyId);
  assert.equal(p.initialAmount, 1234.56);
  assert.equal(p.modality, "Hybrid");
  assert.equal(p.monthlyAmount, 250.1);
  assert.deepEqual(Object.keys(p), [
    "objective",
    "period",
    "modality",
    "initialAmount",
    "monthlyAmount",
    "currencyId",
    "assetTypes",
    "regions",
  ]);
});
test("request mapping rejects invalid amounts and missing catalog IDs before a write", () => {
  for (const value of ["1.23", "-1", "0", "NaN", "Infinity", "1e3", null])
    assert.throws(() =>
      draftModel.contractRequestPayload(
        { ...draft(), amount: value },
        currencyId,
      ),
    );
  for (const id of [null, undefined, "BRL", "fake-id"])
    assert.throws(() => draftModel.contractRequestPayload(draft(), id));
});
test("existing BRL form resolves BRL ID even when the first catalog currency is USD", async () => {
  const s = await service({
    catalog: {
      data: {
        currencies: [
          { value: "USD", id: "22222222-2222-4222-8222-222222222222" },
          { value: "BRL", id: currencyId },
        ],
      },
    },
  });
  assert.equal((await s.send(draft())).id, "request-qa");
  assert.equal(s.calls[1][0], "post");
  assert.equal(s.calls[1][1], "client/contracts/requests");
  assert.equal(s.calls[1][2].currencyId, currencyId);
});
test("missing BRL ID and failed catalog cannot post a request", async () => {
  for (const catalog of [
    { data: { currencies: [] } },
    { data: { currencies: [{ value: "BRL", id: null }] } },
  ]) {
    const s = await service({ catalog });
    await assert.rejects(s.send(draft()));
    assert.equal(s.calls.length, 1);
  }
  const s = await service({
    read: () => {
      throw Error("private diagnostic");
    },
  });
  await assert.rejects(
    s.send(draft()),
    (e) => e.message === draftModel.requestSendUnavailable,
  );
  assert.equal(s.calls.length, 1);
});
test("closing the form or changing session while the catalog loads prevents submission", async () => {
  for (const cancel of ["close", "session"]) {
    const waiting = defer();
    const s = await service({ read: () => waiting.promise });
    let active = true;
    const pending = s.send(draft(), { isActive: () => active });
    if (cancel === "close") active = false;
    else s.expire();
    waiting.resolve({
      data: { currencies: [{ value: "BRL", id: currencyId }] },
    });
    await assert.rejects(pending);
    assert.equal(s.calls.length, 1);
  }
});
test("draft is snapshotted before catalog lookup; failed or unconfirmed writes cannot show success", async () => {
  const waiting = defer();
  const s = await service({ read: () => waiting.promise });
  const d = draft();
  const pending = s.send(d);
  d.amount = "9.999,99";
  waiting.resolve({ data: { currencies: [{ value: "BRL", id: currencyId }] } });
  await pending;
  assert.equal(s.calls[1][2].initialAmount, 1234.56);
  for (const write of [
    () => ({}),
    () => {
      throw Error("private diagnostic");
    },
  ]) {
    const fail = await service({ write });
    await assert.rejects(
      fail.send(draft()),
      (e) => e.message === draftModel.requestSendUnavailable,
    );
  }
});
test("session expiration after successful HTTP response never confirms another user form", async () => {
  const waiting = defer();
  const s = await service({ write: () => waiting.promise });
  const pending = s.send(draft());
  await new Promise((resolve) => setImmediate(resolve));
  s.expire();
  waiting.resolve({ id: "request-qa" });
  await assert.rejects(pending);
});
