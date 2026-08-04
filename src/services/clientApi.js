import axios from "axios";
import { Cookies } from "quasar";

/**
 * Instância dedicada à API do cliente (Strategy Analytics - codebiz).
 * Mantida SEPARADA do `api` (boot/axios.js -> Sanctum) para não afetar o
 * restante do app. Usada apenas no fluxo de autenticação do cliente.
 */

// Sobrescreva via process.env.CLIENT_API_URL se necessário.
const baseURL = process.env.CLIENT_API_URL || "https://strategyanalytics.codebiz.com.br";

const tokenName = process.env.COOKIE_TOKEN_NAME ?? "SA_token";

const clientApi = axios.create({ baseURL });

// Gera um UUID v4 para o header Idempotency-Key
const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Anexa o Bearer token (cookie) e o Idempotency-Key obrigatório nas escritas.
clientApi.interceptors.request.use((config) => {
  const token = Cookies.get(tokenName);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method || "get").toLowerCase();
  if (
    ["post", "put", "patch", "delete"].includes(method) &&
    !config.headers["Idempotency-Key"]
  ) {
    config.headers["Idempotency-Key"] = generateIdempotencyKey();
  }

  return config;
});

export { clientApi };
