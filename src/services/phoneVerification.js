export const normalizePhoneNumber = (value) =>
  String(value || "")
    .trim()
    .replace(/[\s().-]/g, "");
export const phoneInputMask = (format = "BR") =>
  format === "BR" ? "+## (##) #####-####" : "+###############";
export function createPhoneVerification(state, deps) {
  let active = true;
  const validPhone = () =>
    (state.format === "BR" ? /^\+55[1-9]\d9\d{8}$/ : /^\+[1-9]\d{7,14}$/).test(
      normalizePhoneNumber(state.number),
    );
  const reset = () => {
    state.code = "";
    state.sentTo = "";
    state.error = "";
    state.message = "";
  };
  async function run(kind) {
    if (!active || state.busy) return;
    state.error = "";
    state.message = "";
    const number = normalizePhoneNumber(state.number);
    if (!validPhone()) {
      state.error =
        "Informe um celular válido com +, código do país e DDD. Exemplo: +55 (11) 90000-0000.";
      return;
    }
    if (kind === "confirm" && (state.sentTo !== number || !state.code.trim())) {
      state.error =
        "Solicite o código para este celular e preencha o código recebido.";
      return;
    }
    const session = deps.capture();
    const current = () => active && deps.isCurrent(session);
    state.busy = kind;
    try {
      if (kind === "send") {
        state.code = "";
        state.sentTo = "";
        const result = await deps.request(number);
        if (!current()) return;
        if (result?.accepted !== true) {
          state.error = "O envio não foi confirmado. Tente solicitar um novo código.";
          return;
        }
        state.sentTo = number;
        state.message = "Código enviado. Confira o celular informado.";
      } else {
        const result = await deps.confirm(number, state.code.trim());
        if (!current()) return;
        state.code = "";
        if (result?.succeeded !== true) {
          state.error = "Não foi possível validar o código. Confira o código mais recente ou solicite outro.";
          return;
        }
        state.message = "Celular confirmado. Atualizando seu progresso...";
        deps.verified();
      }
    } catch (error) {
      if (current()) {
        state.error = deps.errorMessage(
          error,
          "Não foi possível confirmar o celular. Tente novamente.",
        );
        state.code = "";
      }
    } finally {
      if (current()) state.busy = "";
    }
  }
  return {
    send: () => run("send"),
    confirm: () => run("confirm"),
    reset,
    dispose() {
      active = false;
      reset();
      state.number = "";
      state.busy = "";
    },
  };
}
