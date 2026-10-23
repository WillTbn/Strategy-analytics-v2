// Join by the actual file ID: several uploads may share one document type.
export function profileDocumentRows(documents, overview) {
  const items = (overview?.sections || []).flatMap(
    (section) => section.items || [],
  );
  return documents.map((document) => {
    const matches = items.filter(
      (item) =>
        (item.documentId || item.document?.id) === document.id ||
        item.files?.some((file) => file.id === document.id),
    );
    const item = matches.length === 1 ? matches[0] : null;
    const canonical =
      item?.files?.find((file) => file.id === document.id) ||
      (item?.document?.id === document.id ? item.document : null);
    const review = item?.latestReview;
    const notes =
      item?.status === "Rejected" &&
      review?.status === "Rejected" &&
      review.documentId === document.id
        ? review.notes
        : null;
    return {
      ...document,
      ...canonical,
      fileName: document.fileName || canonical?.file?.fileName,
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
  profile = null,
) {
  const seen = new Set(),
    suppressed = new Set();
  const currentProvided = new Map(
    (profile?.identificationDocuments?.documents || [])
      .filter(
        (item) =>
          item.source === "ProvidedDocument" &&
          item.documentTypeId &&
          item.documentId,
      )
      .map((item) => [item.documentTypeId, item.documentId]),
  );
  const source = (overview.sections || []).map((section) => ({
    ...section,
    items: (section.items || []).filter((item) => {
      const files = item.files?.length
        ? item.files
        : item.document
          ? [item.document]
          : [];
      const providedId =
        item.document?.providedDocumentId || files[0]?.providedDocumentId;
      const historical =
        providedId &&
        currentProvided.has(item.documentTypeId) &&
        currentProvided.get(item.documentTypeId) !== providedId;
      for (const file of files) {
        seen.add(file.id);
        if (historical) suppressed.add(file.id);
      }
      if (item.documentId && historical) suppressed.add(item.documentId);
      return !historical;
    }),
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
      if (suppressed.has(requirement.documentId)) continue;
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
      const attachments = (
        item.files?.length ? item.files : document ? [document] : []
      ).map((file) => {
        seen.add(file.id);
        return documents.find((candidate) => candidate.id === file.id) || file;
      });
      return {
        ...item,
        key: item.requirementId || id || `${index}-${rowIndex}`,
        document,
        documents: attachments,
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
    if (seen.has(document.id) || currentProvided.has(document.documentTypeId))
      continue;
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
      documents: [document],
      documentTypeId: document.documentTypeId,
      name: document.documentTypeName || "Documento",
      status: document.status,
      updatedAt: document.updatedAtUtc || null,
    });
  }
  return groups.sort((a, b) => a.order - b.order);
}
