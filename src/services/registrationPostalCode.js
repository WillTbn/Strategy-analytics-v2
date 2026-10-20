export function normalizeBrazilianPostalCode(value) {
  const text = String(value ?? "").trim();
  return /^\d{5}-?\d{3}$/.test(text) ? text.replace("-", "") : null;
}

export function createRegistrationPostalLookup({
  values,
  read,
  state,
  region,
}) {
  let revision = 0;
  let completed = null;
  const invalidate = () => {
    revision++;
    completed = null;
    state.loading = false;
    state.error = "";
  };
  const lookup = async () => {
    const cep = normalizeBrazilianPostalCode(values.postalCode);
    if (!cep) {
      invalidate();
      if (String(values.postalCode ?? "").trim())
        state.error = "Informe um CEP com 8 dígitos.";
      return;
    }
    if (state.loading || completed === cep) return;
    const request = ++revision;
    const before = { ...values };
    state.loading = true;
    state.error = "";
    try {
      const result = await read(cep);
      if (
        request !== revision ||
        normalizeBrazilianPostalCode(values.postalCode) !== cep
      )
        return;
      if (!result || result.erro === true || result.erro === "true") {
        state.error =
          "CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.";
        return;
      }
      if (
        normalizeBrazilianPostalCode(result.cep) !== cep ||
        typeof result.localidade !== "string" ||
        !result.localidade.trim() ||
        typeof result.uf !== "string" ||
        !/^[A-Z]{2}$/.test(result.uf)
      )
        throw new Error("Incomplete postal response");
      for (const [key, value] of Object.entries({
        street: result.logradouro,
        district: result.bairro,
        city: result.localidade,
        region: result.uf,
      })) {
        // Do not overwrite edits made while the request was in flight or
        // erase fields when a generic CEP does not provide a street/district.
        if (
          typeof value === "string" &&
          value.trim() &&
          values[key] === before[key]
        ) {
          values[key] = value.trim();
          if (key === "region") region(value.trim(), result.estado);
        }
      }
      completed = cep;
    } catch {
      if (request === revision)
        state.error =
          "Não foi possível consultar o CEP. Preencha o endereço manualmente ou tente novamente ao sair do CEP.";
    } finally {
      if (request === revision) state.loading = false;
    }
  };
  return { lookup, invalidate };
}
