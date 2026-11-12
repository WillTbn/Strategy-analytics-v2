import test from "node:test";
import assert from "node:assert/strict";
import {
  documentationGroups,
  documentationProgress,
  fileFormat,
} from "../src/services/profileDocumentation.js";
const types = [
  "RG",
  "CNH",
  "CPF",
  "DECLARACAO_IRPF",
  "RECIBO_IRPF",
  "HOLERITE",
  "FOTOS_IMOVEL",
  "TERMO_USO_PLATAFORMA",
].map((code) => ({ id: code, code, allowsFileUpload: true }));
const row = (code, files) => ({
  key: code,
  documentTypeId: code,
  documentTypeCode: code,
  documents: files,
});
test("approved profile groups exclude fiscal ID, platform and asset files while preserving identity sides and rejection reasons", () => {
  const file = {
    id: "front",
    side: "Front",
    status: "Rejected",
    rejectionReason: "Foto ilegível",
  };
  const groups = documentationGroups(
    [
      {
        rows: [
          row("RG", [file, { id: "back", side: "Back", status: "Approved" }]),
          row("CPF", [{ id: "cpf" }]),
          row("FOTOS_IMOVEL", [{ id: "photo" }]),
          row("TERMO_USO_PLATAFORMA", [{ id: "terms" }]),
        ],
      },
    ],
    types,
  );
  assert.deepEqual(
    groups.map((g) => g.name),
    [
      "Documento de Identidade",
      "Comprovante de Residência",
      "Comprovante de Renda",
      "Outros Documentos",
    ],
  );
  const all = groups.flatMap((g) => g.rows);
  assert.equal(
    all.find((r) => r.side === "Front").documents[0].rejectionReason,
    "Foto ilegível",
  );
  assert.equal(all.find((r) => r.side === "Back").documents[0].id, "back");
  assert.ok(
    !all.some((r) =>
      ["CPF", "FOTOS_IMOVEL", "TERMO_USO_PLATAFORMA"].includes(
        r.documentTypeId,
      ),
    ),
  );
  const missing = all.find((r) => r.key.startsWith("decore"));
  assert.equal(missing.documentTypeId, undefined);
  assert.equal(missing.catalogAvailable, false);
});
test("documentation uses the official account level and counts, independent of legacy approval", () => {
  const value = documentationProgress({
    level: 1,
    countedDocuments: 2,
    requiredDocuments: 5,
  });
  assert.equal(value.counter, "2 / 5");
  assert.equal(value.value, 0.4);
  assert.equal(
    documentationProgress({ level: 2, registeredAssets: 1, requiredAssets: 3 })
      .counter,
    "1 / 3",
  );
  assert.equal(documentationProgress({ level: 3 }).value, 1);
  assert.equal(
    documentationProgress({ currentLevel: { code: "LEVEL_3" } }).level,
    null,
  );
});
test("level zero shows missing confirmations without falsely granting level one", () => {
  const value = documentationProgress({
    level: 0,
    emailConfirmed: true,
    phoneVerified: false,
  });
  assert.equal(value.level, 0);
  assert.equal(value.value, 0.5);
  assert.equal(value.counter, "1 / 2");
  assert.match(value.text, /seu celular/);
  assert.equal(
    documentationProgress({
      level: 0,
      emailConfirmed: false,
      phoneVerified: false,
    }).value,
    0,
  );
});
test("missing official progress is unavailable rather than locally inferred", () => {
  for (const data of [
    null,
    {},
    { level: "1" },
    { level: 4 },
    { level: 1 },
    { level: 2, registeredAssets: 1, requiredAssets: 0 },
  ])
    assert.equal(documentationProgress(data).value, null);
});
test("attachment icons use MIME or file extension instead of a generic document glyph", () => {
  assert.equal(fileFormat({ fileName: "arquivo.PDF" }), "PDF");
  assert.equal(fileFormat({ contentType: "image/png" }), "IMG");
  assert.equal(fileFormat({ fileName: "extrato.xlsx" }), "XLS");
  assert.equal(fileFormat({ fileName: "desconhecido" }), "FILE");
});

test("a resubmitted single-file row no longer offers the older rejected upload", () => {
  const old = {
    id: "old",
    status: "Rejected",
    createdAtUtc: "2026-11-04T10:00:00Z",
  };
  const current = {
    id: "new",
    status: "Uploaded",
    createdAtUtc: "2026-11-04T11:00:00Z",
  };
  const groups = documentationGroups(
    [{ rows: [row("DECLARACAO_IRPF", [old, current])] }],
    types,
  );
  const irpf = groups
    .flatMap((group) => group.rows)
    .find((entry) => entry.documentTypeId === "DECLARACAO_IRPF");
  assert.deepEqual(
    irpf.documents.map((file) => file.id),
    ["new"],
  );
  assert.equal(documentationProgress({}).value, null);
  const months = documentationGroups(
    [{ rows: [row("HOLERITE", [old, current])] }],
    types,
  )
    .flatMap((group) => group.rows)
    .find((entry) => entry.documentTypeId === "HOLERITE");
  assert.equal(months.documents.length, 2);
});
