// Read only completed deposits, across all pages. A failed/inconsistent read is never an empty account.
export async function readHomeDepositHistory({
  list,
  detail,
  assertCurrent = () => {},
  executionDatesNeeded = true,
}) {
  const records = [],
    ids = new Set();
  let page = 1,
    total = null;
  while (true) {
    assertCurrent();
    const response = await list({
      page,
      pageSize: executionDatesNeeded ? 100 : 1,
      type: "Deposit",
      status: "Completed",
    });
    assertCurrent();
    const pagination = response?.pagination;
    if (
      response?.success === false ||
      !Array.isArray(response?.data) ||
      !pagination ||
      !Number.isInteger(pagination.totalItems) ||
      pagination.totalItems < 0 ||
      typeof pagination.hasNextPage !== "boolean"
    )
      throw new Error("O histórico de depósitos não pôde ser confirmado.");
    if (total !== null && pagination.totalItems !== total)
      throw new Error("O histórico mudou durante a consulta. Tente novamente.");
    total = pagination.totalItems;
    for (const record of response.data) {
      if (
        !record.id ||
        ids.has(record.id) ||
        record.type !== "Deposit" ||
        record.status !== "Completed"
      )
        throw new Error("O histórico de depósitos não pôde ser confirmado.");
      ids.add(record.id);
      records.push(record);
    }
    if (!executionDatesNeeded && records.length && total >= records.length)
      return {
        hasCompletedDeposit: true,
        firstDepositAtUtc: null,
        dateUnavailable: true,
      };
    if (!pagination.hasNextPage) break;
    if (!response.data.length)
      throw new Error("O histórico de depósitos não pôde ser confirmado.");
    page++;
  }
  if (records.length !== total)
    throw new Error("O histórico de depósitos está incompleto.");
  if (!records.length)
    return {
      hasCompletedDeposit: false,
      firstDepositAtUtc: null,
      dateUnavailable: false,
    };
  const dates = [];
  let dateUnavailable = false;
  for (let offset = 0; offset < records.length; offset += 4) {
    assertCurrent();
    const batch = records.slice(offset, offset + 4);
    const results = await Promise.allSettled(
      batch.map((record) => detail(record.id)),
    );
    assertCurrent();
    results.forEach((result, index) => {
      const record = result.status === "fulfilled" ? result.value : null;
      if (
        record?.id !== batch[index].id ||
        record?.type !== "Deposit" ||
        record?.status !== "Completed" ||
        !record?.completedAtUtc ||
        !Number.isFinite(Date.parse(record.completedAtUtc))
      )
        dateUnavailable = true;
      else dates.push(record.completedAtUtc);
    });
  }
  return {
    hasCompletedDeposit: true,
    firstDepositAtUtc: dateUnavailable
      ? null
      : dates.sort((a, b) => Date.parse(a) - Date.parse(b))[0],
    dateUnavailable,
  };
}
