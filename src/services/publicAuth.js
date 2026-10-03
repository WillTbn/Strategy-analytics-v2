// Only these endpoints are anonymous; logout must retain its bearer token.
const publicPaths = new Set([
  "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh",
  "/api/v1/auth/email-confirmation/request", "/api/v1/auth/email-confirmation/confirm",
  "/api/v1/auth/email/confirm", "/api/v1/auth/email/resend-confirmation",
  "/api/v1/auth/password-reset/request", "/api/v1/auth/password-reset/complete",
]);
export const isPublicAuthRequest = (url = "") => publicPaths.has(url.split("?")[0]);
export const registrationPayload = ({ name, email, password, referralCode }) => ({
  name: name.trim(), email: email.trim(), password,
  referralCode: referralCode?.trim() || null,
});
export function identityErrorMessage(error, fallback) {
  const code = error?.response?.data?.errors?.[0]?.code;
  const messages = {
    "users.email_invalid": "Confira o e-mail informado. Se ainda não criou a conta, cadastre-se primeiro.",
    verification_code_invalid: "Código inválido. Confira o código recebido.",
    verification_code_expired: "O código expirou. Solicite um novo.",
    verification_code_revoked: "Este código foi substituído. Use o mais recente.",
    verification_code_used: "Este código já foi utilizado. Tente entrar na sua conta.",
    verification_code_attempts_exceeded: "Limite de tentativas atingido. Aguarde antes de tentar novamente.",
    verification_code_resend_wait: "Aguarde antes de solicitar outro código.",
    verification_code_send_limit_reached: "Limite de envios atingido. Tente novamente mais tarde.",
    email_already_confirmed: "E-mail já confirmado. Você pode entrar na sua conta.",
  };
  if (messages[code]) return messages[code];
  if (error?.response?.status === 429) return "Muitas tentativas. Aguarde antes de tentar novamente.";
  // Do not echo arbitrary API messages that may contain submitted personal data.
  return fallback;
}
export function retrySeconds(error) {
  const bodySeconds = error?.response?.data?.errors?.find(item => item.retryAfterSeconds != null)?.retryAfterSeconds;
  if (bodySeconds != null && Number.isFinite(Number(bodySeconds))) return Math.max(0, Math.ceil(Number(bodySeconds)));
  const header = error?.response?.headers?.["retry-after"];
  const numeric = Number(header);
  if (header && Number.isFinite(numeric)) return Math.max(0, Math.ceil(numeric));
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1000)) : 60;
}
