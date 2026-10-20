import { test } from "node:test";
import assert from "node:assert/strict";
import { profileDocumentRows, documentReplacementValues } from "../src/services/documentPresentation.js";
const note = "Foto ilegível\nReenvie somente o arquivo fictício.";
const entry = (id, status = "Rejected") => ({ documentId: id, status, latestReview: { documentId: id, status, notes: note } });
test("rejection notes come from the matching file review, not another upload of the same type", () => {
  const docs = [{ id: "rejected", documentTypeId: "rg", status: "Rejected" }, { id: "approved", documentTypeId: "rg", status: "Approved" }];
  const rows = profileDocumentRows(docs, { sections: [{ items: [entry("rejected"), entry("approved", "Approved")] }] });
  assert.equal(rows[0].rejectionReason, note);
  assert.equal(rows[1].rejectionReason, "");
  assert.equal(docs[0].rejectionReason, undefined);
});
test("missing, ambiguous or unrelated reviews never invent or disclose a rejection reason", () => {
  const doc = { id: "file", status: "Rejected" };
  for (const items of [[], [entry("another")], [{ ...entry("file"), latestReview: entry("another").latestReview }], [entry("file"), entry("file")], [entry("file", "Approved")]]) {
    assert.equal(profileDocumentRows([doc], { sections: [{ items }] })[0].rejectionReason, "");
  }
});
test("resubmitted files do not retain old rejection notes", () => {
  assert.equal(profileDocumentRows([{ id: "file", status: "Uploaded", rejectionReason: note }], { sections: [{ items: [entry("file")] }] })[0].rejectionReason, "");
});
test("replacement form preserves the existing dates without inventing dates or fields", () => {
  assert.deepEqual(documentReplacementValues({ issuedOn: "2025-01-01", expiresOn: null }), { issuedOn: "2025-01-01", expiresOn: "" });
  assert.deepEqual(documentReplacementValues({}), { issuedOn: "", expiresOn: "" });
});
