import { clientApi } from "./clientApi";
export async function getOnboardingConsents(locale = "pt-BR") {
  const response = await clientApi.get("/api/v1/client/consents/requirements", {
    params: { context: "Onboarding", locale },
  });
  return response.data?.data ?? response.data;
}
