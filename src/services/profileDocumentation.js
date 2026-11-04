// Approved QA 123 roster. Codes identify catalog entries; never synthesize IDs.
export const profileDocumentationRoster = [
  {
    key: "identity",
    name: "Documento de Identidade",
    types: [
      {
        key: "identity-front",
        name: "Frente do Documento de Identidade",
        codes: ["RG", "CNH", "PASSPORT", "PASSAPORTE"],
        side: "Front",
      },
      {
        key: "identity-back",
        name: "Verso do Documento de Identidade",
        codes: ["RG", "CNH", "PASSPORT", "PASSAPORTE"],
        side: "Back",
      },
      {
        key: "civil",
        name: "Comprovante de Estado Civil",
        codes: [
          "COMPROVANTE_ESTADO_CIVIL",
          "CERTIDAO_CASAMENTO",
          "CERTIDAO_NASCIMENTO",
          "UNIAO_ESTAVEL",
          "CERTIDAO_DIVORCIO",
        ],
      },
    ],
  },
  {
    key: "residence",
    name: "Comprovante de Residência",
    types: [
      {
        key: "residence",
        name: "Comprovante de Residência",
        codes: ["COMPROVANTE_RESIDENCIA"],
      },
    ],
  },
  {
    key: "income",
    name: "Comprovante de Renda",
    types: [
      { key: "irpf", name: "Declaração IRPF", codes: ["DECLARACAO_IRPF"] },
      {
        key: "receipt",
        name: "Recibo de Entrega de Declaração",
        codes: ["RECIBO_IRPF"],
      },
    ],
  },
  {
    key: "other",
    name: "Outros Documentos",
    types: [
      {
        key: "statement",
        name: "Extrato Bancário dos últimos 3 a 6 meses",
        codes: ["EXTRATOS_BANCARIOS"],
      },
      {
        key: "income-statement",
        name: "Informes de Rendimentos",
        codes: ["INFORME_RENDIMENTOS"],
      },
      {
        key: "payslip",
        name: "Holerite / Contracheque dos últimos 3 meses",
        codes: ["HOLERITE", "CONTRACHEQUE"],
        maxFiles: 3,
      },
      {
        key: "independent",
        name: "Declaração de autônomo, emitida por contador",
        codes: ["DECLARACAO_AUTONOMO"],
      },
      {
        key: "rpa",
        name: "Recibo de pagamento a autônomo (RPA)",
        codes: ["RPA", "RECIBO_AUTONOMO"],
      },
      {
        key: "services",
        name: "Contrato de prestação de serviços + comprovantes de pagamento",
        codes: ["CONTRATO_PRESTACAO_SERVICOS"],
      },
      {
        key: "decore",
        name: "Decore (emitida por contador com registro no CRC)",
        codes: ["DECORE"],
      },
    ],
  },
];
const codeOf = (row) =>
  String(row.documentTypeCode || row.code || "").toUpperCase();
export function documentationGroups(groups = [], catalog = []) {
  const rows = groups.flatMap((g) => g.rows || []);
  return profileDocumentationRoster.map((group) => ({
    ...group,
    rows: group.types.flatMap((spec) => {
      const ids = new Set(
        catalog.filter((t) => spec.codes.includes(codeOf(t))).map((t) => t.id),
      );
      let matches = rows.filter(
        (row) =>
          ids.has(row.documentTypeId) || spec.codes.includes(codeOf(row)),
      );
      if (!spec.side) {
        const grouped = new Map();
        for (const row of matches) {
          const key = row.documentTypeId || row.key;
          if (!grouped.has(key)) grouped.set(key, { ...row, documents: [] });
          const target = grouped.get(key);
          for (const file of row.documents || [])
            if (!target.documents.some((item) => item.id === file.id))
              target.documents.push(file);
        }
        matches = [...grouped.values()];
      }
      const source = matches.length
        ? matches
        : [
            {
              documentTypeId: catalog.find((t) => ids.has(t.id))?.id,
              documents: [],
              status: "Missing",
            },
          ];
      // One identity type in the editor; never combine Front/Back of different types.
      const selected = spec.side
        ? source.filter((row) => (row.documents || []).length)
        : source;
      return (selected.length ? selected : source.slice(0, 1)).map(
        (row, index) => {
          let files = (row.documents || []).filter(
            (file) =>
              !spec.side ||
              file.side === spec.side ||
              (!file.side && spec.side === "Front"),
          );
          // Single-file Figma rows expose the newest upload, not an old rejected version.
          // Keep multi-file types and undated data intact; never infer a replacement from a name.
          if (
            (spec.maxFiles || 1) === 1 &&
            files.length > 1 &&
            files.every((file) =>
              Number.isFinite(Date.parse(file.createdAtUtc)),
            )
          ) {
            const newest = [...files].sort(
              (a, b) => Date.parse(b.createdAtUtc) - Date.parse(a.createdAtUtc),
            )[0];
            files = files.filter(
              (file) =>
                file.id === newest.id ||
                file.status !== "Rejected" ||
                Date.parse(file.createdAtUtc) >=
                  Date.parse(newest.createdAtUtc),
            );
          }
          const type = catalog.find((t) => t.id === row.documentTypeId);
          return {
            ...row,
            key: `${spec.key}-${row.key || index}`,
            name: spec.name,
            side: spec.side,
            maxFiles: spec.maxFiles || 1,
            documents: files,
            document: files[0] || null,
            status: files[0]?.status || (files.length ? row.status : "Missing"),
            catalogAvailable: Boolean(
              type?.id && type.allowsFileUpload !== false,
            ),
            typeChoices: catalog.filter((t) => spec.codes.includes(codeOf(t))),
            allowedActions: row.allowedActions,
          };
        },
      );
    }),
  }));
}
export function fileFormat(file = {}) {
  const name =
    file.fileName ||
    file.originalFileName ||
    file.file?.fileName ||
    file.file?.originalFileName ||
    "";
  const mime = file.contentType || file.file?.contentType || "";
  if (/pdf/i.test(mime) || /\.pdf$/i.test(name)) return "PDF";
  if (/^image\//i.test(mime) || /\.(png|jpe?g|webp|gif)$/i.test(name))
    return "IMG";
  if (/spreadsheet|excel/i.test(mime) || /\.xlsx?$/i.test(name)) return "XLS";
  if (/word/i.test(mime) || /\.docx?$/i.test(name)) return "DOC";
  return "FILE";
}
export function documentationProgress(progress, groups, assetCount = null) {
  const level =
    Number(
      String(
        progress?.currentLevel?.name || progress?.currentLevel?.code || "",
      ).match(/[1-3]/)?.[0],
    ) || null;
  const ids = new Set();
  for (const group of groups)
    for (const row of group.rows || []) {
      if (
        (row.documents || []).some((file) =>
          [
            "Uploaded",
            "Pending",
            "UnderReview",
            "InReview",
            "Approved",
          ].includes(file.status),
        )
      )
        ids.add(row.side ? "identity" : row.documentTypeId || row.key);
    }
  const sent = ids.size;
  if (level === 3)
    return { level, value: 1, counter: "", text: "Você está no nível máximo!" };
  if (level === 2)
    return {
      level,
      value: assetCount == null ? null : Math.min(assetCount / 3, 1),
      counter: assetCount == null ? "— / 3" : `${assetCount} / 3`,
      text:
        assetCount == null
          ? "Progresso patrimonial indisponível"
          : `Registre mais ${Math.max(3 - assetCount, 0)} patrimônios para subir para o Nível 3!`,
    };
  return {
    level,
    value: Math.min(sent / 5, 1),
    counter: `${sent} / 5`,
    text: `Faça Upload de mais ${Math.max(5 - sent, 0)} Arquivos para subir para o Nível 2!`,
  };
}

export function documentUpdatedAt(file, row = {}) {
  const values = [
    file?.updatedAtUtc,
    file?.createdAtUtc,
    row.submittedAtUtc,
    row.updatedAt,
    row.latestReview?.documentId === file?.id
      ? row.latestReview?.reviewedAtUtc
      : null,
  ].filter((value) => value && !Number.isNaN(Date.parse(value)));
  return values.sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;
}
