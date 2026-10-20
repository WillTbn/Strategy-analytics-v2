import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import {
  newRegistrationAccount,
  residenceChoices,
  validateRegistrationAccount,
} from "../src/services/registrationSteps.js";

const valid = () => ({
  ...newRegistrationAccount(),
  name: "Éric",
  email: " qa@example.com ",
  residence: "br",
  password: "password8",
  confirmation: "password8",
  accepted: true,
});
test("step one requires only the Figma fields and optional referral may stay blank", () => {
  assert.deepEqual(validateRegistrationAccount(valid()), {});
  const errors = validateRegistrationAccount(newRegistrationAccount());
  assert.deepEqual(Object.keys(errors).sort(), [
    "accepted",
    "confirmation",
    "email",
    "name",
    "password",
    "residence",
  ]);
  assert.ok(!("referralCode" in errors));
});
test("residence accepts one known presentation choice without inventing HTTP country IDs", () => {
  for (const residence of residenceChoices.map((item) => item.key))
    assert.equal(
      validateRegistrationAccount({ ...valid(), residence }).residence,
      undefined,
    );
  assert.ok(
    validateRegistrationAccount({ ...valid(), residence: "unknown" }).residence,
  );
  assert.equal(newRegistrationAccount().residence, "");
});
test("password length, exact confirmation, email and explicit acceptance are validated locally", () => {
  assert.ok(
    validateRegistrationAccount({ ...valid(), password: "short" }).password,
  );
  assert.ok(
    validateRegistrationAccount({ ...valid(), password: "        " }).password,
  );
  assert.ok(
    validateRegistrationAccount({ ...valid(), confirmation: "password8 " })
      .confirmation,
  );
  assert.ok(
    validateRegistrationAccount({ ...valid(), email: "invalid" }).email,
  );
  for (const accepted of [false, null, "true", 1])
    assert.ok(validateRegistrationAccount({ ...valid(), accepted }).accepted);
});
test("validation does not mutate input, leak values in errors, or share form state", () => {
  const input = { ...valid(), confirmation: "different-secret" };
  const copy = { ...input };
  const errors = validateRegistrationAccount(input);
  assert.deepEqual(input, copy);
  assert.ok(!JSON.stringify(errors).includes(input.password));
  assert.ok(!JSON.stringify(errors).includes(input.confirmation));
  const first = newRegistrationAccount(),
    second = newRegistrationAccount();
  first.name = "Edited";
  assert.equal(second.name, "");
});
test("registration screens ship in homologation builds and preserve the existing registration", async () => {
  const source = await readFile(
    new URL("../src/router/routes.js", import.meta.url),
    "utf8",
  );
  for (const dev of [false, true]) {
    const context = vm.createContext({ process: { env: { DEV: dev } } });
    const module = new vm.SourceTextModule(source, { context });
    await module.link(() => {
      throw new Error("No eager route imports expected");
    });
    await module.evaluate();
    const routes = module.namespace.default;
    for (const step of [1, 2, 3])
      assert.equal(
        routes.some(
          (route) =>
            route.path === `/cadastro/etapa-${step}` &&
            route.alias === `/dev/cadastro/etapa-${step}`,
        ),
        true,
      );
    assert.ok(
      routes.some((route) => route.path === "/cadastro/etapa-4/:variant?"),
    );
    assert.ok(routes.some((route) => route.path === "/cadastro/etapa-5"));
    assert.ok(routes.some((route) => route.path === "/cadastro/etapa-6"));
    assert.ok(routes.some((route) => route.path === "/cadastro/etapa-7"));
    assert.ok(routes.some((route) => route.path === "/cadastro/enviado"));
    assert.ok(routes.some((route) => route.name === "register"));
    assert.equal(routes.at(-1).path, "/:catchAll(.*)*");
  }
});
