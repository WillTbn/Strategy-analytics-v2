<template>
  <q-form class="registration-trusted" novalidate @submit="submit">
    <p class="intro">
      Uma pessoa que possamos procurar se não conseguirmos falar com você.
    </p>
    <div
      v-for="(contact, index) in form.contacts"
      :key="index"
      class="contact-row"
    >
      <registration-field
        :ref="(el) => (controls[`${index}.name`] = el)"
        v-model="contact.name"
        :field="{
          key: 'name',
          label: 'Nome completo do contato',
          ariaLabel: index
            ? `Nome completo do contato ${index + 1}`
            : 'Nome completo do contato',
          placeholder: 'Nome e sobrenome',
        }"
        :disabled="busy || form.noContact"
        :error="errors[`${index}.name`]"
      />
      <registration-field
        :ref="(el) => (controls[`${index}.phoneNumber`] = el)"
        v-model="contact.phoneNumber"
        :field="{
          key: 'phoneNumber',
          label: 'Telefone do contato',
          ariaLabel: index
            ? `Telefone do contato ${index + 1}`
            : 'Telefone do contato',
          placeholder: '(DDD) 00000-0000',
          kind: 'phone',
        }"
        :disabled="busy || form.noContact"
        :error="errors[`${index}.phoneNumber`]"
      />
    </div>
    <q-btn
      flat
      no-caps
      class="add"
      :disable="busy || form.noContact"
      @click="add"
      ><img src="/system/icons/auth/plus.svg" alt="" /><span
        >Adicionar outro contato</span
      ></q-btn
    >
    <label class="absence"
      ><input
        v-model="form.noContact"
        type="checkbox"
        aria-label="Não possuo contato de confiança"
        :disabled="busy"
        @change="
          errors = {};
          notice = '';
        "
      /><span>Não possuo contato de confiança</span></label
    >
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <footer>
      <q-btn
        flat
        no-caps
        class="back"
        label="Voltar"
        :disable="busy"
        @click="emit('back')"
      /><q-btn
        type="submit"
        no-caps
        unelevated
        class="continue"
        :disable="busy"
        :loading="busy"
        ><span class="icon"
          ><img src="/system/icons/auth/enter.svg" alt="" /></span
        ><span>Continuar</span></q-btn
      >
    </footer>
  </q-form>
</template>
<script setup>
import { nextTick, reactive, ref, watch } from "vue";
import RegistrationField from "./RegistrationDocumentField.vue";
import {
  appendRegistrationTrustedContact,
  newRegistrationTrustedContacts,
  validateRegistrationTrustedContacts,
} from "src/services/registrationTrustedContacts";
const props = defineProps({
  modelValue: { type: Object, default: () => newRegistrationTrustedContacts() },
  busy: Boolean,
});
const emit = defineEmits(["update:modelValue", "back"]);
const form = reactive(newRegistrationTrustedContacts(props.modelValue));
const controls = ref({}),
  errors = ref({}),
  notice = ref("");
watch(
  form,
  () => emit("update:modelValue", newRegistrationTrustedContacts(form)),
  { deep: true, flush: "sync" },
);
const focusError = async () => {
  await nextTick();
  controls.value[Object.keys(errors.value)[0]]?.focus();
};
const add = async () => {
  if (props.busy || form.noContact) return;
  errors.value = validateRegistrationTrustedContacts(form);
  notice.value = "";
  if (Object.keys(errors.value).length) {
    await focusError();
    return;
  }
  if (!appendRegistrationTrustedContact(form)) {
    const index = form.contacts.findIndex(
      (contact) => !contact.name.trim() && !contact.phoneNumber.trim(),
    );
    await nextTick();
    controls.value[`${index}.name`]?.focus();
    return;
  }
  await nextTick();
  controls.value[`${form.contacts.length - 1}.name`]?.focus();
};
const submit = async () => {
  if (props.busy) return;
  errors.value = validateRegistrationTrustedContacts(form);
  if (Object.keys(errors.value).length) {
    notice.value = "Confira os campos indicados antes de continuar.";
    await focusError();
    return;
  }
  notice.value = form.noContact
    ? "Opção mantida nesta etapa. Registro da ausência e avanço aguardam integração."
    : "Contatos mantidos nesta etapa. Gravação e avanço aguardam integração.";
};
</script>
<style scoped>
.registration-trusted {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}
.intro {
  margin: 0;
  color: #ffffffb8;
  font:
    400 16px / normal Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.contact-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}
.contact-row > * {
  min-width: 0;
}
.add {
  align-self: flex-start;
  min-height: 32px;
  padding: 0;
  border-radius: 6px;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.add :deep(.q-btn__content) {
  gap: 8px;
  flex-wrap: nowrap;
}
.add img {
  width: 16px;
  height: 16px;
}
.absence {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #ffffffcc;
  font:
    400 14px/17px Inter,
    sans-serif;
  cursor: pointer;
}
.absence input {
  appearance: none;
  margin: 0;
  width: 18px;
  height: 18px;
  flex: none;
  border: 1.5px solid #ffffff66;
  border-radius: 4px;
  background: transparent;
}
.absence input:checked {
  appearance: auto;
  accent-color: #00a3ff;
}
.notice {
  margin: 0;
  color: #ffb4bd;
  font-size: 14px;
  overflow-wrap: anywhere;
}
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.back {
  min-height: 40px;
  padding: 0;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.continue {
  min-height: 50px;
  padding: 8px 12px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(187.8342deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.continue :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
}
.icon {
  display: flex;
  padding: 4px;
  border-radius: 4px;
  background: linear-gradient(
    202.9887deg,
    #0000003d,
    #00000014 51.124%,
    #0000000a
  );
}
.icon img {
  width: 24px;
  height: 24px;
}
.q-btn:focus-visible,
.absence input:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .contact-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  .intro {
    line-height: 1.5;
  }
}
</style>
