<template>
  <div class="bank-accounts-layout">
    <q-card class="tool">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-bold">Contas bancárias</div>
          <div class="text-caption text-grey-5">
            Seus dados bancários são sempre exibidos de forma mascarada.
          </div>
        </div>
        <q-btn
          flat
          dense
          color="primary"
          icon="add"
          label="Adicionar"
          no-caps
          :disable="loading || saving || Boolean(error)"
          @click="openCreate"
        />
      </q-card-section>
      <q-separator dark />
      <q-card-section>
        <q-banner v-if="error" rounded class="bg-red-9 text-white q-mb-md"
          >{{ error
          }}<template #action
            ><q-btn
              flat
              color="white"
              label="Tentar novamente"
              @click="load" /></template
        ></q-banner>
        <div v-if="loading" class="row justify-center q-pa-xl">
          <q-spinner color="primary" size="36px" />
        </div>
        <div
          v-else-if="!error && !accounts.length"
          class="empty-state q-pa-xl text-center text-grey-5"
        >
          <q-icon name="account_balance" size="36px" />
          <div class="q-mt-sm">Nenhuma conta bancária cadastrada.</div>
        </div>
        <q-list v-else-if="!error" separator>
          <q-item v-for="account in accounts" :key="account.id">
            <q-item-section avatar
              ><q-avatar
                color="primary"
                text-color="white"
                icon="account_balance"
            /></q-item-section>
            <q-item-section
              ><q-item-label>{{ bankName(account.bankId) }}</q-item-label
              ><q-item-label caption
                >Ag. {{ account.branch || "—" }} · Conta
                {{ account.accountNumberMasked || "mascarada" }}</q-item-label
              ><q-item-label caption v-if="account.pixKeyMasked"
                >Pix {{ account.pixKeyMasked }}</q-item-label
              ></q-item-section
            >
            <q-item-section side
              ><div class="row items-center q-gutter-xs">
                <q-badge
                  v-if="account.isPrimary"
                  outline
                  color="primary"
                  label="Principal"
                /><q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  aria-label="Editar conta"
                  :disable="loading || saving"
                  @click="openEdit(account)"
                /><q-btn
                  v-if="!account.isPrimary"
                  flat
                  round
                  dense
                  icon="star_outline"
                  color="primary"
                  aria-label="Definir como principal"
                  :disable="loading || saving"
                  @click="makePrimary(account)"
                /><q-btn
                  flat
                  round
                  dense
                  icon="archive"
                  color="negative"
                  aria-label="Arquivar conta"
                  :disable="loading || saving"
                  @click="askArchive(account)"
                /></div
            ></q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <q-dialog v-model="formDialog" persistent
      ><q-card class="tool form-card"
        ><q-card-section class="row items-center justify-between"
          ><div class="text-subtitle1 text-weight-bold">
            {{ editingId ? "Editar conta" : "Nova conta" }}
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            aria-label="Fechar"
            :disable="saving"
            @click="closeForm" /></q-card-section
        ><q-separator dark /><q-form ref="formRef" @submit.prevent="save"
          ><q-card-section
            ><div class="row q-col-gutter-md">
              <label-form class-name="col-12" text-label="Banco"
                ><q-select
                  :disable="saving"
                  v-model="form.bankId"
                  :options="bankOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
              /></label-form>
              <label-form class-name="col-12 col-md-4" text-label="Agência"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.branch"
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
              /></label-form>
              <label-form class-name="col-8 col-md-6" text-label="Conta"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.accountNumber"
                  outlined
                  dense
                  dark
                  :placeholder="editingId ? `Atual: ${masks.account}` : ''"
                  :hint="
                    editingId
                      ? 'Redigite o número integral para confirmar a alteração.'
                      : ''
                  "
                  :rules="requiredRules"
              /></label-form>
              <label-form class-name="col-4 col-md-2" text-label="Dígito"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.accountDigit"
                  outlined
                  dense
                  dark
              /></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Tipo de conta"
                ><q-select
                  :disable="saving"
                  v-model="form.accountType"
                  :options="accountTypes"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
              /></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Tipo de titular"
                ><q-select
                  :disable="saving"
                  v-model="form.holderType"
                  :options="holderTypes"
                  emit-value
                  map-options
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
              /></label-form>
              <label-form class-name="col-12" text-label="Nome do titular"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.holderName"
                  outlined
                  dense
                  dark
                  :rules="requiredRules"
              /></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Documento do titular"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.holderDocument"
                  outlined
                  dense
                  dark
                  :placeholder="editingId ? `Atual: ${masks.document}` : ''"
                  :rules="requiredRules"
              /></label-form>
              <label-form
                class-name="col-12 col-md-6"
                text-label="Tipo de chave Pix"
                ><q-select
                  :disable="saving"
                  v-model="form.pixKeyType"
                  :options="pixTypes"
                  emit-value
                  map-options
                  clearable
                  outlined
                  dense
                  dark
              /></label-form>
              <label-form class-name="col-12" text-label="Chave Pix"
                ><q-input
                  :disable="saving"
                  v-model.trim="form.pixKey"
                  outlined
                  dense
                  dark
                  :placeholder="editingId ? `Atual: ${masks.pix}` : ''"
              /></label-form>
              <div class="col-12">
                <q-checkbox
                  :disable="saving"
                  v-model="form.isPrimary"
                  label="Definir como principal"
                  color="primary"
                />
              </div></div></q-card-section
          ><q-card-actions align="right"
            ><q-btn
              flat
              label="Cancelar"
              no-caps
              :disable="saving"
              @click="closeForm" /><q-btn
              type="submit"
              flat
              color="primary"
              icon="save"
              label="Salvar"
              no-caps
              :loading="saving" /></q-card-actions></q-form></q-card
    ></q-dialog>
    <q-dialog v-model="archiveDialog" persistent
      ><q-card class="tool confirm-card"
        ><q-card-section
          ><div class="text-subtitle1 text-weight-bold">Arquivar conta</div>
          <div class="q-mt-sm">
            A conta deixará de ficar disponível para uso. Deseja continuar?
          </div></q-card-section
        ><q-card-actions align="right"
          ><q-btn
            flat
            label="Cancelar"
            no-caps
            :disable="saving"
            @click="archiveDialog = false" /><q-btn
            flat
            color="negative"
            label="Arquivar"
            no-caps
            :loading="saving"
            @click="confirmArchive" /></q-card-actions></q-card
    ></q-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onScopeDispose } from "vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import {
  captureClientSession,
  isClientSessionCurrent,
} from "src/services/clientApi";
import useNotify from "src/composables/useNotify";
import { getApiErrorMessage } from "src/services/clientAuthService";
import {
  archiveClientBankAccount,
  createClientBankAccount,
  getClientBankAccount,
  listClientBankAccounts,
  listAllClientBanks,
  setPrimaryClientBankAccount,
  updateClientBankAccount,
} from "src/services/clientProfileService";

const { successNotify, errorNotify } = useNotify();
const accounts = ref([]),
  banks = ref([]),
  loading = ref(true),
  saving = ref(false),
  error = ref(""),
  formDialog = ref(false),
  archiveDialog = ref(false),
  editingId = ref(null),
  archiveTarget = ref(null),
  formRef = ref(null);
const empty = () => ({
  bankId: null,
  branch: "",
  accountNumber: "",
  accountDigit: null,
  accountType: "Checking",
  holderType: "Individual",
  holderName: "",
  holderDocument: "",
  pixKey: null,
  pixKeyType: null,
  isPrimary: false,
});
const form = reactive(empty()),
  masks = reactive({ account: "", document: "", pix: "" });
const accountTypes = [
    { label: "Conta corrente", value: "Checking" },
    { label: "Conta poupança", value: "Savings" },
    { label: "Conta de pagamento", value: "Payment" },
  ],
  holderTypes = [
    { label: "Pessoa física", value: "Individual" },
    { label: "Pessoa jurídica", value: "Organization" },
  ],
  pixTypes = [
    { label: "CPF/CNPJ", value: "Document" },
    { label: "E-mail", value: "Email" },
    { label: "Telefone", value: "Phone" },
    { label: "Aleatória", value: "Random" },
  ];
const requiredRules = [
  (v) => Boolean(String(v || "").trim()) || "Campo obrigatório",
];
const collection = (v) => (Array.isArray(v) ? v : v?.data || v?.items || []);
const bankOptions = computed(() =>
  banks.value.map((b) => ({
    label: b.code ? `${b.code} — ${b.name}` : b.name,
    value: b.id,
  })),
);
const bankName = (id) =>
  bankOptions.value.find((b) => b.value === id)?.label ||
  "Banco não identificado";

let active = true,
  loadRevision = 0;
const current = (session) => active && isClientSessionCurrent(session);
const actionBlocked = () =>
  saving.value ||
  loading.value ||
  Boolean(error.value) ||
  formDialog.value ||
  archiveDialog.value;
const load = async () => {
  const session = captureClientSession(),
    revision = ++loadRevision;
  const latest = () => current(session) && revision === loadRevision;
  loading.value = true;
  error.value = "";
  accounts.value = [];
  banks.value = [];
  try {
    const [b, a] = await Promise.all([
      listAllClientBanks(),
      listClientBankAccounts({ page: 1, pageSize: 100 }),
    ]);
    if (!latest()) return;
    banks.value = collection(b).filter((x) => x.isActive !== false);
    accounts.value = collection(a);
  } catch (e) {
    if (latest())
      error.value = getApiErrorMessage(
        e,
        "Não foi possível carregar suas contas bancárias.",
      );
  } finally {
    if (latest()) loading.value = false;
  }
};
const resetForm = () => {
  Object.assign(form, empty());
  Object.assign(masks, { account: "", document: "", pix: "" });
  editingId.value = null;
  formDialog.value = false;
  formRef.value?.resetValidation?.();
};
const closeForm = () => {
  if (saving.value) return;
  resetForm();
};
const openCreate = () => {
  if (actionBlocked()) return;
  resetForm();
  formDialog.value = true;
};
const openEdit = async (account) => {
  if (actionBlocked()) return;
  const session = captureClientSession();
  saving.value = true;
  resetForm();
  try {
    const d = await getClientBankAccount(account.id);
    if (!current(session)) return;
    editingId.value = account.id;
    Object.assign(form, {
      bankId: d.bankId,
      branch: d.branch,
      accountNumber: "",
      accountDigit: d.accountDigit,
      accountType: d.accountType,
      holderType: d.holderType,
      holderName: d.holderName,
      holderDocument: "",
      pixKey: null,
      pixKeyType: d.pixKeyType,
      isPrimary: d.isPrimary,
    });
    Object.assign(masks, {
      account: d.accountNumberMasked || "Mascarada",
      document: d.holderDocumentMasked || "Mascarado",
      pix: d.pixKeyMasked || "Não informado",
    });
    formDialog.value = true;
  } catch (e) {
    if (current(session))
      errorNotify(getApiErrorMessage(e, "Não foi possível abrir a conta."));
  } finally {
    if (current(session)) saving.value = false;
  }
};
const save = async () => {
  if (saving.value || !formDialog.value || !formRef.value) return;
  const session = captureClientSession();
  saving.value = true;
  try {
    if (!(await formRef.value.validate()) || !current(session)) return;
    const payload = {
      ...form,
      accountDigit: form.accountDigit || null,
      pixKey: form.pixKey || null,
      pixKeyType: form.pixKeyType || null,
    };
    if (editingId.value)
      await updateClientBankAccount(editingId.value, payload);
    else await createClientBankAccount(payload);
    if (!current(session)) return;
    successNotify("Conta bancária salva.");
    resetForm();
    await load();
  } catch (e) {
    if (current(session))
      errorNotify(getApiErrorMessage(e, "Não foi possível salvar a conta."));
  } finally {
    if (current(session)) saving.value = false;
  }
};
const makePrimary = async (a) => {
  if (actionBlocked()) return;
  const session = captureClientSession();
  saving.value = true;
  try {
    await setPrimaryClientBankAccount(a.id);
    if (!current(session)) return;
    successNotify("Conta principal atualizada.");
    await load();
  } catch (e) {
    if (current(session))
      errorNotify(
        getApiErrorMessage(e, "Não foi possível definir a conta principal."),
      );
  } finally {
    if (current(session)) saving.value = false;
  }
};
const askArchive = (a) => {
  if (actionBlocked()) return;
  archiveTarget.value = a;
  archiveDialog.value = true;
};
const confirmArchive = async () => {
  if (saving.value || !archiveDialog.value || !archiveTarget.value) return;
  const session = captureClientSession();
  saving.value = true;
  try {
    await archiveClientBankAccount(archiveTarget.value.id);
    if (!current(session)) return;
    archiveDialog.value = false;
    archiveTarget.value = null;
    successNotify("Conta arquivada.");
    await load();
  } catch (e) {
    if (current(session))
      errorNotify(getApiErrorMessage(e, "Não foi possível arquivar a conta."));
  } finally {
    if (current(session)) saving.value = false;
  }
};
onScopeDispose(() => {
  active = false;
  loadRevision++;
  resetForm();
  accounts.value = [];
  banks.value = [];
  archiveTarget.value = null;
  archiveDialog.value = false;
});
load();
</script>
<style scoped>
.bank-accounts-layout {
  width: 100%;
}
.bank-accounts-layout > .tool > .q-card__section {
  padding: 0;
}
.bank-accounts-layout > .tool > .q-card__section:first-child {
  gap: 16px;
}
.bank-accounts-layout > .tool > .q-separator {
  margin: 24px 0;
}
.bank-accounts-layout .q-item {
  padding: 16px 0;
}
.bank-accounts-layout :deep(.q-item__label) {
  overflow-wrap: anywhere;
}
.form-card {
  width: min(760px, calc(100vw - 32px));
}
.confirm-card {
  width: min(440px, calc(100vw - 32px));
}
.empty-state {
  padding: 24px 0;
}
.form-card :deep(.label-form) {
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
}
@media (max-width: 599px) {
  .bank-accounts-layout > .tool {
    padding: 16px;
  }
  .bank-accounts-layout .q-item {
    flex-wrap: wrap;
  }
  .bank-accounts-layout .q-item__section--side:last-child {
    flex-basis: 100%;
    padding-left: 56px;
    margin-top: 8px;
    align-items: flex-start;
  }
}
</style>
