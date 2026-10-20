import { documentVariants } from "./registrationDocuments.js";

const prefix = "SA_registration_resume:v2:";
export function registrationResumePath(value) {
  if (typeof value !== "string") return null;
  const match = /^\/cadastro\/etapa-([3-7])(?:\/([a-z-]+))?$/.exec(value);
  if (!match) return null;
  if (
    match[2] &&
    (match[1] !== "5" || !Object.hasOwn(documentVariants, match[2]))
  )
    return null;
  return value;
}
const keyFor = (userId) =>
  typeof userId === "string" && userId.trim()
    ? `${prefix}${encodeURIComponent(userId)}`
    : null;
export function rememberRegistrationStep(userId, path, storage) {
  const key = keyFor(userId),
    safePath = registrationResumePath(path);
  if (!key || !safePath) return false;
  try {
    (storage ?? window.localStorage).setItem(key, safePath);
    return true;
  } catch {
    return false;
  }
}
export function readRegistrationStep(userId, storage) {
  const key = keyFor(userId);
  if (!key) return null;
  try {
    const target = storage ?? window.localStorage;
    const current = target.getItem(key);
    if (current !== null) return registrationResumePath(current);
    const previous = target.getItem(key.replace(":v2:", ":v1:"));
    const match =
      typeof previous === "string" &&
      /^\/cadastro\/etapa-([3-7])(?:\/([a-z-]+))?$/.exec(previous);
    if (
      !match ||
      (match[2] &&
        (match[1] !== "4" || !Object.hasOwn(documentVariants, match[2])))
    )
      return null;
    const step = match[1] === "4" ? "5" : match[1] === "5" ? "4" : match[1];
    const migrated = registrationResumePath(
      `/cadastro/etapa-${step}${match[2] ? `/${match[2]}` : ""}`,
    );
    if (migrated) {
      target.setItem(key, migrated);
      target.removeItem?.(key.replace(":v2:", ":v1:"));
    }
    return migrated;
  } catch {
    return null;
  }
}
export function registrationLoginDestination(userId, next, storage) {
  const path =
    registrationResumePath(next) || readRegistrationStep(userId, storage);
  return path ? { path } : { name: "inicio" };
}
