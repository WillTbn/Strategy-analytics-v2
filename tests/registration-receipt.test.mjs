import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { ref } from "vue";
import { confirmedOnboardingSubmission } from "../src/services/registrationConsentRules.js";
async function receipt(result) {
  const source = await readFile(
    new URL(
      "../src/system/pages/registration/RegistrationSubmittedPage.vue",
      import.meta.url,
    ),
    "utf8",
  );
  const script = source.split("<script setup>")[1].split("</script>")[0];
  let mount;
  const destinations = [];
  const exports = {
    ref,
    onMounted: (fn) => {
      mount = fn;
    },
    onBeforeUnmount: () => {},
    useRouter: () => ({ replace: async (to) => destinations.push(to) }),
    getOnboardingStatus: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
    captureClientSession: () => 1,
    assertClientSessionCurrent: () => {},
    confirmedOnboardingSubmission,
    default: {},
  };
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(
    script + "\nexport {submission,error};",
    { context },
  );
  await module.link(
    () =>
      new vm.SyntheticModule(
        Object.keys(exports),
        function () {
          for (const [key, value] of Object.entries(exports))
            this.setExport(key, value);
        },
        { context },
      ),
  );
  await module.evaluate();
  await mount();
  return { state: module.namespace, destinations };
}
test("direct receipt link never claims an unsent registration was sent", async () => {
  const h = await receipt({
    submission: { status: "NotSubmitted", profileEditingLocked: false },
  });
  assert.equal(h.state.submission.value, null);
  assert.deepEqual(h.destinations, ["/cadastro/etapa-7"]);
});
test("receipt survives reload using the actual submitted status", async () => {
  const submission = {
    status: "Submitted",
    submittedAtUtc: "2026-10-22T20:00:00Z",
    profileEditingLocked: true,
  };
  const h = await receipt({ submission });
  assert.equal(
    h.state.submission.value.submittedAtUtc,
    submission.submittedAtUtc,
  );
  assert.equal(h.destinations.length, 0);
});
test("failed receipt read never renders a success confirmation", async () => {
  const h = await receipt(Error("Network"));
  assert.equal(h.state.submission.value, null);
  assert.match(h.state.error.value, /consultar o envio/);
});
