<template>
  <div class="register-assets-layout">
    <p v-if="saveError && !dialog" class="text-negative" role="alert">
      {{ saveError }}
    </p>
    <resource-state :state="currencies.state" @retry="loadCurrencies" />
    <resource-state :state="assets.state" @retry="load">
      <q-card
        v-for="section in sections"
        :key="section.type"
        class="tool q-mb-lg"
      >
        <div class="row items-center q-gutter-sm text-weight-bold">
          <q-icon :name="section.icon" color="primary" size="24px" /><span>{{
            section.name
          }}</span>
        </div>
        <p v-if="!rowsFor(section).length" class="text-grey q-mt-lg">
          Nenhum registro cadastrado.
        </p>
        <q-expansion-item
          v-for="item in rowsFor(section)"
          :key="item.id"
          class="asset-entry q-mt-md"
          @show="loadDocuments(item.id)"
        >
          <template #header>
            <q-item-section class="asset-identity"
              ><q-item-label>{{ item.nickname }}</q-item-label
              ><q-item-label caption
                >{{ amount(item) }} · {{ status(item) }}</q-item-label
              ></q-item-section
            >
            <q-item-section side
              ><q-btn
                flat
                round
                dense
                icon="edit"
                :aria-label="`Editar ${item.nickname}`"
                :disable="saving || dialog"
                @click.stop="open(section, item)"
            /></q-item-section>
          </template>
          <div class="q-pa-md">
            <div class="text-weight-medium q-mb-sm">Documentos vinculados</div>
            <resource-state
              :state="documentsFor(item.id).state"
              @retry="loadDocuments(item.id)"
            >
              <p
                v-if="!documentsFor(item.id).state.data?.length"
                class="text-grey"
              >
                Nenhum documento vinculado.
              </p>
              <div
                v-for="doc in documentsFor(item.id).state.data || []"
                :key="doc.documentId"
                class="row no-wrap items-center q-gutter-sm q-mb-sm"
              >
                <span class="col asset-document-name">{{
                  doc.documentTypeName || doc.fileName
                }}</span>
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  :aria-label="`Visualizar ${doc.documentTypeName || doc.fileName}`"
                  :loading="viewing === doc.documentId"
                  @click="viewDocument(item.id, doc.documentId)"
                />
              </div>
            </resource-state>
          </div>
        </q-expansion-item>
        <div
          v-if="dialog && selectedSection?.type === section.type"
          class="asset-editor q-mt-lg"
        >
          <q-card-section class="row items-center"
            ><div class="text-subtitle1 text-weight-bold">
              {{ selected ? "Editar" : "Adicionar" }}
              {{ selectedSection?.singular }}
            </div>
            <q-space />
            <div class="row q-gutter-sm">
              <q-btn
                flat
                no-caps
                label="Descartar"
                :disable="saving"
                @click="dialog = false"
              /><q-btn
                flat
                no-caps
                color="primary"
                label="Salvar"
                type="submit"
                form="asset-editor-form"
                :loading="saving"
                :disable="
                  !draft ||
                  !currencyAvailable ||
                  currencies.state.loading ||
                  !!currencies.state.error
                "
              /></div
          ></q-card-section>
          <q-card-section
            ><resource-state :state="detail.state" @retry="loadDetail">
              <q-form
                v-if="draft"
                id="asset-editor-form"
                @submit.prevent="save"
              >
                <p v-if="saveError" class="text-negative" role="alert">
                  {{ saveError }}
                </p>
                <resource-state
                  :state="currencies.state"
                  @retry="loadCurrencies"
                  ><label-form text-label="Moeda"
                    ><q-select
                      v-model="currencyId"
                      :options="currencyOptions"
                      emit-value
                      map-options
                      dark
                      outlined
                      dense
                      :disable="saving || !!selected"
                      :rules="[required]"
                      aria-label="Moeda"
                  /></label-form>
                  <p v-if="!currencyOptions.length" class="text-grey">
                    Nenhuma moeda disponível para cadastrar patrimônio nesta
                    conta.
                  </p>
                  <p
                    v-else-if="currencyId && !currencyAvailable"
                    class="text-negative"
                    role="alert"
                  >
                    A moeda deste patrimônio não está ativa. Não é possível
                    salvar alterações.
                  </p></resource-state
                >
                <div
                  v-for="section in formSections"
                  :key="section.title"
                  class="q-mt-lg"
                >
                  <div class="text-weight-medium q-mb-md">
                    {{ section.title }}
                  </div>
                  <div class="row q-col-gutter-md">
                    <label-form
                      v-for="field in section.fields"
                      :key="field.key"
                      :text-label="field.label"
                      class-name="col-12 col-sm-6 col-lg-4"
                      ><q-input
                        v-model="draft[field.key]"
                        :type="field.type"
                        dark
                        outlined
                        dense
                        :aria-label="field.label"
                        :disable="saving"
                        :min="field.type === 'number' ? 0 : undefined"
                        :step="
                          field.type === 'number'
                            ? isAssetIntegerField(field.key)
                              ? 1
                              : 'any'
                            : undefined
                        "
                        :rules="fieldRules(field)"
                    /></label-form>
                  </div>
                </div>
                <div
                  class="q-mt-lg"
                  v-if="selectedSection.type === 'Investment'"
                >
                  <q-toggle
                    v-model="draft.hasFixedTerm"
                    label="Prazo determinado"
                    :disable="saving"
                  />
                  <div v-if="draft.hasFixedTerm" class="row q-col-gutter-md">
                    <label-form
                      text-label="Data de vencimento"
                      class-name="col-12 col-sm-6 col-lg-4"
                      ><q-input
                        v-model="draft.maturityDate"
                        type="date"
                        dark
                        outlined
                        dense
                        :disable="saving"
                        :rules="[required, assetDateRule]"
                        aria-label="Data de vencimento" /></label-form
                    ><label-form
                      text-label="Prazo em meses (opcional)"
                      class-name="col-12 col-sm-6 col-lg-4"
                      ><q-input
                        v-model="draft.termMonths"
                        type="number"
                        min="1"
                        step="1"
                        dark
                        outlined
                        dense
                        :disable="saving"
                        :rules="[assetTermMonthsRule]"
                        aria-label="Prazo em meses"
                    /></label-form>
                  </div>
                </div>
                <template v-else
                  ><q-toggle
                    v-if="selectedSection.type !== 'Consortium'"
                    v-model="draft.paidOff"
                    label="Está quitado?"
                    class="q-mt-md"
                    :disable="saving" /><label-form
                    v-if="
                      selectedSection.type === 'Consortium' || !draft.paidOff
                    "
                    text-label="Restante para quitação"
                    class="q-mt-md"
                    ><q-input
                      v-model="draft.remainingBalance"
                      type="number"
                      min="0"
                      step="0.01"
                      dark
                      outlined
                      dense
                      :disable="saving"
                      :rules="[required]"
                      aria-label="Restante para quitação" /></label-form
                ></template>
                <asset-document-gallery
                  v-if="selected"
                  :key="selected.id"
                  :asset-id="selected.id"
                  class="q-mt-lg"
                />
              </q-form> </resource-state
          ></q-card-section>
        </div>
        <q-btn
          flat
          no-caps
          icon="add"
          label="Adicionar"
          class="q-mt-md"
          :disable="saving || dialog"
          @click="open(section)"
        />
      </q-card>
    </resource-state>
  </div>
</template>
<script setup>
import { computed, onScopeDispose, ref } from "vue";
import AssetDocumentGallery from "src/system/components/profile/AssetDocumentGallery.vue";
import LabelForm from "src/system/components/form/LabelForm.vue";
import ResourceState from "src/system/components/finance/ResourceState.vue";
import { useFinanceResource } from "src/composables/useFinanceResource";
import { money } from "src/services/financeService";
import {
  assetFormSections,
  assetDraft,
  assetPayload,
  isAssetIntegerField,
  assetIntegerRule,
  assetDateRule,
  assetTermMonthsRule,
} from "src/services/clientAssetModel";
import {
  listClientAssets,
  getClientAsset,
  createClientAsset,
  updateClientAsset,
  getClientAssetDocuments,
  getClientAssetDocumentUrl,
  getClientAssetCurrencies,
} from "src/services/clientAssetsService";
import {
  captureClientSession,
  assertClientSessionCurrent,
} from "src/services/clientApi";
import { getApiErrorMessage } from "src/services/clientAuthService";
const sections = [
  { type: "RealEstate", name: "Imóveis", singular: "imóvel", icon: "home" },
  {
    type: "Vehicle",
    name: "Veículos",
    singular: "veículo",
    icon: "directions_car",
  },
  {
    type: "Investment",
    name: "Investimentos",
    singular: "investimento",
    icon: "description",
  },
  {
    type: "Consortium",
    name: "Consórcio",
    singular: "consórcio",
    icon: "savings",
  },
];
const assets = useFinanceResource(),
  detail = useFinanceResource(),
  currencies = useFinanceResource(),
  documents = new Map();
const dialog = ref(false),
  draft = ref(null),
  selected = ref(null),
  selectedSection = ref(null),
  currencyId = ref(null),
  saving = ref(false),
  saveError = ref(""),
  viewing = ref(null);
let active = true,
  revision = 0;
const required = (v) =>
  (v != null && String(v).trim() !== "") || "Campo obrigatório";
const fieldRules = (f) => [
  ...(f.required ? [required] : []),
  ...(isAssetIntegerField(f.key) ? [assetIntegerRule] : []),
  ...(f.type === "date" ? [assetDateRule] : []),
];
const rowsFor = (section) =>
  (assets.state.data || []).filter((item) => item.assetType === section.type);
const currencyOptions = computed(() => {
  const options = [...(currencies.state.data || [])];
  if (
    selected.value?.currencyId &&
    !options.some((option) => option.value === selected.value.currencyId)
  )
    options.push({
      value: selected.value.currencyId,
      label: "Moeda do patrimônio atual (indisponível)",
      disable: true,
    });
  return options;
});
const currencyAvailable = computed(
  () =>
    !currencies.state.loading &&
    !currencies.state.error &&
    (currencies.state.data || []).some(
      (option) => option.value === currencyId.value,
    ),
);
const amount = (item) => {
  const code = (currencies.state.data || []).find(
    (option) => option.value === item.currencyId,
  )?.code;
  return code
    ? money(item.declaredValue, code)
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(item.declaredValue))} (moeda não informada)`;
};
const status = (item) =>
  ({ PaidOff: "Quitado", Financed: "Financiado", UnderReview: "Em análise" })[
    item.status
  ] || "Não informado";
const formSections = computed(() =>
  assetFormSections(selectedSection.value?.type),
);
const load = () => assets.load(listClientAssets);
const loadCurrencies = () => currencies.load(getClientAssetCurrencies);
function documentsFor(id) {
  if (!documents.has(id)) documents.set(id, useFinanceResource());
  return documents.get(id);
}
const loadDocuments = (id) =>
  documentsFor(id).load(() => getClientAssetDocuments(id));
async function open(section, item = null) {
  revision++;
  selectedSection.value = section;
  selected.value = item;
  draft.value = null;
  saveError.value = "";
  dialog.value = true;
  currencyId.value =
    item?.currencyId ||
    (currencies.state.data || []).find((option) => option.code === "BRL")
      ?.value ||
    currencies.state.data?.[0]?.value ||
    null;
  await loadDetail();
}
async function loadDetail() {
  const version = revision;
  const result = await detail.load(() =>
    selected.value ? getClientAsset(selected.value.id) : Promise.resolve({}),
  );
  if (active && version === revision && result)
    draft.value = assetDraft(result, selectedSection.value.type);
}
async function save() {
  if (saving.value) return;
  const session = captureClientSession();
  saving.value = true;
  saveError.value = "";
  try {
    if (!currencyAvailable.value)
      throw new Error("Selecione uma moeda ativa para salvar o patrimônio.");
    const payload = assetPayload(
      draft.value,
      selectedSection.value.type,
      currencyId.value,
      selected.value ? detail.state.data : null,
    );
    await (selected.value
      ? updateClientAsset(selected.value.id, payload)
      : createClientAsset(payload));
    assertClientSessionCurrent(session);
    if (!active) return;
    dialog.value = false;
    await load();
  } catch (error) {
    if (active)
      saveError.value = getApiErrorMessage(
        error,
        "Não foi possível salvar o patrimônio.",
      );
  } finally {
    if (active) saving.value = false;
  }
}
async function viewDocument(id, documentId) {
  if (viewing.value) return;
  const session = captureClientSession();
  viewing.value = documentId;
  try {
    const result = await getClientAssetDocumentUrl(id, documentId);
    assertClientSessionCurrent(session);
    if (!active) return;
    if (!/^https?:\/\//i.test(result?.url || ""))
      throw Error("URL indisponível");
    window.open(result.url, "_blank", "noopener,noreferrer");
  } catch (error) {
    if (active)
      saveError.value = getApiErrorMessage(
        error,
        "Não foi possível abrir o documento.",
      );
  } finally {
    if (active) viewing.value = null;
  }
}
onScopeDispose(() => {
  active = false;
  revision++;
  [assets, detail, currencies, ...documents.values()].forEach((resource) =>
    resource.reset(),
  );
});
load();
loadCurrencies();
</script>
<style scoped>
.asset-editor {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 0 16px;
}
.asset-entry {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
}
.asset-identity,
.asset-document-name {
  min-width: 0;
  overflow-wrap: anywhere;
}
.asset-entry :deep(.q-item__label--caption) {
  color: rgba(255, 255, 255, 0.7);
}
.asset-editor :deep(.LabelForm) {
  min-width: 0;
}
</style>
