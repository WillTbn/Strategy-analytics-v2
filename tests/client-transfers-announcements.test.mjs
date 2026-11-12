import test from "node:test";
import assert from "node:assert/strict";
import {
  recipientLookupError,
  clientTransferPayload,
  transferAvailable,
  recipientMatches,
  clientTransferDeadline,
  clientTransferError,
  createTransferIntent,
} from "../src/services/clientTransferModel.js";
import {
  createAnnouncementsService,
  announcementDate,
} from "../src/services/clientAnnouncements.js";
const wallets = [
  { currencyId: "brl", currencyIsoCode: "BRL", type: "Free", available: 100 },
  { currencyId: "usd", currencyIsoCode: "USD", type: "Free", available: 999 },
];
const recipient = { strategyId: "SA-12345678", displayName: "Cliente T." };
const form = () => ({
  recipientStrategyId: " #sa-12345678 ",
  currencyId: "brl",
  sourceWallet: "Free",
  destinationWallet: "Applied",
  amount: 10,
  withdrawalPassword: "ficticia",
});
const httpError = (status, code) => ({
  response: { status, data: { errors: [{ code }] } },
});
test("transfer payload contains only contract fields and requires resolved current recipient", () => {
  const payload = clientTransferPayload(
    { ...form(), customerId: "leak", destinationContractId: "contract" },
    recipient,
    wallets,
  );
  assert.deepEqual(Object.keys(payload), [
    "recipientStrategyId",
    "currencyId",
    "sourceWallet",
    "destinationWallet",
    "amount",
    "withdrawalPassword",
  ]);
  assert.equal(payload.recipientStrategyId, recipient.strategyId);
  assert.equal(recipientMatches(recipient, "OTHER"), false);
  assert.throws(
    () => clientTransferPayload(form(), null, wallets),
    /destinatário/,
  );
  assert.throws(
    () =>
      clientTransferPayload(
        { ...form(), recipientStrategyId: "SA-NEW" },
        recipient,
        wallets,
      ),
    /destinatário/,
  );
});
test("transfer rejects contracts, missing currency, excess funds, missing password and invalid amounts", () => {
  for (const patch of [
    { sourceWallet: "Contract" },
    { destinationWallet: "Contract" },
    { currencyId: "unknown" },
    { amount: 100.01 },
    { amount: 0 },
    { amount: -1 },
    { amount: NaN },
    { amount: 0.001 },
    { withdrawalPassword: "" },
  ])
    assert.throws(() =>
      clientTransferPayload({ ...form(), ...patch }, recipient, wallets),
    );
  assert.equal(transferAvailable(wallets, "brl", "Free"), 100);
  assert.equal(transferAvailable(wallets, "brl", "Applied"), 0);
  assert.equal(
    transferAvailable([{ ...wallets[0], available: null }], "brl", "Free"),
    null,
  );
  assert.throws(
    () =>
      clientTransferPayload(form(), recipient, [
        { ...wallets[0], available: null },
      ]),
    /saldo/,
  );
});
test("only Strategy to recipient Deposit waits thirty days", () => {
  for (const from of ["Free", "Applied"])
    for (const to of ["Free", "Applied"])
      assert.equal(
        clientTransferDeadline(from, to),
        from === "Applied" && to === "Free" ? "Até 30 dias" : "Imediato",
      );
});
test("password errors use API codes and never echo server message or secrets", () => {
  assert.match(
    clientTransferError(
      httpError(409, "transaction.withdrawal_password_not_set"),
    ),
    /confirmação da senha/,
  );
  assert.match(
    clientTransferError(
      httpError(403, "transaction.withdrawal_password_invalid"),
    ),
    /incorreta/,
  );
  assert.match(
    clientTransferError(
      httpError(400, "transaction.withdrawal_password_required"),
    ),
    /Informe/,
  );
  assert.equal(
    clientTransferError({
      response: { status: 500, data: { errors: [{ message: "secret" }] } },
    }).includes("secret"),
    false,
  );
});
test("double click creates one request; new successful action creates a new key", async () => {
  let release,
    calls = [],
    count = 0;
  const intent = createTransferIntent(
    (p, key) => {
      calls.push(key);
      return new Promise((r) => {
        release = r;
      });
    },
    () => "key-" + ++count,
  );
  const a = intent.submit(form()),
    b = intent.submit(form());
  await Promise.resolve();
  assert.equal(calls.length, 1);
  release({ id: "ok" });
  await Promise.all([a, b]);
  const c = intent.submit(form());
  await Promise.resolve();
  release({ id: "ok2" });
  await c;
  assert.deepEqual(calls, ["key-1", "key-2"]);
});
test("ambiguous retry reuses key, changed amount creates another intent, definitive rejection releases key", async () => {
  let count = 0,
    calls = [],
    failure = new Error("offline");
  const intent = createTransferIntent(
    async (p, key) => {
      calls.push(key);
      throw failure;
    },
    () => "key-" + ++count,
  );
  await assert.rejects(intent.submit(form()));
  await assert.rejects(intent.submit(form()));
  await assert.rejects(intent.submit({ ...form(), amount: 20 }));
  failure = httpError(409, "transaction.withdrawal_password_not_set");
  await assert.rejects(intent.submit({ ...form(), amount: 20 }));
  await assert.rejects(intent.submit({ ...form(), amount: 20 }));
  assert.deepEqual(calls, ["key-1", "key-1", "key-2", "key-2", "key-3"]);
});
test("listing propagates server category/unread/pagination and does not mark anything read", async () => {
  const calls = [];
  const service = createAnnouncementsService({
    read: async (...args) => {
      calls.push(args);
      return { data: [], pagination: { totalPages: 3 }, unreadCount: 2 };
    },
    write: () => assert.fail("list must not register read"),
  });
  const result = await service.list({
    page: 2,
    category: "Institutional",
    unread: true,
  });
  assert.equal(result.pagination.totalPages, 3);
  assert.equal(result.unreadCount, 2);
  assert.deepEqual(calls[0], [
    "client/announcements",
    { page: 2, category: "Institutional", unread: true },
  ]);
});
test("open reads detail first, then registers only previously unread detail", async () => {
  const calls = [];
  for (const isRead of [false, true]) {
    const service = createAnnouncementsService({
      read: async (path) => {
        calls.push(path);
        return {
          data: { id: "id", isRead, body: "<script>do not execute</script>" },
        };
      },
      write: async (...args) => calls.push(args),
    });
    const result = await service.open("id");
    assert.equal(result.readError, false);
  }
  assert.deepEqual(calls, [
    "client/announcements/id",
    ["post", "client/announcements/id/read"],
    "client/announcements/id",
  ]);
});
test("failed read receipt preserves body and offers retry, but failed detail never marks read", async () => {
  let writes = 0;
  const service = createAnnouncementsService({
    read: async () => ({ data: { id: "id", body: "real", isRead: false } }),
    write: async () => {
      writes++;
      throw new Error("offline");
    },
  });
  const result = await service.open("id");
  assert.equal(result.body, "real");
  assert.equal(result.readError, true);
  const failed = createAnnouncementsService({
    read: async () => {
      throw httpError(403, "DocumentLevelInsufficient");
    },
    write: async () => writes++,
  });
  await assert.rejects(failed.open("id"));
  assert.equal(writes, 1);
});
test("navigation or session change during detail read prevents registration for obsolete screen", async () => {
  let active = false;
  const service = createAnnouncementsService({
    read: async () => ({ data: { id: "id", isRead: false } }),
    write: async () => assert.fail("obsolete read"),
  });
  assert.equal(await service.open("id", () => active), null);
  const changed = createAnnouncementsService({
    read: async () => ({ data: { id: "id", isRead: false } }),
    write: async () => assert.fail("session changed"),
    assertCurrent: () => {
      throw new Error("session changed");
    },
  });
  await assert.rejects(changed.open("id"), /session changed/);
});
test("malformed announcement and invalid dates do not become fake data", async () => {
  const service = createAnnouncementsService({
    read: async () => ({ data: null }),
    write: async () => assert.fail("malformed"),
  });
  await assert.rejects(service.list({}));
  await assert.rejects(service.open("id"));
  assert.equal(announcementDate("invalid"), "—");
  assert.equal(announcementDate(null), "—");
});

test("recipient errors distinguish own account, unknown ID and transport failure", () => {
  assert.match(
    recipientLookupError(httpError(400, "transaction.same_client")),
    /outro cliente/,
  );
  assert.match(
    recipientLookupError(httpError(404, "transaction.recipient_not_found")),
    /não encontrado/,
  );
  assert.match(recipientLookupError(new Error("offline")), /consultar/);
});
