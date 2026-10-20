import axios from "axios";

// Existing public CEP lookup used by the legacy registration. Keep client
// credentials and authenticated API interceptors away from this lookup.
const postalApi = axios.create({
  baseURL: "https://sources.strategyanalytics.com.br/api/",
  timeout: 10000,
  withCredentials: false,
});
export async function lookupBrazilianPostalCode(cep) {
  const response = await postalApi.post("validator-cep", { cep });
  return response.data;
}
