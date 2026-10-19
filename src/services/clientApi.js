import axios from "axios";
import { Cookies } from "quasar";
import { isPublicAuthRequest } from "./publicAuth";
import { createSessionFence } from "./sessionIsolation";

/**
 * Instância dedicada à API do cliente (Strategy Analytics - codebiz).
 * Mantida SEPARADA do `api` (boot/axios.js -> Sanctum) para não afetar o
 * restante do app. Usada apenas no fluxo de autenticação do cliente.
 */

// Sobrescreva via process.env.CLIENT_API_URL se necessário.
const baseURL = process.env.CLIENT_API_URL || "https://strategyanalytics.codebiz.com.br";

const tokenName = process.env.COOKIE_TOKEN_NAME ?? "SA_token";
const refreshName = process.env.COOKIE_REFRESH ?? "SA_refresh";
const userCookie = process.env.COOKIE_USER_DATA ?? "SA_user";
const cookieOptions = { path: "/", secure: true, sameSite: "None" };

const clientApi = axios.create({ baseURL });
const sessionFence = createSessionFence(() => Cookies.get(tokenName));

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
  config.sessionSnapshot = sessionFence.capture();
  const token = Cookies.get(tokenName);
  if (isPublicAuthRequest(config.url)) {
    config.skipAuthRefresh = true;
    config.timeout ||= 30000;
    delete config.headers.Authorization;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
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

let refreshPromise = null;

const clearSession = () => {
  Cookies.remove(tokenName, cookieOptions);
  Cookies.remove(refreshName, cookieOptions);
  Cookies.remove(userCookie, cookieOptions);
};

export const resetClientSession = () => {
  const version = sessionFence.advance();
  refreshPromise = null;
  clearSession();
  return version;
};
export const clientSessionVersion = () => sessionFence.version();
export const isClientSessionVersion = version => sessionFence.isVersion(version);
export const captureClientSession = () => sessionFence.capture();
export const isClientSessionCurrent = snapshot => sessionFence.isCurrent(snapshot);
export const assertClientSessionCurrent = snapshot => sessionFence.assertCurrent(snapshot);

const renewSession = async () => {
  const snapshot = sessionFence.capture();
  const refreshToken = Cookies.get(refreshName);
  if (!refreshToken) throw new Error("Refresh token indisponível");
  const { data } = await clientApi.post(
    "/api/v1/auth/refresh",
    { refreshToken },
    { skipAuthRefresh: true },
  );
  const payload = data?.data ?? data;
  sessionFence.assertCurrent(snapshot);
  if (!payload?.accessToken) throw new Error("A sessão não pôde ser renovada.");
  sessionFence.recordRefresh(snapshot, payload.accessToken);
  Cookies.set(tokenName, payload.accessToken, cookieOptions);
  if (Cookies.get(tokenName) !== payload.accessToken) throw new Error("Não foi possível salvar a sessão.");
  if (payload.refreshToken) Cookies.set(refreshName, payload.refreshToken, cookieOptions);
  return payload.accessToken;
};

clientApi.interceptors.response.use(
  (response) => {
    sessionFence.assertCurrent(response.config?.sessionSnapshot);
    return response;
  },
  async (error) => {
    const original = error.config;
    sessionFence.assertCurrent(original?.sessionSnapshot);
    if (error.response?.status !== 401 || original?.skipAuthRefresh || original?._authRetry) {
      return Promise.reject(error);
    }
    original._authRetry = true;
    try {
      // A sibling request may already have renewed this same session.
      if (original.sessionSnapshot.token !== Cookies.get(tokenName)) return clientApi(original);
      if (!refreshPromise) {
        const pending = renewSession();
        refreshPromise = pending;
        pending.finally(() => { if (refreshPromise === pending) refreshPromise = null; }).catch(() => {});
      }
      const accessToken = await refreshPromise;
      if (!sessionFence.isVersion(original.sessionSnapshot?.version) || Cookies.get(tokenName) !== accessToken) {
        const error = new Error("Esta requisição pertence a uma sessão anterior.");
        error.code = "ERR_SESSION_CHANGED";
        throw error;
      }
      original.headers.Authorization = `Bearer ${accessToken}`;
      return clientApi(original);
    } catch (refreshError) {
      if (!sessionFence.isCurrent(original.sessionSnapshot)) return Promise.reject(refreshError);
      resetClientSession();
      if (window.location.pathname !== "/login") window.location.assign("/login?session=expired");
      return Promise.reject(refreshError);
    }
  },
);

export { clientApi };
