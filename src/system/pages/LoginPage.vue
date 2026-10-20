<template>
  <q-layout
    :class="
      stateLogin === 'login'
        ? 'portal-login'
        : 'bg-simulator auth-legacy-screen'
    "
  >
    <q-page-container v-if="stateLogin === 'login'">
      <main class="portal-login__content">
        <div class="portal-login__logo">
          <img src="/system/icons/auth/logo.svg" alt="Strategy Analytics" />
        </div>
        <login-layout
          :session-expired="route.query.session === 'expired'"
          @status-login="stateLogin = $event"
        />
      </main>
    </q-page-container>
    <q-page-container
      v-else
      class="column justify-center"
      style="min-height: 96vh"
    >
      <div class="column justify-center" v-if="!emailSend">
        <div class="row text-white justify-center">
          <div
            class="col-md-3 col-sm-8 self-center"
            :class="{
              'col-md-4':
                stateLogin === 'resetPassword' ||
                stateLogin === 'validateToken',
            }"
          >
            <div class="column">
              <header-auth
                :text="textStep"
                class="col"
                :styleNew="{
                  'margin-bottom:-4rem': stateLogin != 'resetPassword',
                }"
              />
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="route.query.session === 'expired'"
        class="row justify-center q-mb-md"
      >
        <q-banner rounded class="col-md-3 col-sm-8 bg-blue-grey-9 text-white">
          Sua sessão expirou. Entre novamente para continuar.
        </q-banner>
      </div>
      <validatetoken-layout
        v-if="stateLogin == 'validateToken'"
        @status-login="stateLogin = $event"
      />
      <forgotpassword-layout
        v-else-if="stateLogin == 'ForgotPassword'"
        @status-login="stateLogin = $event"
      />
      <resetpassword-layout
        v-else-if="stateLogin == 'resetPassword'"
        @status-login="stateLogin = $event"
      />
    </q-page-container>
    <q-inner-loading
      :showing="loading"
      label="Please wait..."
      label-class="text-teal"
      label-style="font-size: 1.1em"
    />
    <footer-system v-if="stateLogin !== 'login'" class="text-blue-grey-9" />
  </q-layout>
</template>
<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import LoginLayout from "../layouts/auth/LoginLayout.vue";
import ValidatetokenLayout from "../layouts/auth/ValidatetokenLayout.vue";
import ForgotpasswordLayout from "../layouts/auth/ForgotpasswordLayout.vue";
import ResetpasswordLayout from "../layouts/auth/ResetpasswordLayout.vue";
import useAuth from "../../composables/system/useAuth";
import FooterSystem from "../components/FooterSystem.vue";
import HeaderAuth from "src/system/components/auth/HeaderAuth.vue";
const route = useRoute();
const stateLogin = ref("login");
const { loading } = useAuth();
const textPatterns = {
  login: "Acesse sua conta",
  validateToken: "Confirme seu dados e crie sua senha",
  ForgotPassword: "Recuperar senha",
  resetPassword: "Confirme seu cpf e crie sua nova senha",
};
const textStep = computed(() => {
  return textPatterns[stateLogin.value];
});
const emailSend = ref(false);
onMounted(() => {
  if (route.query.token) {
    stateLogin.value = "validateToken";
  }
  if (route.query.tokenRemenber) {
    stateLogin.value = "resetPassword";
  }
});
</script>
<style lang="sass">
.auth-legacy-screen .q-field--outlined .q-field__control:before
  border-bottom: solid 1px #fff !important

.auth-legacy-screen .q-field--outlined .q-field__control
  border-radius: 8px
</style>
<style scoped>
.portal-login {
  background: linear-gradient(
    209.1858deg,
    #791823 0.17422%,
    #330a0f 9.0927%,
    #090c15 39.128%,
    #09293e 73.446%,
    #114d76 99.826%
  );
}
.portal-login__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  min-height: 100vh;
  padding: 48px 16px;
}
.portal-login__logo {
  display: flex;
  align-items: center;
  width: 152px;
  height: 48px;
  flex: none;
}
.portal-login__logo img {
  width: 152px;
  height: 32.7729px;
  mask-image: url("/system/icons/auth/logo-mask.svg");
  mask-repeat: no-repeat;
  mask-size: 152px 32.7728px;
}
</style>
