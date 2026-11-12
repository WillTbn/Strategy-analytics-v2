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
export function createAnnouncementsService({
  read,
  write,
  assertCurrent = () => {},
}) {
  return {
    async list(params) {
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
