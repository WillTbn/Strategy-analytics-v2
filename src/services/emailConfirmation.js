import { computed, ref, watch } from "vue";
import { identityErrorMessage, retrySeconds } from "./publicAuth.js";

export function maskedConfirmationEmail(value) {
  const address = String(value || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(address)) return "";
  const [local, domain] = address.split("@");
  return `${Array.from(local)[0]}•••@${domain}`;
}

// Shared by the existing public confirmation and the seven-step UI.
// The caller supplies the existing HTTP services; tests/previews never need a network.
export function createEmailConfirmation({
  initialEmail = "",
  confirmEmail,
  requestEmailConfirmation,
  clock = {
    now: () => Date.now(),
    setInterval: (callback, delay) => setInterval(callback, delay),
    clearInterval: (timer) => clearInterval(timer),
  },
}) {
  const email = ref(initialEmail),
    code = ref("");
  const confirming = ref(false),
    sending = ref(false),
    confirmed = ref(false);
  const error = ref(""),
    codeError = ref(""),
    notice = ref("");
  const remaining = ref(0),
    blocked = ref(false);
  const busy = computed(() => confirming.value || sending.value);
  let timer,
    deadline = 0,
    generation = 0,
    active = true;
  const stopTimer = () => {
    clock.clearInterval(timer);
    timer = undefined;
  };
  const cooldown = (seconds) => {
    stopTimer();
    deadline = clock.now() + seconds * 1000;
    const tick = () => {
      remaining.value = Math.max(0, Math.ceil((deadline - clock.now()) / 1000));
      if (!remaining.value) {
        blocked.value = false;
        stopTimer();
      }
    };
    tick();
    if (remaining.value) timer = clock.setInterval(tick, 1000);
  };
  const reset = () => {
    generation++;
    stopTimer();
    remaining.value = 0;
    blocked.value = false;
    code.value = "";
    codeError.value = "";
    error.value = "";
    notice.value = "";
    confirmed.value = false;
    confirming.value = false;
    sending.value = false;
  };
  const stopWatching = watch(email, reset, { flush: "sync" });
  const current = (operation, address) =>
    active && generation === operation && email.value.trim() === address;
  const validAddress = () => {
    if (maskedConfirmationEmail(email.value)) return true;
    error.value = "Informe um e-mail válido para confirmar o cadastro.";
    return false;
  };
  const handleError = (failure, fallback) => {
    error.value = identityErrorMessage(failure, fallback);
    const code = failure?.response?.data?.errors?.[0]?.code || "";
    if (
      failure?.response?.status === 429 ||
      /verification_code_(attempts_exceeded|resend_wait|send_limit_reached)/.test(
        code,
      )
    ) {
      blocked.value = code === "verification_code_attempts_exceeded";
      cooldown(retrySeconds(failure));
    }
  };
  const confirm = async () => {
    if (
      !active ||
      busy.value ||
      confirmed.value ||
      (blocked.value && remaining.value)
    )
      return false;
    if (!validAddress()) return false;
    if (!code.value.trim()) {
      codeError.value = "Informe o código recebido.";
      return false;
    }
    const operation = generation,
      address = email.value.trim(),
      submittedCode = code.value;
    confirming.value = true;
    error.value = "";
    notice.value = "";
    codeError.value = "";
    try {
      const result = await confirmEmail(address, submittedCode);
      if (!current(operation, address)) return false;
      if (result?.succeeded === true) {
        confirmed.value = true;
        code.value = "";
        stopTimer();
        remaining.value = 0;
        blocked.value = false;
        return true;
      }
      error.value =
        "Não foi possível confirmar. Confira o código ou solicite outro.";
    } catch (failure) {
      if (current(operation, address))
        handleError(
          failure,
          "Não foi possível confirmar o e-mail. Confira os dados e tente novamente.",
        );
    } finally {
      if (current(operation, address)) confirming.value = false;
    }
    return false;
  };
  const resend = async () => {
    if (
      !active ||
      busy.value ||
      confirmed.value ||
      remaining.value ||
      !validAddress()
    )
      return false;
    const operation = generation,
      address = email.value.trim();
    sending.value = true;
    error.value = "";
    notice.value = "";
    try {
      const result = await requestEmailConfirmation(address);
      if (!current(operation, address)) return false;
      if (result?.accepted === true) {
        code.value = "";
        codeError.value = "";
        notice.value =
          "Solicitação aceita. Verifique sua caixa de entrada e o spam.";
        cooldown(60);
        return true;
      }
      error.value = "O envio não foi aceito. Tente novamente mais tarde.";
    } catch (failure) {
      if (current(operation, address))
        handleError(
          failure,
          "Não foi possível solicitar o código. Confira o e-mail e tente novamente.",
        );
    } finally {
      if (current(operation, address)) sending.value = false;
    }
    return false;
  };
  const dispose = () => {
    if (!active) return;
    active = false;
    generation++;
    stopWatching();
    stopTimer();
    code.value = "";
    email.value = "";
    confirming.value = false;
    sending.value = false;
  };
  return {
    email,
    code,
    confirming,
    sending,
    confirmed,
    error,
    codeError,
    notice,
    remaining,
    blocked,
    busy,
    confirm,
    resend,
    dispose,
  };
}
