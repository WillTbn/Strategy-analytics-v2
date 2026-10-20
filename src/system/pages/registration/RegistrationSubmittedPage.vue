<template>
  <div>
    <aside class="preview-note" role="status">
      Referência visual de homologação do estado enviado — esta tela não
      comprova nem executa envio de cadastro.
    </aside>
    <registration-shell
      :step="7"
      title="Cadastro enviado para análise"
      :show-header="false"
      :card-width="560"
      style="
        --registration-background-angle: 209.1858deg;
        --registration-card-angle: 214.6656deg;
      "
      ><div class="submitted">
        <img
          class="status-icon"
          src="/system/icons/auth/submitted.svg"
          alt=""
        />
        <h1>Cadastro enviado para análise</h1>
        <p>
          Recebemos seus dados e seu documento. Vamos avisar por e-mail quando o
          documento for validado.
        </p>
        <p>
          Até lá, você já pode acessar a Área do Cliente. Os dados do perfil
          aparecem como pendentes e não podem ser alterados.
        </p>
        <q-btn no-caps unelevated class="access" to="/system/dashboard"
          ><span class="icon"
            ><img src="/system/icons/auth/enter.svg" alt="" /></span
          ><span>Ir para a Área do Cliente</span></q-btn
        >
      </div></registration-shell
    >
  </div>
</template>
<script setup>
import RegistrationShell from "src/system/components/registration/RegistrationShell.vue";
</script>
<style scoped>
.preview-note {
  position: relative;
  z-index: 1;
  padding: 12px 16px;
  background: #1d1d1d;
  color: white;
  font-size: 14px;
}
.submitted {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  min-width: 0;
}
.status-icon {
  width: 56px;
  height: 56px;
}
h1 {
  margin: 0;
  color: white;
  font:
    500 24px/1.35 Inter,
    sans-serif;
}
p {
  margin: 0;
  color: #ffffffb8;
  font:
    400 16px / normal Inter,
    sans-serif;
  overflow-wrap: anywhere;
}
.access {
  width: 100%;
  min-height: 50px;
  padding: 8px 12px;
  border: 1px solid #98989829;
  border-radius: 8px;
  background: linear-gradient(182.4394deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  font:
    500 17px/1.35 Inter,
    sans-serif;
}
.access :deep(.q-btn__content) {
  gap: 12px;
  flex-wrap: nowrap;
  justify-content: flex-start;
}
.icon {
  display: flex;
  padding: 4px;
  flex: none;
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
.access:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 3px;
}
@media (max-width: 600px) {
  p {
    line-height: 1.5;
  }
  .access {
    font-size: 15px;
  }
}
</style>
