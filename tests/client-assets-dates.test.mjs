import test from "node:test";
import assert from "node:assert/strict";
import { assetPayload } from "../src/services/clientAssetModel.js";
const investment = {
  investmentType: "Renda fixa",
  institution: "Instituição QA",
  productName: "Produto QA",
  initialAmount: "100.01",
  declaredValue: "110.02",
  startDate: "2024-02-29",
  hasFixedTerm: true,
  maturityDate: "2028-02-29",
  termMonths: "48",
};
test("investment rejects impossible or malformed dates before writing", () => {
  for (const startDate of [
    "2026-02-29",
    "2026-04-31",
    "0000-01-01",
    "20/10/2026",
    "2026-10-20T00:00:00Z",
  ])
    assert.throws(
      () => assetPayload({ ...investment, startDate }, "Investment", "brl"),
      /data válida/i,
    );
});
test("fixed term requires a real maturity date", () => {
  for (const maturityDate of [null, "", "2026-02-30", "0000-01-01"])
    assert.throws(
      () => assetPayload({ ...investment, maturityDate }, "Investment", "brl"),
      /vencimento|data válida/i,
    );
});
test("optional investment months reject zero and fractional values but accept empty", () => {
  for (const termMonths of [0, "0", "1.5", -1])
    assert.throws(
      () => assetPayload({ ...investment, termMonths }, "Investment", "brl"),
      /inteiro|maior que zero/i,
    );
  for (const termMonths of [null, "", "1", "48"])
    assert.doesNotThrow(() =>
      assetPayload({ ...investment, termMonths }, "Investment", "brl"),
    );
});
test("valid leap dates and decimal amounts survive unchanged; hidden term fields are cleared", () => {
  const payload = assetPayload(investment, "Investment", "brl");
  assert.equal(payload.investment.startDate, "2024-02-29");
  assert.equal(payload.investment.maturityDate, "2028-02-29");
  assert.equal(payload.investment.initialAmount, "100.01");
  const open = assetPayload(
    {
      ...investment,
      hasFixedTerm: false,
      maturityDate: "bad",
      termMonths: "0",
    },
    "Investment",
    "brl",
  );
  assert.equal(open.investment.maturityDate, null);
  assert.equal(open.investment.termMonths, null);
});
