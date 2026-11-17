import test from "node:test";
import assert from "node:assert/strict";
import {
  readOfferRows,
  offerNumber,
  offerPercent,
  offerSignature,
  selectableLoanOffer,
  resolveSelectedOffer,
  matchingCollateralQuote,
  collateralQuoteSignature,
} from "../src/services/loanOfferPresentation.js";
const row = {
  id: "offer-qa",
  status: "Received",
  canSelect: true,
  amount: 200000,
  currency: "BRL",
  installments: 60,
  installmentAmount: 4000,
  interestRate: 1.09,
};
test("offers do not infer selection permission from a positive quote or bank status", () => {
  assert.equal(selectableLoanOffer(row), true);
  for (const change of [
    { canSelect: false },
    { canSelect: undefined },
    { status: "Rejected" },
    { status: "UnderReview" },
    { status: "Unknown" },
    { amount: null },
    { amount: 0 },
    { currency: "" },
    { installments: null },
    { installmentAmount: null },
    { interestRate: null },
  ])
    assert.equal(selectableLoanOffer({ ...row, ...change }), false);
});
test("selection is discarded if the same offer id changes monetary terms or permissions", () => {
  const selection = { id: row.id, signature: offerSignature(row) };
  assert.equal(resolveSelectedOffer([row], selection), row);
  for (const change of [
    { amount: 210000 },
    { interestRate: 1.1 },
    { currency: "USD" },
    { canSelect: false },
    { status: "Rejected" },
    { installments: 90 },
  ])
    assert.equal(
      resolveSelectedOffer([{ ...row, ...change }], selection),
      null,
    );
  assert.equal(resolveSelectedOffer([], selection), null);
});
test("malformed or duplicate offer responses cannot masquerade as an empty result", () => {
  assert.deepEqual(readOfferRows({ items: [] }), []);
  for (const value of [null, {}, { items: null }, [row, row], [{}]])
    assert.throws(() => readOfferRows(value));
});
test("missing rates remain unavailable while a real zero rate is preserved", () => {
  for (const value of [null, undefined, "", Infinity, "bad"]) {
    assert.equal(offerNumber(value), null);
    assert.equal(offerPercent(value), "Indisponível");
  }
  assert.equal(offerPercent(0), "0%");
  assert.equal(offerPercent(1.09), "1,09%");
});
test("collateral quote must match the chosen amount and installments before acceptance", () => {
  const draft = { amount: 200000, installments: 60 };
  const quote = {
    id: "quote-qa",
    ...draft,
    currency: "BRL",
    totalAmount: 240000,
    installmentAmount: 4000,
    monthlyInterestRate: 1,
  };
  assert.equal(matchingCollateralQuote(quote, draft), quote);
  for (const change of [
    { id: "" },
    { amount: 250000 },
    { installments: 90 },
    { currency: "USD" },
    { totalAmount: null },
    { monthlyInterestRate: null },
    { installmentAmount: -1 },
  ])
    assert.equal(matchingCollateralQuote({ ...quote, ...change }, draft), null);
  assert.notEqual(
    collateralQuoteSignature(quote),
    collateralQuoteSignature({ ...quote, totalAmount: 250000 }),
  );
});
test("new offer, choice and confirmation templates compile", async () => {
  const { readFileSync } = await import("node:fs");
  const { parse, compileScript, compileTemplate } = await import(
    "@vue/compiler-sfc"
  );
  for (const file of [
    "src/system/components/loan/LoanOffersScreen.vue",
    "src/system/components/loan/LoanOfferCard.vue",
    "src/system/components/loan/LoanProductOptions.vue",
    "src/system/components/leverage/LeverageCatalogue.vue",
    "src/system/layouts/loans/FinalStepsLoanLayout.vue",
  ]) {
    const { descriptor } = parse(readFileSync(file, "utf8"));
    const script = compileScript(descriptor, { id: file });
    assert.deepEqual(
      compileTemplate({
        source: descriptor.template.content,
        filename: file,
        id: file,
        compilerOptions: { bindingMetadata: script.bindings },
      }).errors,
      [],
      file,
    );
  }
});
