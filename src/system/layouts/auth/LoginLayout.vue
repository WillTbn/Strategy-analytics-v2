<template>
  <q-form class="portal-login-card" @submit="submit">
    <h1>Acesse sua conta</h1>
    <p class="portal-login-card__intro">
      Entre com o e-mail e a senha do seu cadastro.
    </p>
    <q-banner
      v-if="sessionExpired"
      rounded
      class="portal-login-card__notice"
      role="status"
    >
      Sua sessão expirou. Entre novamente para continuar.
    </q-banner>
    <label-field label-input="E-mail">
      <q-input
        v-model.trim="credentials.person"
        v-bind="inputWhite"
        :item-aligned="false"
        class="portal-login-card__input"
        dense
        hide-bottom-space
        lazy-rules
        no-error-icon
        type="email"
        name="email"
        autocomplete="username"
        aria-label="E-mail"
        placeholder="seu@email.com"
        :rules="emailRule"
        :disable="loading"
      />
    </label-field>
    <label-field label-input="Senha">
      <q-input
        v-model="credentials.password"
        v-bind="inputWhite"
        :item-aligned="false"
        class="portal-login-card__input"
        dense
        hide-bottom-space
        lazy-rules
        no-error-icon
        type="password"
        name="password"
        autocomplete="current-password"
        aria-label="Senha"
        placeholder="Sua senha"
        :rules="[(value) => !!value || 'Campo obrigatório']"
        :disable="loading"
      />
    </label-field>
    <div class="portal-login-card__forgot">
      <q-btn
        flat
        no-caps
        label="Esqueci minha senha"
        :disable="loading"
        @click="emit('status-login', 'ForgotPassword')"
      />
    </div>
    <q-btn
      type="submit"
      no-caps
      unelevated
      class="portal-login-card__submit"
      :disable="loading"
      :loading="loading"
    >
      <span class="portal-login-card__enter-icon"
        ><img src="/system/icons/auth/enter.svg" alt=""
      /></span>
      <span>Entrar</span>
    </q-btn>
    <div class="portal-login-card__divider" />
    <div class="portal-login-card__register">
      <span>Ainda não tem conta?</span>
      <q-btn
        flat
        no-caps
        label="Criar conta"
        :to="{ name: 'register' }"
        :disable="loading"
      />
    </div>
    <div class="portal-login-card__confirmation">
      <q-btn
        flat
        no-caps
        label="Ainda preciso confirmar meu e-mail"
        :to="{ name: 'confirm-email' }"
        :disable="loading"
      />
    </div>
  </q-form>
</template>
<script setup>
import { onBeforeUnmount, reactive } from "vue";
import LabelField from "src/system/components/form/LabelField.vue";
import useAuth from "src/composables/system/useAuth";
import { inputWhite } from "src/Utils/ViewInput";

defineProps({ sessionExpired: Boolean });
const emit = defineEmits(["status-login"]);
const { auth, loading } = useAuth();
const emailRule = [
  (value) => Boolean(String(value || "").trim()) || "Campo obrigatório",
  (value) => /^\S+@\S+\.\S+$/.test(value) || "Informe um e-mail válido",
];
const credentials = reactive({ person: "", password: "" });
const submit = async () => {
  if (loading.value) return;
  try {
    await auth(credentials);
  } finally {
    credentials.password = "";
  }
};
onBeforeUnmount(() => {
  credentials.password = "";
});
</script>
<style scoped>
.portal-login-card {
  width: min(560px, 100%);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  color: white;
  border: 1px solid rgba(239, 239, 239, 0.16);
  border-radius: 16px;
  background: linear-gradient(
    226.9637deg,
    rgba(121, 24, 35, 0.4) 0.17422%,
    rgba(51, 10, 15, 0.4) 9.0927%,
    rgba(9, 12, 21, 0.4) 39.128%,
    rgba(9, 41, 62, 0.4) 73.446%,
    rgba(17, 77, 118, 0.4) 99.826%
  );
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.24);
  font-family: Inter, sans-serif;
}
h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 500;
}
.portal-login-card__intro {
  margin: 0;
  font-size: 16px;
  line-height: 19px;
  color: rgba(255, 255, 255, 0.72);
}
.portal-login-card :deep(.LabelField .text-label) {
  display: block;
  margin: 0 0 8px;
  color: white;
  font:
    500 14px/19px Inter,
    sans-serif;
}
.portal-login-card__input :deep(.q-field__control) {
  background: white;
  height: 40px;
  min-height: 40px;
  border-radius: 4px;
  color: #1d1d1d;
}
.portal-login-card__input :deep(.q-field__native) {
  color: #1d1d1d !important;
  -webkit-text-fill-color: #1d1d1d;
  font:
    400 14px/22px Roboto,
    sans-serif;
  min-height: 40px;
  padding: 7px 0;
}
.portal-login-card__input :deep(.q-field__control::before) {
  border-color: #dcdcdc;
}
.portal-login-card__input :deep(.q-field__native::placeholder) {
  color: #989898;
  -webkit-text-fill-color: #989898;
  opacity: 1;
}
.portal-login-card__input :deep(.q-field__bottom) {
  color: #ffb4bd;
}
.portal-login-card__forgot {
  display: flex;
  justify-content: flex-end;
}
.portal-login-card__register,
.portal-login-card__confirmation {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.portal-login-card__register > span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}
.portal-login-card__forgot .q-btn,
.portal-login-card__register .q-btn,
.portal-login-card__confirmation .q-btn {
  min-height: 32px;
  padding: 0;
  border-radius: 6px;
  font:
    500 14px/1.35 Inter,
    sans-serif;
}
.portal-login-card__submit {
  min-height: 48px;
  padding: 7px 12px;
  border: 1px solid rgba(152, 152, 152, 0.16);
  border-radius: 8px;
  background: linear-gradient(
    182.4394deg,
    rgba(255, 255, 255, 0.16) 0.52072%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.01) 99.479%
  );
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(20px);
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.portal-login-card__submit :deep(.q-btn__content) {
  justify-content: flex-start;
  gap: 12px;
}
.portal-login-card__enter-icon {
  display: flex;
  padding: 4px;
  border-radius: 4px;
  background: linear-gradient(
    202.9887deg,
    rgba(0, 0, 0, 0.24),
    rgba(0, 0, 0, 0.04)
  );
}
.portal-login-card__enter-icon img {
  width: 24px;
  height: 24px;
}
.portal-login-card__divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}
.portal-login-card__notice {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}
.q-btn:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  .portal-login-card {
    padding: 24px;
  }
  .portal-login-card__intro {
    line-height: 1.5;
  }
  .portal-login-card__input :deep(.q-field__native) {
    font-size: 16px;
  }
}
</style>
