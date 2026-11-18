export const communicationDirectoryAssets = {
  bell: "/figma/communication-directory/imgBell.svg",
  list: "/figma/communication-directory/1-72906-imgLayoutList.svg",
  grid: "/figma/communication-directory/1-72906-imgLayoutGrid.svg",
  down: "/figma/communication-directory/1-72906-imgChevronDown.svg",
  previous: "/figma/communication-directory/1-72906-imgChevronLeft.svg",
  next: "/figma/communication-directory/1-72906-imgChevronRight.svg",
  brandMask: "/system/icons/auth/logo-mask.svg",
  brand: "/figma/communication-directory/imgGroup1.svg",
  home: "/figma/communication-directory/imgHome.svg",
  contract: "/figma/communication-directory/imgFileDollar.svg",
  communication: "/figma/communication-directory/imgSpeakerphone.svg",
  leverage: "/figma/communication-directory/imgReceipt2.svg",
};

export function communicationDate(value) {
  if (typeof value !== "string" || !value.trim()) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
        .format(date)
        .replace(", ", " - ")
    : "—";
}
