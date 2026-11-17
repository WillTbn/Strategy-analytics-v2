// Presentation keys, not an HTTP contract. A future API adapter maps catalog IDs here.
export const loanDocumentGroups = Object.freeze([
  { id: "identification", label: "Foto da sua CNH/RG (frente e verso)" },
  { id: "spouse", label: "Foto da CNH/RG do seu Cônjuge (frente e verso)" },
  { id: "marriage", label: "Certidão de Casamento" },
  {
    id: "propertyTax",
    label:
      "Foto do IPTU ( Capa com CEP e primeira página contendo a metragem do imóvel)",
  },
  { id: "address", label: "Comprovante de Endereco do Contratante" },
  {
    id: "statement",
    label:
      "Extrato Bancário (Assalariado: Últimos 4 meses; PJ: Últimos 7 meses)",
  },
  { id: "photos", label: "Fotos do Imóvel" },
  { id: "registration", label: "Matricula do Imóvel e Habite-se" },
]);
export function readLoanDocuments(rows) {
  if (!Array.isArray(rows)) throw Error("Invalid loan document response");
  const seen = new Set();
  return rows.map((row) => {
    if (
      !row ||
      typeof row.id !== "string" ||
      !row.id.trim() ||
      seen.has(row.id) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      !loanDocumentGroups.some((g) => g.id === row.group)
    )
      throw Error("Invalid persisted loan document");
    seen.add(row.id);
    return { id: row.id, name: row.name, group: row.group };
  });
}
