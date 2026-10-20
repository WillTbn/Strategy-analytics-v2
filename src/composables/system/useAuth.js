import {
  login as clientLogin,
  getCurrentUser,
  clientPing,
  logout as clientLogout,
  getApiErrorMessage,
} from "src/services/clientAuthService";
import { useUserStore } from "src/stores/user";
import { Cookies } from "quasar";
import { useRouter, useRoute } from "vue-router";
import useNotify from "../useNotify";
import { ref } from "vue";
import useCookies from "../useCookies";
import {
  resetClientSession,
  clientSessionVersion,
  isClientSessionVersion,
  captureClientSession,
  isClientSessionCurrent,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import { registrationLoginDestination } from "src/services/registrationResume";
import { assertLoginIdentity } from "src/services/sessionIsolation";

// Cookie para o refresh token da API do cliente
const refreshName = process.env.COOKIE_REFRESH ?? "SA_refresh";
const refreshOptions = { path: "/", secure: true, sameSite: "None" };

export default function useAuth() {
  const useStore = useUserStore();
  const { setTokenCookie, deleteTokenCookie, setUserCookie, tokenName } =
    useCookies();

  const router = useRouter();
  const route = useRoute();
  const { errorNotify, infoNotify } = useNotify();
  const loading = ref(false);
  const errors = ref({
    person: "",
    password: "",
  });
  const role = ref(null);

  // Normaliza o usuário da nova API para o shape esperado pelo store/navbar.
  // role_id === 3 = cliente (menu do cliente).
  const normalizeUser = (u = {}) => {
    const roles = u.roles ?? (u.role ? [u.role] : []);
    return {
      ...u,
      roles,
      role_id: roles.some((item) => ["Cliente", "Client"].includes(item))
        ? 3
        : 1,
      account: u.account ?? {},
    };
  };

  /**
   * Login do cliente na API (codebiz). `value.person` carrega o e-mail.
   */
  const auth = async (value, destination = null) => {
    if (loading.value) return;
    const credentials = {
      email: String(value.person || "").trim(),
      password: value.password,
    };
    const operation = resetClientSession();
    useStore.$reset();
    useStore.login.person = credentials.email;
    let identitySession = null;
    loading.value = true;
    try {
      const payload = await clientLogin(credentials);
      if (!isClientSessionVersion(operation)) return;
      if (!payload?.accessToken)
        throw new Error("O login não retornou uma sessão válida.");

      setTokenCookie({ token: payload.accessToken });
      if (Cookies.get(tokenName) !== payload.accessToken)
        throw new Error(
          "Não foi possível salvar a sessão. Confira as permissões de cookies do navegador.",
        );
      if (payload.refreshToken) {
        Cookies.set(refreshName, payload.refreshToken, refreshOptions);
      }
      identitySession = captureClientSession();
      const me = await getCurrentUser();
      assertLoginIdentity(credentials.email, payload, me);
      await clientPing();
      if (!isClientSessionVersion(operation)) return;
      assertClientSessionCurrent(identitySession);
      setUserCookie(normalizeUser(me));
      const next = registrationLoginDestination(me.id, route.query.next);
      await router.replace(destination || next);
      return true;
    } catch (e) {
      if (!isClientSessionVersion(operation)) return;
      if (identitySession && !isClientSessionCurrent(identitySession)) {
        useStore.$reset();
        return;
      }
      resetClientSession();
      deleteTokenCookie();
      Cookies.remove(refreshName, refreshOptions);
      useStore.$reset();
      errorNotify(getApiErrorMessage(e));
      errors.value = e?.response?.data?.errors ?? errors.value;
    } finally {
      loading.value = false;
    }
  };

  const verifyLogged = async () => {
    const token = Cookies.get(tokenName);
    if (!token) {
      useStore.$reset();
      return false;
    }
    return validatetoken();
  };

  /**
   * Valida a sessão do cliente contra GET /api/v1/auth/me.
   */
  const validatetoken = async () => {
    const operation = clientSessionVersion();
    const identitySession = captureClientSession();
    const previousUserId = useStore.data?.id;
    loading.value = true;
    try {
      const me = await getCurrentUser();
      await clientPing();
      if (!isClientSessionVersion(operation)) return false;
      assertClientSessionCurrent(identitySession);
      if (previousUserId && me.id !== previousUserId)
        throw new Error("A identidade da sessão mudou. Entre novamente.");
      setUserCookie(normalizeUser(me));
      return true;
    } catch (e) {
      if (!isClientSessionVersion(operation)) return false;
      if (!isClientSessionCurrent(identitySession)) {
        useStore.$reset();
        return false;
      }
      resetClientSession();
      infoNotify("Faça login!");
      deleteTokenCookie();
      Cookies.remove(refreshName, refreshOptions);
      useStore.$reset();
      return false;
    } finally {
      loading.value = false;
    }
  };

  const setLogout = async () => {
    const operation = clientSessionVersion();
    const identitySession = captureClientSession();
    loading.value = true;
    const refreshToken = Cookies.get(refreshName);
    try {
      await clientLogout(refreshToken);
    } catch (e) {
      // Local cleanup still runs when the server cannot revoke the session.
    } finally {
      if (isClientSessionVersion(operation)) {
        if (isClientSessionCurrent(identitySession)) {
          deleteTokenCookie();
          resetClientSession();
        }
        useStore.$reset();
        router.replace({ path: "/login" });
      }
      loading.value = false;
    }
  };

  return {
    auth,
    verifyLogged,
    setLogout,
    errors,
    loading,
    role,
  };
}
