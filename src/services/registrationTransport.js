import { clientApi } from "./clientApi";
import { createIdempotentWriter } from "./financeIdempotency";
const unwrap = (response) => response.data?.data ?? response.data;
export const registrationWrite = createIdempotentWriter(
  async (method, url, data, key) =>
    unwrap(
      await clientApi.request({
        method,
        url,
        data,
        headers: { "Idempotency-Key": key },
      }),
    ),
);
// File objects are not JSON-serializable; keep a separate retry key per file and metadata.
let files = new WeakMap();
export const resetRegistrationUploads = () => {
  files = new WeakMap();
};
export async function registrationUpload(file, metadata, customerId) {
  let keys = files.get(file);
  if (!keys) {
    keys = new Map();
    files.set(file, keys);
  }
  const signature = JSON.stringify([customerId, metadata]);
  if (keys.get(signature)?.result) return keys.get(signature).result;
  if (!keys.has(signature)) keys.set(signature, { key: crypto.randomUUID() });
  const action = keys.get(signature),
    form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(metadata))
    if (value != null)
      form.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : value,
      );
  action.result = unwrap(
    await clientApi.post("/api/v1/client/profile/documents", form, {
      headers: { "Idempotency-Key": action.key },
    }),
  );
  return action.result;
}
