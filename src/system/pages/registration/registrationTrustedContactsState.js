import { ref } from "vue";
import { newRegistrationTrustedContacts } from "src/services/registrationTrustedContacts";
// Presentation memory only; no browser storage, URL parameters or HTTP writes.
export const trustedContactsDraft = ref(newRegistrationTrustedContacts());
