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
}) {
  let revision = 0;
  let residentialCountryId = null;
  const load = async () => {
    const operation = ++revision;
    state.loading = true;
    state.loadError = "";
    state.saveError = "";
    try {
      const [values, catalog] = await Promise.all([read(), readCatalog()]);
      let countryId = null;
      if (!values.countryId && readProfile) {
        try {
          countryId = primaryResidentialCountry(await readProfile());
        } catch {
          /* Profile availability must not block the preferences controls. */
        }
      }
      if (operation !== revision) return false;
      residentialCountryId = countryId;
      state.values = preferencePayload(values);
      state.catalog = catalog;
      state.ready = true;
      return true;
    } catch (error) {
      if (operation === revision) {
        state.ready = false;
        state.loadError = errorMessage(
          error,
          "Não foi possível carregar suas preferências. Atualize a página para tentar novamente.",
        );
      }
      return false;
    } finally {
      if (operation === revision) state.loading = false;
    }
  };
  const select = async (field, value) => {
    if (
      !state.ready ||
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
      const confirmed =
        response && hasOwn(response, "primaryCurrencyCode")
          ? response
          : await read();
      if (operation !== revision) return false;
      state.values = preferencePayload(confirmed);
      return true;
    } catch (error) {
      if (operation === revision) {
        if (!accepted) state.values = previous;
        state.saveError = errorMessage(
          error,
          accepted
            ? "A alteração foi enviada, mas não foi possível confirmar as preferências. Atualize a página."
            : "Não foi possível salvar a alteração. As preferências anteriores foram mantidas.",
        );
      }
      return false;
    } finally {
      if (operation === revision) state.saving = false;
    }
  };
  return {
    load,
    select,
    dispose: () => {
      revision++;
    },
  };
}
