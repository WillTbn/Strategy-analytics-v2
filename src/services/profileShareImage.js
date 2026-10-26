// Presentation model only. Map the future sharing endpoint here once its HTTP
// contract is published; the existing public-profile links are not invitations.
export const SHARE_FORMATS = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};
const number = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const count = (value) => (Number.isInteger(value) && value >= 0 ? value : null);
export function invitationUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function shareImageModel(
  profile = {},
  data = null,
  privateMode = false,
  now = new Date(),
) {
  const name =
    typeof profile.displayName === "string" ? profile.displayName.trim() : "";
  const parts = name.split(/\s+/).filter(Boolean);
  const since = new Date(profile.customerSinceUtc);
  const validSince =
    !!profile.customerSinceUtc &&
    Number.isFinite(since.getTime()) &&
    since <= now;
  const months = validSince
    ? Math.max(
        0,
        (now.getUTCFullYear() - since.getUTCFullYear()) * 12 +
          now.getUTCMonth() -
          since.getUTCMonth() -
          (now.getUTCDate() < since.getUTCDate() ? 1 : 0),
      )
    : null;
  const years = months == null ? null : Math.floor(months / 12);
  const metric = {
    sinceEntry: number(data?.sinceEntry),
    last12Months: number(data?.last12Months),
    monthlyAverage: number(data?.monthlyAverage),
    activeContracts: count(data?.activeContracts),
    completedContracts: count(data?.completedContracts),
  };
  const code =
    typeof data?.referralCode === "string" &&
    /^[\w-]{1,64}$/.test(data.referralCode)
      ? data.referralCode
      : "";
  const invite = invitationUrl(data?.invitationUrl);
  const month = (date) =>
    date
      .toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
      .replace(". de ", "/")
      .replace(" de ", "/");
  return {
    name: (privateMode ? parts[0] : name) || "Nome indisponível",
    initials:
      parts
        .map((part) => Array.from(part)[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "—",
    customerId:
      typeof profile.customerId === "string" ? profile.customerId : "—",
    level: count(profile.documentLevel),
    privateMode,
    since: validSince ? month(since) : "—",
    tenure:
      months == null
        ? "—"
        : years
          ? `${years} ${years === 1 ? "ano" : "anos"}`
          : months
            ? `${months} ${months === 1 ? "mês" : "meses"}`
            : "menos de 1 mês",
    period: validSince
      ? `${month(since)} a ${month(now)}`
      : "Período indisponível",
    date: now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    ...metric,
    referralCode: code,
    invitationUrl: invite,
    ready:
      !!name &&
      validSince &&
      count(profile.documentLevel) != null &&
      !!profile.customerId &&
      Object.values(metric).every((value) => value !== null) &&
      !!code &&
      !!invite,
  };
}
export function sharePercent(value) {
  return value == null
    ? "—"
    : `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}
export async function imageDataUrl(url, signal, mimePrefix = "image/") {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Não foi possível carregar a imagem.");
  const blob = await response.blob();
  if (mimePrefix && !blob.type.startsWith(mimePrefix))
    throw new Error("Formato de imagem inválido.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(blob);
  });
}
export async function profileSharePng(svg, format) {
  const dimensions = SHARE_FORMATS[format];
  if (!svg || !dimensions) throw new Error("Pré-visualização indisponível.");
  const clone = svg.cloneNode(true);
  clone.setAttribute("width", dimensions.width);
  clone.setAttribute("height", dimensions.height);
  // Export only the dedicated allowlisted artwork, never the surrounding profile.
  const source = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Não foi possível gerar o PNG.")),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
