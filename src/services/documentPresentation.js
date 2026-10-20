// Join by the actual file ID: several uploads may share one document type.
export function profileDocumentRows(documents, overview) {
  const items = (overview?.sections || []).flatMap((section) => section.items || []);
  return documents.map((document) => {
    const matches = items.filter((item) => (item.documentId || item.document?.id) === document.id);
    const item = matches.length === 1 ? matches[0] : null;
    const review = item?.latestReview;
    const notes = item?.status === "Rejected" && review?.status === "Rejected" && review.documentId === document.id ? review.notes : null;
    return {
      ...document,
      rejectionReason: document.status === "Rejected" ? document.rejectionReason || notes || "" : "",
    };
  });
}
export function documentReplacementValues(document) {
  return { issuedOn: document.issuedOn?.slice(0, 10) || "", expiresOn: document.expiresOn?.slice(0, 10) || "" };
}
