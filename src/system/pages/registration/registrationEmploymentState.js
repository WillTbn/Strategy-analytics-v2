import { ref } from "vue";
import { newRegistrationEmployment } from "src/services/registrationEmployment";
// Presentation memory only; never persisted to browser storage or transmitted.
export const employmentDraft = ref(newRegistrationEmployment());
