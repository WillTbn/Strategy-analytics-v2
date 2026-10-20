// Internal presentation keys only: these are not country IDs or HTTP enum values.
export const residenceChoices = [
  { key: "br", label: "🇧🇷 Brasil" },
  { key: "us", label: "🇺🇸 Estados Unidos" },
  { key: "ca", label: "🇨🇦 Canadá" },
  {
    key: "south-america",
    label: "🌎 América do Sul",
    description:
      "🇦🇷 Argentina, 🇨🇱 Chile, 🇨🇴 Colômbia, 🇵🇪 Peru, 🇺🇾 Uruguai e outros",
  },
  { key: "jp", label: "🇯🇵 Japão" },
  { key: "cn", label: "🇨🇳 China" },
  {
    key: "europe",
    label: "🇪🇺 Europa",
    description:
      "🇵🇹 Portugal, 🇪🇸 Espanha, 🇩🇪 Alemanha, 🇮🇹 Itália, 🇫🇷 França e outros",
  },
  {
    key: "africa",
    label: "🌍 África",
    description:
      "🇿🇦 África do Sul, 🇦🇴 Angola, 🇲🇿 Moçambique, 🇳🇬 Nigéria e outros",
  },
  { key: "au", label: "🇦🇺 Austrália" },
];

export function newRegistrationAccount() {
  return {
    name: "",
    email: "",
    residence: "",
    password: "",
    confirmation: "",
    referralCode: "",
    accepted: false,
  };
}

export function validateRegistrationAccount(value) {
  const errors = {};
  if (!String(value.name || "").trim())
    errors.name = "Informe seu nome completo.";
  const email = String(value.email || "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Informe um e-mail válido.";
  if (!residenceChoices.some((choice) => choice.key === value.residence))
    errors.residence = "Selecione onde você mora.";
  if (!String(value.password || "").trim() || value.password.length < 8)
    errors.password = "Use pelo menos 8 caracteres.";
  if (!value.confirmation || value.confirmation !== value.password)
    errors.confirmation = "As senhas não conferem.";
  if (value.accepted !== true)
    errors.accepted =
      "É necessário aceitar os Termos de Uso e a Política de Privacidade.";
  return errors;
}
