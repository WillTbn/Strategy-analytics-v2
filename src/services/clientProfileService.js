import { clientApi } from "./clientApi";

const unwrap = (response) => response.data?.data ?? response.data;

export async function getClientProfileSummary() { return unwrap(await clientApi.get("/api/v1/client/profile/summary")); }
export async function getClientProfile() { return unwrap(await clientApi.get("/api/v1/client/profile")); }
export async function updateClientProfile(profile) { return unwrap(await clientApi.patch("/api/v1/client/profile", profile)); }
export async function getClientPreferences() { return unwrap(await clientApi.get("/api/v1/client/profile/preferences")); }
export async function updateClientPreferences(preferences) { return unwrap(await clientApi.patch("/api/v1/client/profile/preferences", preferences)); }
export async function getPreferenceCatalog() { return unwrap(await clientApi.get("/api/v1/preferences/catalog")); }
export async function getClientProfessionalProfile() { return unwrap(await clientApi.get("/api/v1/client/profile/professional-profile")); }
export async function updateClientProfessionalProfile(profile) { return unwrap(await clientApi.put("/api/v1/client/profile/professional-profile", profile)); }
export async function getClientFinancialProfile() { return unwrap(await clientApi.get("/api/v1/client/profile/financial-profile")); }
export async function updateClientFinancialProfile(profile) { return unwrap(await clientApi.put("/api/v1/client/profile/financial-profile", profile)); }
export async function getClientTrustedContacts() { return unwrap(await clientApi.get("/api/v1/client/profile/trusted-contacts")); }
export async function createClientTrustedContact(contact) { return unwrap(await clientApi.post("/api/v1/client/profile/trusted-contacts", contact)); }
export async function updateClientTrustedContact(contactId, contact) { return unwrap(await clientApi.put(`/api/v1/client/profile/trusted-contacts/${contactId}`, contact)); }
export async function deleteClientTrustedContact(contactId) { return unwrap(await clientApi.delete(`/api/v1/client/profile/trusted-contacts/${contactId}`)); }
export async function listClientBanks(params = {}) { return unwrap(await clientApi.get("/api/v1/client/banks", { params })); }
export async function listClientBankAccounts(params = {}) { return unwrap(await clientApi.get("/api/v1/client/profile/bank-accounts", { params })); }
export async function getClientBankAccount(accountId) { return unwrap(await clientApi.get(`/api/v1/client/profile/bank-accounts/${accountId}`)); }
export async function createClientBankAccount(account) { return unwrap(await clientApi.post("/api/v1/client/profile/bank-accounts", account)); }
export async function updateClientBankAccount(accountId, account) { return unwrap(await clientApi.patch(`/api/v1/client/profile/bank-accounts/${accountId}`, account)); }
export async function setPrimaryClientBankAccount(accountId) { return unwrap(await clientApi.post(`/api/v1/client/profile/bank-accounts/${accountId}/primary`)); }
export async function archiveClientBankAccount(accountId) { return unwrap(await clientApi.post(`/api/v1/client/profile/bank-accounts/${accountId}/archive`)); }
