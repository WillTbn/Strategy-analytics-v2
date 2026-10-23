// Join by the actual file ID: several uploads may share one document type.
export function profileDocumentRows(documents, overview) {
  const items = (overview?.sections || []).flatMap(
    (section) => section.items || [],
  );
  return documents.map((document) => {
    const matches = items.filter(
      (item) => (item.documentId || item.document?.id) === document.id,
    );
    const item = matches.length === 1 ? matches[0] : null;
    const review = item?.latestReview;
    const notes =
      item?.status === "Rejected" &&
      review?.status === "Rejected" &&
      review.documentId === document.id
        ? review.notes
        : null;
    return {
      ...document,
      rejectionReason:
        document.status === "Rejected"
          ? document.rejectionReason || notes || ""
          : "",
    };
  });
}
export function documentReplacementValues(document) {
  return {
    issuedOn: document.issuedOn?.slice(0, 10) || "",
    expiresOn: document.expiresOn?.slice(0, 10) || "",
  };
}

// Requirements and files are joined by identity, never by document type: front/back
// and repeated uploads can share a type without representing the same file.
export function profileDocumentGroups(
  documents = [],
  overview = {},
  progress = {},
) {
  const seen = new Set();
  const source = (overview.sections || []).map((section) => ({
    ...section,
    items: [...(section.items || [])],
  }));
  for (const section of progress.sections || []) {
    let group = source.find(
      (candidate) =>
        (candidate.code != null && candidate.code === section.categoryCode) ||
        (candidate.name != null && candidate.name === section.categoryName),
    );
    if (!group) {
      group = {
        code: section.categoryCode,
        name: section.categoryName,
        items: [],
      };
      source.push(group);
    }
    for (const requirement of section.requirements || []) {
      const existing = group.items.findIndex((item) =>
        requirement.requirementId
          ? item.requirementId === requirement.requirementId
          : requirement.documentId
            ? (item.documentId || item.document?.id) === requirement.documentId
            : !item.documentId &&
              item.documentTypeId === requirement.documentTypeId,
      );
      if (existing < 0) group.items.push(requirement);
      else
        group.items[existing] = {
          ...group.items[existing],
          isRequired:
            requirement.isRequired ?? group.items[existing].isRequired,
          alternativeGroup:
            requirement.alternativeGroup ??
            group.items[existing].alternativeGroup,
        };
    }
  }
  const groups = source.map((section, index) => ({
    key: section.categoryId || section.code || `section-${index}`,
    name: section.name || "Outros documentos",
    order: Number(section.order ?? index),
    rows: (section.items || []).map((item, rowIndex) => {
      const id = item.documentId || item.document?.id;
      const document =
        documents.find((doc) => doc.id === id) || item.document || null;
      if (document?.id) seen.add(document.id);
      return {
        ...item,
        key: item.requirementId || id || `${index}-${rowIndex}`,
        document,
        isIndividuallyRequired:
          item.isRequired === true && !item.alternativeGroup,
        status: document?.status || item.status || "Pending",
        name:
          item.documentTypeName || document?.documentTypeName || "Documento",
        updatedAt: document?.updatedAtUtc || item.updatedAtUtc || null,
      };
    }),
  }));
  for (const document of documents) {
    if (seen.has(document.id)) continue;
    let group = groups.find(
      (group) => document.categoryId && group.key === document.categoryId,
    );
    if (!group)
      group = groups.find(
        (group) =>
          group.name === (document.categoryName || "Outros documentos"),
      );
    if (!group) {
      group = {
        key: document.categoryId || `extra-${groups.length}`,
        name: document.categoryName || "Outros documentos",
        order: groups.length,
        rows: [],
      };
      groups.push(group);
    }
    group.rows.push({
      key: document.id,
      document,
      documentTypeId: document.documentTypeId,
      name: document.documentTypeName || "Documento",
      status: document.status,
      updatedAt: document.updatedAtUtc || null,
    });
  }
  return groups.sort((a, b) => a.order - b.order);
}
