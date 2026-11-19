<template>
  <div class="contract-detail-view">
    <div
      class="detail-group"
      :class="{ 'detail-grouped': presentation?.variant === 'grouped' }"
    >
      <template v-if="presentation?.variant !== 'app'">
        <section class="detail-panel detail-overview">
          <h2>Visão Geral</h2>
          <div class="detail-overview-cards">
            <article
              v-for="(card, index) in cards"
              :key="card.title"
              class="detail-overview-card"
            >
              <figure :class="'detail-art-' + index">
                <div><img :src="card.image" alt="" /></div>
              </figure>
              <div>
                <h3>{{ card.title }}</h3>
                <strong
                  >{{ card.value
                  }}<small v-if="card.change">
                    ({{ card.change }})</small
                  ></strong
                >
                <p>{{ card.description }}</p>
              </div>
            </article>
          </div>
        </section>
        <contract-detail-charts
          :performance="presentation?.performance"
          :distribution="presentation?.distribution"
          :mode="presentation?.variant === 'grouped' ? 'bars' : 'donuts'"
        >
          <contract-dividend-panel
            v-if="presentation?.variant === 'grouped'"
            :data="presentation?.dividends"
            :currency="model.currency"
            :contract-id="model.id"
            :save-destination="saveDividendDestination"
          />
        </contract-detail-charts>
        <operation-layout :rows="presentation?.operations ?? null" />
        <contract-dividend-panel
          v-if="presentation?.variant !== 'grouped'"
          :data="presentation?.dividends"
          :currency="model.currency"
          :contract-id="model.id"
          :save-destination="saveDividendDestination"
        />
        <contract-contributions
          :data="presentation?.contributions"
          :currency="model.currency"
          :contract-id="model.id"
        />
      </template>
      <section class="detail-panel detail-application">
        <h2>{{ presentation?.variant === "app" ? "App" : "Dívidas" }}</h2>
        <div
          class="detail-application-surface"
          :class="{ 'detail-phone-stage': presentation?.variant !== 'app' }"
          :style="
            presentation?.variant !== 'app'
              ? {
                  backgroundImage:
                    'linear-gradient(90deg,#00a3ff29,#042c4d33),url(' +
                    assets.appBackground +
                    ')',
                }
              : null
          "
        >
          <div
            :class="{ 'detail-phone-wrapper': presentation?.variant !== 'app' }"
          >
            <iframe
              v-if="appUrl"
              :src="appUrl"
              title="Aplicativo do contrato"
              sandbox="allow-scripts allow-forms"
              referrerpolicy="no-referrer"
            />
            <p v-else class="detail-unavailable" role="status">
              Integração do aplicativo indisponível
            </p>
          </div>
          <aside
            v-if="appUrl && presentation?.application?.provider"
            class="detail-provider-note"
          >
            <img :src="assets.verified" alt="" />
            <div>
              <strong
                >Essa integração é fornecida por
                {{ presentation.application.provider }} com segurança total dos
                dados.</strong
              >
              <p>
                Você pode mexer no aplicativo livre e diretamente pelo nosso
                sistema! Em caso de dúvidas ou erros, entre em contato com nosso
                suporte.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
    <dl
      class="detail-footer"
      :class="{ 'detail-footer-compact': presentation?.variant === 'app' }"
    >
      <div v-for="item in facts" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd v-if="item.assets">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            :disable="!Array.isArray(presentation?.assets)"
            @click="assetsOpen = true"
            >{{
              Array.isArray(presentation?.assets)
                ? presentation.assets.length + " ativos"
                : "—"
            }}<img :src="assets.open" alt=""
          /></q-btn>
        </dd>
        <dd v-else :class="{ 'detail-fact-money': item.money }">
          {{ item.value }}
        </dd>
      </div>
    </dl>
    <aside class="detail-documents-banner">
      <figure>
        <div><img :src="assets.documents" alt="" /></div>
      </figure>
      <div>
        <h3>Acesse o Documento Assinado do Contrato</h3>
        <p>
          Os Contratos e Termos Assinados por você ficam na Área Perfil -
          Contratos e Termos. Clique no botão à direita para acessar.
        </p>
      </div>
      <q-btn
        color="primary"
        no-caps
        :to="{ name: 'profile', query: { tab: 'contracts' } }"
        ><img :src="assets.upload" alt="" />Acessar Área de Contratos</q-btn
      >
    </aside>
    <contract-assets-dialog
      v-model="assetsOpen"
      :rows="presentation?.assets"
      :contract-id="model.id"
      :export-document="exportAssets"
    />
  </div>
</template>
<script setup>
import { computed, ref, watch } from "vue";
import ContractDetailCharts from "./ContractDetailCharts.vue";
import ContractContributions from "./ContractContributions.vue";
import ContractDividendPanel from "./ContractDividendPanel.vue";
import ContractAssetsDialog from "./ContractAssetsDialog.vue";
import OperationLayout from "../../layouts/contracts/OperationLayout.vue";
import {
  contractDetailModel,
  detailAssets as assets,
  detailMoney as money,
  detailPercent as percent,
  detailDate as date,
  detailRemainingTerm,
  detailNumber,
  approvedAppUrl,
} from "src/services/contractDetailPresentation";
const props = defineProps({
  contract: Object,
  presentation: Object,
  saveDividendDestination: Function,
  exportAssets: Function,
});
const model = computed(() => contractDetailModel(props.contract)),
  assetsOpen = ref(false);
watch(
  () => model.value.id,
  () => {
    assetsOpen.value = false;
  },
);
const appUrl = computed(() =>
  approvedAppUrl(
    props.presentation?.application?.url,
    props.presentation?.application?.approvedOrigins,
  ),
);
const cards = computed(() => [
  {
    title: "Saldo Aplicado no Contrato",
    value: money(model.value.applied, model.value.currency),
    description: props.presentation?.overview?.appliedConversion || "—",
    image: assets.balance,
  },
  {
    title: "Próxima Distribuição de Lucros",
    value: money(
      props.presentation?.overview?.nextAmount,
      model.value.currency,
    ),
    description: "Previsão: " + date(props.presentation?.overview?.nextDate),
    image: assets.distribution,
  },
  {
    title: "Rendimento dos últimos 12 meses",
    value: money(props.presentation?.overview?.income12, model.value.currency),
    change:
      detailNumber(props.presentation?.overview?.income12Percent) === null
        ? null
        : percent(props.presentation.overview.income12Percent),
    description: props.presentation?.overview?.incomeConversion || "—",
    image: assets.income,
  },
]);
const facts = computed(() => {
  const amounts = [
    {
      label: "Valor de Aquisição",
      value: money(model.value.acquisition, model.value.currency),
      money: true,
    },
    {
      label: "Valor Atual",
      value: money(model.value.current, model.value.currency),
      money: true,
    },
    {
      label: "Distrib. de Lucro Acumulada",
      value: money(props.presentation?.accumulatedProfit, model.value.currency),
      money: true,
    },
  ];
  const dates = [
    { label: "Data de Aquisição", value: date(model.value.acquisitionDate) },
    {
      label: "Período de Duração",
      value: date(model.value.startDate) + " - " + date(model.value.endDate),
    },
    {
      label: "Validade Restante",
      value: detailRemainingTerm(model.value.endDate),
    },
  ];
  const asset = { label: "Ativos do Contrato", assets: true };
  return props.presentation?.variant === "app"
    ? [...amounts, ...dates, asset]
    : [
        ...amounts,
        asset,
        { label: "Moeda Firmada", value: model.value.currencyName },
        ...dates,
      ];
});
</script>
<style src="./contractDetail.scss" lang="scss" />
