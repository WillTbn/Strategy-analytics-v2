import { NOT_INFORMED } from "./profilePresentation.js";
export function sessionRows(sessions, timeZone = "America/Sao_Paulo") {
  return sessions.map((session) => {
    const date = new Date(session.createdAtUtc);
    const ip = session.ipAddress || "";
    return {
      sessionId: session.sessionId,
      isCurrent: session.isCurrent === true,
      date:
        !session.createdAtUtc || Number.isNaN(date.getTime())
          ? NOT_INFORMED
          : new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "medium",
              timeZone,
            }).format(date),
      ip: ip.includes("*")
        ? ip
        : ip.includes(".")
          ? ip.split(".").slice(0, 2).join(".") + ".***.***"
          : ip
            ? ip.slice(0, 4) + ":****:****"
            : NOT_INFORMED,
      local: NOT_INFORMED,
      equipment: session.userAgent || NOT_INFORMED,
    };
  });
}
