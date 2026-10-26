import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(
  new URL("../src/services/profileShareImage.js", import.meta.url),
  "utf8",
);
const { shareImageModel, sharePercent, invitationUrl, SHARE_FORMATS } =
  await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
const now = new Date("2026-10-26T15:00:00Z");
const profile = {
  displayName: "Maria Silva Santos",
  customerId: "QA-1",
  documentLevel: 2,
  customerSinceUtc: "2019-01-01T00:00:00Z",
  email: "private@example.com",
  document: "sensitive",
  balance: 99999,
};
const metrics = {
  sinceEntry: 38.4,
  last12Months: -2.5,
  monthlyAverage: 0,
  activeContracts: 0,
  completedContracts: 5,
  referralCode: "QA-INVITE",
  invitationUrl: "https://example.com/register?ref=QA-INVITE",
  balance: 99999,
};
test("privacy shows only first name and initials; sensitive fields never enter artwork model", () => {
  const model = shareImageModel(profile, metrics, true, now);
  assert.equal(model.name, "Maria");
  assert.equal(model.initials, "MS");
  assert.equal(model.privateMode, true);
  assert.equal(model.ready, true);
  for (const forbidden of ["email", "document", "balance"])
    assert.equal(forbidden in model, false);
  assert.ok(!JSON.stringify(model).includes("Maria Silva Santos"));
});
test("missing data stays unavailable; zero and negative performance remain real values", () => {
  const missing = shareImageModel(profile, null, false, now);
  assert.equal(missing.ready, false);
  assert.equal(missing.sinceEntry, null);
  assert.equal(missing.activeContracts, null);
  assert.equal(missing.invitationUrl, "");
  assert.equal(sharePercent(null), "—");
  assert.equal(sharePercent(0), "0%");
  assert.equal(sharePercent(-2.5), "-2,5%");
  assert.equal(sharePercent(38.4), "+38,4%");
  assert.equal(shareImageModel(profile, metrics, false, now).ready, true);
});
test("invalid invitation URLs and metrics cannot enable complete export", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "https://user:secret@example.com",
    "/register",
    "",
  ])
    assert.equal(invitationUrl(url), "");
  for (const patch of [
    { sinceEntry: NaN },
    { last12Months: "14" },
    { activeContracts: -1 },
    { completedContracts: 1.5 },
    { referralCode: "" },
    { invitationUrl: "" },
  ])
    assert.equal(
      shareImageModel(profile, { ...metrics, ...patch }, false, now).ready,
      false,
    );
});
test("tenure uses complete months and image dimensions match delivery formats", () => {
  assert.equal(shareImageModel(profile, metrics, false, now).tenure, "7 anos");
  assert.equal(
    shareImageModel(
      { ...profile, customerSinceUtc: "2026-10-01" },
      metrics,
      false,
      now,
    ).tenure,
    "menos de 1 mês",
  );
  assert.equal(
    shareImageModel(
      { ...profile, customerSinceUtc: "2030-01-01" },
      metrics,
      false,
      now,
    ).ready,
    false,
  );
  assert.deepEqual(SHARE_FORMATS.feed, { width: 1080, height: 1350 });
  assert.deepEqual(SHARE_FORMATS.story, { width: 1080, height: 1920 });
});
