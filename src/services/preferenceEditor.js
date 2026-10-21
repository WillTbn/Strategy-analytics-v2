const editableFields = new Set([
  "primaryCurrencyCode",
  "secondaryCurrencyCode",
  "languageCode",
  "timeZoneId",
]);
const catalogKeys = {
  primaryCurrencyCode: "currencies",
  secondaryCurrencyCode: "currencies",
  languageCode: "languages",
  timeZoneId: "timeZones",
};
const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);
export const preferenceOptions = (catalog, field) =>
  catalog?.[catalogKeys[field]] ?? [];

export function primaryResidentialCountry(profile) {
  const addresses = (profile?.addresses ?? []).filter(
    (address) =>
      address.isPrimary === true &&
      address.kind === "Residential" &&
      address.countryId,
  );
  return addresses.length === 1 ? addresses[0].countryId : null;
}

// Preserve existing server metadata without adding controls to the Figma.
export function preferencePayload(values) {
  const payload = Object.fromEntries(
    [...editableFields, "theme"].map((key) => [
      key,
      values[key] ?? (key.endsWith("CurrencyCode") ? null : ""),
    ]),
  );
  if (hasOwn(values, "countryId")) payload.countryId = values.countryId;
  return payload;
}

export function createPreferenceEditor({
  state,
  read,
  readCatalog,
  readProfile,
  write,
  errorMessage,
  captureSession = () => null,
  isSessionCurrent = () => true,
}) {
  let revision = 0;
  let active = true;
  let residentialCountryId = null;
  let loadedSession = null;
  const load = async () => {
    if (!active) return false;
    const operation = ++revision;
    const session = captureSession();
    const current = () =>
      active && operation === revision && isSessionCurrent(session);
    state.loading = true;
    state.loadError = "";
    state.saveError = "";
    try {
      const [values, catalog] = await Promise.all([read(), readCatalog()]);
      if (!current()) return false;
      let countryId = null;
      if (!values.countryId && readProfile) {
        try {
          countryId = primaryResidentialCountry(await readProfile());
        } catch {
          /* Profile availability must not block the preferences controls. */
        }
      }
      if (!current()) return false;
      loadedSession = session;
      residentialCountryId = countryId;
      state.values = preferencePayload(values);
      state.catalog = catalog;
      state.ready = true;
      return true;
    } catch (error) {
      if (current()) {
        state.ready = false;
        state.loadError = errorMessage(
          error,
          "Não foi possível carregar suas preferências. Atualize a página para tentar novamente.",
        );
      }
      return false;
    } finally {
      if (current()) state.loading = false;
    }
  };
  const select = async (field, value) => {
    if (
      !active ||
      !state.ready ||
      !isSessionCurrent(loadedSession) ||
      state.loading ||
      state.saving ||
      !editableFields.has(field)
    )
      return false;
    if (
      !preferenceOptions(state.catalog, field).some(
        (option) => option.value === value,
      )
    )
      return false;
    const operation = revision;
    const session = captureSession();
    const current = () =>
      active && operation === revision && isSessionCurrent(session);
    const previous = { ...state.values };
    state.values = { ...previous, [field]: value };
    state.saveError = "";
    state.saving = true;
    let accepted = false;
    try {
      const payload = preferencePayload(state.values);
      if (!payload.countryId && residentialCountryId)
        payload.countryId = residentialCountryId;
      const response = await write(payload);
      accepted = true;
      if (!current()) return false;
      const confirmed =
        response && hasOwn(response, "primaryCurrencyCode")
          ? response
          : await read();
      if (!current()) return false;
      state.values = preferencePayload(confirmed);
      return true;
    } catch (error) {
      if (current()) {
        if (!accepted) state.values = previous;
        else state.ready = false;
        state.saveError = errorMessage(
          error,
          accepted
            ? "A alteração foi enviada, mas não foi possível confirmar as preferências. Atualize a página."
            : "Não foi possível salvar a alteração. As preferências anteriores foram mantidas.",
        );
      }
      return false;
    } finally {
      if (current()) state.saving = false;
    }
  };
  return {
    load,
    select,
    dispose: () => {
      active = false;
      revision++;
    },
  };
}
