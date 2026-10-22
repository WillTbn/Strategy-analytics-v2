export function countryName(country, locale = "pt-BR") {
  const iso = String(country?.isoCode || "").toUpperCase();
  if (/^[A-Z]{2}$/.test(iso)) {
    try {
      const name = new Intl.DisplayNames([locale || "pt-BR"], {
        type: "region",
        fallback: "none",
      }).of(iso);
      if (name) return name;
    } catch {
      /* Keep the real API label when the runtime lacks this locale. */
    }
  }
  return country?.name || "Descrição indisponível";
}
export function localizedCountryCatalog(catalog, locale) {
  return {
    ...catalog,
    locale,
    countries: (catalog.countries || []).map((country) => ({
      ...country,
      name: countryName(country, locale),
    })),
  };
}
