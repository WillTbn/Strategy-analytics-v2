import { clientApi } from "src/services/clientApi";
import {
  login as clientLogin,
  getCurrentUser,
  logout as clientLogout,
  getApiErrorMessage,
} from "src/services/clientAuthService";
import { useUserStore } from "src/stores/user";
import { Cookies } from "quasar";
import { useRouter } from "vue-router";
import useNotify from "../useNotify";
import { ref } from "vue";
import useCookies from "../useCookies";

// Cookie para o refresh token da API do cliente
const refreshName = process.env.COOKIE_REFRESH ?? "SA_refresh";
const refreshOptions = { path: "/", secure: true, sameSite: "None" };

// Garante registro único do interceptor de resposta (evita acúmulo a cada navegação)
let interceptorRegistered = false;

export default function useAuth() {
  const useStore = useUserStore();
  const {
    setTokenCookie,
    deleteTokenCookie,
    setUserCookie,
    tokenName,
  } = useCookies();

  const router = useRouter();
  const { errorNotify, infoNotify, alternativeNotify } = useNotify();
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
      role_id: roles.includes("Cliente") ? 3 : 1,
      account: u.account ?? {},
    };
  };

  // Trata 401 da API do cliente: limpa sessão e volta ao login.
  const registerInterceptor = () => {
    if (interceptorRegistered) return;
    interceptorRegistered = true;
    clientApi.interceptors.response.use(
      (res) => Promise.resolve(res),
      (err) => {
        if (err?.response?.status === 401) {
          deleteTokenCookie();
          Cookies.remove(refreshName, refreshOptions);
          alternativeNotify("Sessão expirou, refaça login para prosseguir", 3000);
          router.replace({ path: "/login" });
          return Promise.resolve(err);
        }
        return Promise.reject(err);
      },
    );
  };

  /**
   * Login do cliente na API (codebiz). `value.person` carrega o e-mail.
   */
  const auth = async (value) => {
    loading.value = true;
    try {
      const payload = await clientLogin({
        email: value.person,
        password: value.password,
      });

      setTokenCookie({ token: payload.accessToken });
      if (payload.refreshToken) {
        Cookies.set(refreshName, payload.refreshToken, refreshOptions);
      }
      setUserCookie(normalizeUser(payload.user));
      router.replace({ path: "/system/" });
    } catch (e) {
      errorNotify(getApiErrorMessage(e));
      errors.value = e?.response?.data?.errors ?? errors.value;
    } finally {
      loading.value = false;
    }
  };

  const verifyLogged = async () => {
    registerInterceptor();
    const token = Cookies.get(tokenName);
    if (!token) return;
    clientApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    await validatetoken();
  };

  /**
   * Valida a sessão do cliente contra GET /api/v1/auth/me.
   */
  const validatetoken = async () => {
    loading.value = true;
    try {
      const me = await getCurrentUser();
      setUserCookie(normalizeUser(me));
    } catch (e) {
      infoNotify("Faça login!");
      deleteTokenCookie();
      Cookies.remove(refreshName, refreshOptions);
    } finally {
      loading.value = false;
    }
  };

  const setLogout = async () => {
    loading.value = true;
    const refreshToken = Cookies.get(refreshName);
    try {
      await clientLogout(refreshToken);
    } catch (e) {
      console.log(e);
    } finally {
      deleteTokenCookie();
      Cookies.remove(refreshName, refreshOptions);
      useStore.setClear();
      loading.value = false;
      router.replace({ path: "/login" });
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
