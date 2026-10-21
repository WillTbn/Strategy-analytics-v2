import { parseRegistrationAmount } from "./registrationEmployment.js";

// Preserve invalid inputs for field validation, and never round monetary values.
export function formatRegistrationInput(kind, value) {
  if (kind === "money") {
    const parsed = parseRegistrationAmount(value);
    if (parsed.kind !== "valid") return value;
    const [units, cents] = parsed.decimal.split(".");
    return `${units.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${cents}`;
  }
  if (kind === "phone") {
    const text = String(value ?? "").trim();
    if (!/^[\d\s().-]+$/.test(text)) return value;
    const digits = text.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, -4)}-${digits.slice(-4)}`;
  }
  return value;
}
