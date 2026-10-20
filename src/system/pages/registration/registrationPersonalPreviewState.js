import { ref } from "vue";
import { newRegistrationPersonal } from "src/services/registrationPersonal";
// Presentation-only memory draft. No storage, URL parameters or HTTP persistence.
export const personalPreviewDraft = ref(newRegistrationPersonal());
