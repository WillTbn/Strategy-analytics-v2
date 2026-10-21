import { test } from "node:test";
import assert from "node:assert/strict";
import { profileDocumentRows, documentReplacementValues, profileDocumentGroups } from "../src/services/documentPresentation.js";
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

test('grouped requirements retain missing uploads, correct file identities and ungrouped attachments', () => {
 const files = [{id:'front',documentTypeId:'rg',documentTypeName:'Frente',status:'Approved',createdAtUtc:'2026-01-01'}, {id:'extra',documentTypeId:'rg',documentTypeName:'Outro envio',status:'Rejected'}];
 const groups = profileDocumentGroups(files, {sections:[{code:'identity',name:'Identidade',items:[{requirementId:'a',documentId:'front',documentTypeId:'rg',documentTypeName:'Frente'}, {requirementId:'b',documentTypeId:'rg',documentTypeName:'Verso',status:'Missing'}]}]});
 assert.equal(groups[0].rows[0].document.id,'front');
 assert.equal(groups[0].rows[1].document,null);
 assert.equal(groups[0].rows[1].name,'Verso');
 assert.equal(groups[0].rows[0].updatedAt,null); // creation is not last update
 assert.equal(groups[1].rows[0].document.id,'extra');
});
test('progress requirements remain available when overview has no groups', () => {
 const groups = profileDocumentGroups([], {}, {sections:[{categoryCode:'income',categoryName:'Renda',requirements:[{documentTypeId:'proof',documentTypeName:'Comprovante'}]}]});
 assert.equal(groups[0].name,'Renda'); assert.equal(groups[0].rows[0].documentTypeId,'proof');
});

test('pending progress requirements are merged even when the overview contains existing files', () => {
 const overview = {sections:[{code:'identity', name:'Identidade', items:[{documentId:'front',documentTypeId:'rg'}]}]};
 const progress = {sections:[{categoryCode:'identity',categoryName:'Identidade',requirements:[{documentId:'front',documentTypeId:'rg'},{documentId:null,documentTypeId:'back',documentTypeName:'Verso'}]}]};
 const rows = profileDocumentGroups([{id:'front'}],overview,progress)[0].rows;
 assert.equal(rows.length,2);assert.equal(rows[1].document,null);assert.equal(rows[1].name,'Verso');
 assert.equal(overview.sections[0].items.length,1);
});
