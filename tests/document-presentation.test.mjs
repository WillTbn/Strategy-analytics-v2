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

test("alternative identification requirements never label each alternative as individually mandatory", () => {
  const overview = {
    sections: [
      {
        code: "identity",
        name: "Identificação",
        items: [
          { documentId: "rg-approved", documentTypeId: "rg", isRequired: true },
          { documentTypeId: "passport", isRequired: true },
        ],
      },
    ],
  };
  const progress = {
    sections: [
      {
        categoryCode: "identity",
        requirements: [
          {
            documentId: "rg-approved",
            documentTypeId: "rg",
            isRequired: true,
            alternativeGroup: "IDENTITY",
          },
          {
            documentTypeId: "passport",
            isRequired: true,
            alternativeGroup: "IDENTITY",
          },
          { documentTypeId: "address", isRequired: true },
        ],
      },
    ],
  };
  const rows = profileDocumentGroups(
    [{ id: "rg-approved", status: "Approved" }],
    overview,
    progress,
  )[0].rows;
  assert.equal(rows[0].document.status, "Approved");
  assert.equal(rows[0].alternativeGroup, "IDENTITY");
  assert.equal(rows[0].isIndividuallyRequired, false);
  assert.equal(rows[1].isIndividuallyRequired, false);
  assert.equal(rows[1].isRequired, true); // preserve the API's group membership
  assert.equal(rows[2].isIndividuallyRequired, true); // independent obligations still shown
  assert.equal(overview.sections[0].items[0].alternativeGroup, undefined);
});


test("front and back retain their identities and side metadata in one current document group", () => {
 const files=[{id:"front",status:"Rejected",fileName:"frente.png"},{id:"back",status:"Rejected",fileName:"verso.png"}];
 const overview={sections:[{code:"identity",items:[{documentTypeId:"rg",documentId:"back",document:{id:"back",providedDocumentId:"current"},files:[{id:"front",side:"Front",providedDocumentId:"current",status:"Rejected"},{id:"back",side:"Back",providedDocumentId:"current",status:"Rejected"}],status:"Rejected",latestReview:{documentId:"back",status:"Rejected",notes:"Reenvie o teste"}}]}]};
 const enriched=profileDocumentRows(files,overview);assert.equal(enriched[0].side,"Front");assert.equal(enriched[1].providedDocumentId,"current");
 const rows=profileDocumentGroups(enriched,overview,{}, {identificationDocuments:{documents:[{source:"ProvidedDocument",documentTypeId:"rg",documentId:"current"}]}})[0].rows;
 assert.equal(rows.length,1);assert.deepEqual(rows[0].documents.map(d=>d.id),["front","back"]);
 assert.equal(rows[0].documents[1].rejectionReason,"Reenvie o teste");
});
test("superseded identity files never reappear as actionable ungrouped uploads",()=>{
 const overview={sections:[{code:"identity",items:[{documentTypeId:"rg",documentId:"old",document:{id:"old",providedDocumentId:"previous",status:"Rejected"},files:[{id:"old",providedDocumentId:"previous",status:"Rejected"}]},{documentTypeId:"rg",documentId:"current-file",document:{id:"current-file",providedDocumentId:"current",status:"Rejected"},files:[{id:"current-file",providedDocumentId:"current",status:"Rejected"}]}]}]};
 const files=[{id:"old",status:"Rejected"},{id:"orphan-historical",documentTypeId:"rg",status:"Rejected"},{id:"current-file",status:"Rejected"}];
 const progress={sections:[{categoryCode:"identity",requirements:[{documentId:"old",documentTypeId:"rg"}]}]};
 const groups=profileDocumentGroups(files,overview,progress,{identificationDocuments:{documents:[{source:"ProvidedDocument",documentTypeId:"rg",documentId:"current"}]}});
 assert.equal(groups.length,1);assert.equal(groups[0].rows.length,1);assert.equal(groups[0].rows[0].document.id,"current-file");
});

test("optional CPF and NIF appear only with upload capability and never duplicate an overview row", () => {
  const catalog = [
    {
      id: "cpf",
      code: "CPF",
      name: "CPF",
      categoryId: "fiscal",
      categoryName: "Fiscal",
      allowsFileUpload: true,
    },
    {
      id: "nif",
      code: "NIF",
      name: "NIF",
      categoryId: "fiscal",
      categoryName: "Fiscal",
      allowsFileUpload: true,
    },
  ];
  const groups = profileDocumentGroups([], {}, {}, null, catalog);
  assert.deepEqual(
    groups[0].rows.map((row) => row.name),
    ["CPF", "NIF"],
  );
  assert.ok(
    groups[0].rows.every(
      (row) => !row.isIndividuallyRequired && row.documents.length === 0,
    ),
  );
  const existing = {
    sections: [
      {
        categoryId: "fiscal",
        name: "Fiscal",
        items: [
          {
            documentTypeId: "cpf",
            documentTypeName: "CPF",
            allowedActions: [],
          },
        ],
      },
    ],
  };
  const rows = profileDocumentGroups([], existing, {}, null, catalog).flatMap(
    (group) => group.rows,
  );
  assert.equal(rows.filter((row) => row.documentTypeId === "cpf").length, 1);
  assert.deepEqual(
    rows.find((row) => row.documentTypeId === "cpf").allowedActions,
    [],
  );
  assert.equal(
    profileDocumentGroups(
      [],
      {},
      {},
      null,
      catalog.map((type) => ({ ...type, allowsFileUpload: false })),
    ).length,
    0,
  );
});
