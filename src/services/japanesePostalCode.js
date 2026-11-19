export const JAPANESE_POSTAL_DATA = "/data/postal/jp/2026-10-30/";
export function normalizeJapanesePostalCode(value) {
  const text = String(value ?? "")
    .normalize("NFKC")
    .trim();
  return /^\d{3}-?\d{4}$/.test(text) ? text.replace("-", "") : null;
}
export function createJapanesePostalReader({
  fetcher = (url, options) => globalThis.fetch(url, options),
  basePath = JAPANESE_POSTAL_DATA,
  timeout = 10000,
} = {}) {
  let catalogPromise = null;
  const shards = new Map();
  async function json(file) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(basePath + file, {
        credentials: "omit",
        cache: "force-cache",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw Error("Postal data unavailable");
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  function catalog() {
    if (!catalogPromise)
      catalogPromise = json("catalog.json")
        .then((data) => {
          if (
            !Array.isArray(data?.municipalities) ||
            !Array.isArray(data?.prefixes) ||
            data.prefixes.some(
              (p) => typeof p !== "string" || !/^\d{2}$/.test(p),
            )
          )
            throw Error("Invalid postal catalog");
          return data;
        })
        .catch((error) => {
          catalogPromise = null;
          throw error;
        });
    return catalogPromise;
  }
  function shard(prefix) {
    if (!shards.has(prefix)) {
      if (shards.size >= 4) shards.delete(shards.keys().next().value);
      shards.set(
        prefix,
        json(prefix + ".json")
          .then((data) => {
            if (!data || Array.isArray(data) || typeof data !== "object")
              throw Error("Invalid postal shard");
            return data;
          })
          .catch((error) => {
            shards.delete(prefix);
            throw error;
          }),
      );
    }
    return shards.get(prefix);
  }
  return async (value) => {
    const postalCode = normalizeJapanesePostalCode(value);
    if (!postalCode) throw Error("Invalid Japanese postal code");
    const index = await catalog(),
      prefix = postalCode.slice(0, 2);
    if (!index.prefixes.includes(prefix))
      return { status: "not-found", postalCode };
    const data = await shard(prefix),
      id = data[postalCode.slice(2)];
    if (id === undefined) return { status: "not-found", postalCode };
    if (Array.isArray(id)) return { status: "ambiguous", postalCode };
    if (!Number.isInteger(id) || id < 0)
      throw Error("Invalid municipality index");
    const location = index.municipalities[id];
    if (
      !Array.isArray(location) ||
      location.length !== 2 ||
      typeof location[0] !== "string" ||
      !/^\d{2}$/.test(location[0]) ||
      Number(location[0]) < 1 ||
      Number(location[0]) > 47 ||
      typeof location[1] !== "string" ||
      !location[1].trim()
    )
      throw Error("Invalid municipality");
    return {
      status: "found",
      postalCode,
      regionCode: location[0],
      city: location[1],
    };
  };
}
export const lookupJapanesePostalCode = createJapanesePostalReader();
export function createJapaneseRegistrationPostalLookup({
  values,
  read = lookupJapanesePostalCode,
  state,
}) {
  let revision = 0,
    completed = null;
  const invalidate = () => {
    revision++;
    completed = null;
    state.loading = false;
    state.error = "";
  };
  const lookup = async () => {
    const code = normalizeJapanesePostalCode(values.postalCode);
    if (!code) {
      invalidate();
      if (String(values.postalCode ?? "").trim())
        state.error = "Informe um código postal com 7 dígitos.";
      return;
    }
    if (state.loading || completed === code) return;
    const formatted = code.slice(0, 3) + "-" + code.slice(3);
    if (values.postalCode !== formatted) values.postalCode = formatted;
    const attempt = ++revision,
      before = { region: values.region, city: values.city };
    state.loading = true;
    state.error = "";
    try {
      const result = await read(code);
      if (
        attempt !== revision ||
        normalizeJapanesePostalCode(values.postalCode) !== code
      )
        return;
      if (result?.postalCode !== code) throw Error("Postal code mismatch");
      if (result.status === "ambiguous") {
        state.error =
          "Este código corresponde a mais de uma cidade. Preencha província e cidade manualmente.";
        return;
      }
      if (result.status === "not-found") {
        state.error =
          "Código postal não encontrado. Confira o código ou preencha província e cidade manualmente.";
        return;
      }
      if (
        result.status !== "found" ||
        typeof result.regionCode !== "string" ||
        !/^\d{2}$/.test(result.regionCode) ||
        Number(result.regionCode) < 1 ||
        Number(result.regionCode) > 47 ||
        typeof result.city !== "string" ||
        !result.city.trim()
      )
        throw Error("Incomplete postal result");
      if (values.region === before.region) values.region = result.regionCode;
      if (values.city === before.city) values.city = result.city;
      completed = code;
    } catch {
      if (attempt === revision)
        state.error =
          "Não foi possível consultar o código postal. Preencha província e cidade manualmente ou tente novamente ao sair do código.";
    } finally {
      if (attempt === revision) state.loading = false;
    }
  };
  return { lookup, invalidate };
}
