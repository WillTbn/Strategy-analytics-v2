import { financeGet, financeWrite } from "./financeService";
import { captureClientSession, assertClientSessionCurrent } from "./clientApi";
import {
  contractRequestPayload,
  requestSendUnavailable,
} from "./contractRequestDraft";

export async function sendContractRequest(
  draft,
  { isActive = () => true } = {},
) {
  const session = captureClientSession();
  const assertCurrent = () => {
    assertClientSessionCurrent(session);
    if (!isActive()) throw Error(requestSendUnavailable);
  };
  try {
    assertCurrent();
    const snapshot = JSON.parse(JSON.stringify(draft));
    const catalog = await financeGet("preferences/catalog");
    assertCurrent();
    const currency = catalog.data?.currencies?.find(
      (item) => item.value === "BRL",
    );
    const payload = contractRequestPayload(snapshot, currency?.id);
    const result = await financeWrite(
      "post",
      "client/contracts/requests",
      payload,
    );
    assertCurrent();
    if (!result?.id || typeof result.id !== "string")
      throw Error(requestSendUnavailable);
    return result;
  } catch {
    throw Error(requestSendUnavailable);
  }
}
