import { documentVariants } from "./registrationDocuments.js";

const prefix = "SA_registration_resume:v1:";
export function registrationResumePath(value) {
  if (typeof value !== "string") return null;
  const match = /^\/cadastro\/etapa-([3-7])(?:\/([a-z-]+))?$/.exec(value);
  if (!match) return null;
  if (
    match[2] &&
    (match[1] !== "4" || !Object.hasOwn(documentVariants, match[2]))
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
    return registrationResumePath(
      (storage ?? window.localStorage).getItem(key),
    );
  } catch {
    return null;
  }
}
export function registrationLoginDestination(userId, next, storage) {
  const path =
    registrationResumePath(next) || readRegistrationStep(userId, storage);
  return path ? { path } : { name: "inicio" };
}
