import { reactive, ref } from "vue";
// Presentation memory only; never persisted to browser storage or sent as an HTTP body.
export const documentDrafts = reactive({});

export const activeDocumentVariant = ref(null);
