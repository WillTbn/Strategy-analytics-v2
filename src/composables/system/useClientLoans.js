import { provide, inject, onScopeDispose } from "vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { listClientLoans } from "src/services/clientLoans";
const key = Symbol("client-loans");
export function provideClientLoans(read, paymentAdapter = null) {
  const resource = useFinanceResource();
  let active = true;
  const load = () => resource.load(() => listClientLoans(read, () => active));
  provide(key, { resource, load, paymentAdapter });
  load();
  onScopeDispose(() => {
    active = false;
    resource.reset();
  });
  return { resource, load };
}
export function useClientLoans() {
  return inject(key);
}
