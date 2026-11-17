import test from "node:test";
import assert from "node:assert/strict";
import {
  loanProcessLabel,
  loanInterestText,
  installmentProgress,
  loanSummaryTitle,
  loanKindPresentation,
} from "../src/services/loanSummaryPresentation.js";
test("missing or invalid installment counts never fabricate a discharge percentage", () => {
  for (const [paid, total] of [
    [null, 40],
    [0, null],
    ["", 40],
    [2, 0],
    [-1, 40],
    [41, 40],
    [1.5, 40],
  ])
    assert.equal(installmentProgress(paid, total), null);
  assert.equal(installmentProgress(0, 40), 0);
  assert.equal(installmentProgress(12, 40), 30);
  assert.equal(installmentProgress(40, 40), 100);
});
test("loan principal title keeps its actual currency and preserves unknown balances", () => {
  assert.match(
    loanSummaryTitle({ principalAmount: 500000, currencyIsoCode: "BRL" }),
    /500.000,00/,
  );
  assert.match(
    loanSummaryTitle({ principalAmount: 0, currencyIsoCode: "USD" }),
    /US.*0,00/,
  );
  assert.equal(
    loanSummaryTitle({
      principalAmount: null,
      currencyIsoCode: "BRL",
      publicCode: "L-1",
    }),
    "L-1",
  );
  assert.equal(
    loanSummaryTitle({
      principalAmount: 12,
      currencyIsoCode: null,
      publicCode: "L-2",
    }),
    "L-2",
  );
});
test("unknown loan kinds are not presented as a fabricated collateral type", () => {
  assert.equal(loanKindPresentation("unmapped"), null);
  assert.equal(loanKindPresentation("consorcio").label, "Consórcio");
});

test("process labels and decimal rates follow Portuguese presentation without inventing rate periods", () => {
  assert.equal(loanProcessLabel("UnderReview"), "Em análise");
  assert.equal(loanProcessLabel("NewStatus"), "Situação não informada");
  assert.equal(loanInterestText(1.09), "1,09%");
  assert.equal(loanInterestText(0), "0%");
  assert.equal(loanInterestText(null), "");
});
