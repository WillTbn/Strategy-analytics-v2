export const announcementCategories = [
  { label: "Todos", value: "" },
  { label: "Comunicados S.A", value: "announcements", color: "#e5ffad" },
  { label: "Insights Relevantes", value: "insights", unavailable: true },
  { label: "Relatórios Econômicos", value: "reports", unavailable: true },
];
export const announcementApiCategories = [
  { value: "Institutional", label: "Institucional" },
  { value: "Operational", label: "Operacional" },
  { value: "Financial", label: "Financeiro" },
  { value: "Regulatory", label: "Regulatório" },
  { value: "Other", label: "Outros" },
];
export function announcementCategory(value) {
  return (
    announcementApiCategories.find((c) => c.value === value) || {
      label: value || "Comunicados S.A",
    }
  );
}
export function announcementDate(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date)
    : "—";
}
export const announcementPeriods = [
  { label: "Última semana", value: 7 },
  { label: "Último mês", value: 30 },
  { label: "Último ano", value: 365 },
];
export function createAnnouncementsService({
  read,
  write,
  assertCurrent = () => {},
  now = () => new Date(),
}) {
  return {
    async list(params) {
      if (params?.periodDays) {
        const { periodDays, page = 1, pageSize = 7, ...query } = params;
        if (!announcementPeriods.some((period) => period.value === periodDays))
          throw new Error("Selecione um período válido.");
        const rows = new Map();
        let current = 1,
          pages = 1,
          unreadCount = 0;
        do {
          assertCurrent();
          const result = await read("client/announcements", {
            ...query,
            page: current,
            pageSize: 100,
          });
          assertCurrent();
          if (!Array.isArray(result?.data))
            throw new Error("Não foi possível consultar os comunicados.");
          pages = Number(result.pagination?.totalPages ?? 1);
          if (!Number.isInteger(pages) || pages < 0 || pages > 1000)
            throw new Error("Não foi possível consultar o período completo.");
          if (current === 1) unreadCount = result.unreadCount;
          for (const item of result.data)
            if (!rows.has(item.id)) rows.set(item.id, item);
          current++;
        } while (current <= pages);
        const end = now().getTime(),
          start = end - periodDays * 86400000;
        const filtered = [...rows.values()].filter((item) => {
          const date = Date.parse(item.publishedAtUtc);
          return Number.isFinite(date) && date >= start && date <= end;
        });
        return {
          success: true,
          data: filtered.slice((page - 1) * pageSize, page * pageSize),
          unreadCount,
          pagination: {
            page,
            pageSize,
            totalItems: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
          },
        };
      }
      const result = await read("client/announcements", params);
      assertCurrent();
      if (!Array.isArray(result?.data))
        throw new Error("Não foi possível consultar os comunicados.");
      return result;
    },
    async open(id, isActive = () => true) {
      const path = "client/announcements/" + encodeURIComponent(id);
      const result = await read(path);
      assertCurrent();
      if (!isActive()) return null;
      if (!result?.data?.id || result.data.id !== id)
        throw new Error("Comunicado indisponível.");
      let readError = false;
      if (!result.data.isRead) {
        try {
          await write("post", path + "/read");
          assertCurrent();
        } catch {
          assertCurrent();
          readError = true;
        }
      }
      return isActive() ? { ...result.data, readError } : null;
    },
  };
}
