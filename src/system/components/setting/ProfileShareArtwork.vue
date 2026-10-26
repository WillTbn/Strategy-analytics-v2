<template>
  <svg
    ref="artwork"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 1080 ${height}`"
    width="1080"
    :height="height"
    role="img"
    aria-label="Pré-visualização da imagem de compartilhamento"
    font-family="Inter, Arial, sans-serif"
    fill="white"
  >
    <defs>
      <component :is="'style'" v-if="font">
        {{
          `@font-face { font-family: ShareInter; src: url('${font}'); } text { font-family: ShareInter, Arial, sans-serif; }`
        }}
      </component>
      <linearGradient
        :id="`${id}-background`"
        x1="100%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop offset="0" stop-color="#791823" />
        <stop offset=".091" stop-color="#330a0f" />
        <stop offset=".391" stop-color="#090c15" />
        <stop offset=".735" stop-color="#09293e" />
        <stop offset="1" stop-color="#114d76" />
      </linearGradient>
      <linearGradient :id="`${id}-glass`" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop stop-color="#791823" stop-opacity=".4" />
        <stop offset=".4" stop-color="#090c15" stop-opacity=".4" />
        <stop offset="1" stop-color="#114d76" stop-opacity=".4" />
      </linearGradient>
      <clipPath :id="`${id}-avatar`">
        <circle cx="172" cy="100" r="60" />
      </clipPath>
    </defs>
    <rect width="1080" :height="height" :fill="`url(#${id}-background)`" />
    <image
      :href="logo"
      x="72"
      :y="story ? 137 : 89"
      width="334.4"
      height="72.1"
    />
    <text
      x="72"
      :y="story ? 470 : 300"
      :font-size="story ? 80 : 68"
      font-weight="700"
    >
      <tspan x="72">Minha jornada na</tspan>
      <tspan x="72" :dy="story ? 86.4 : 73.44">Strategy Analytics</tspan>
    </text>
    <g :transform="`translate(0 ${story ? 746 : 450})`">
      <rect
        x="72"
        width="936"
        height="550"
        rx="16"
        :fill="`url(#${id}-glass)`"
        stroke="#f0f0f0"
        stroke-opacity=".16"
      />
      <circle
        cx="172"
        cy="100"
        r="60"
        fill="#233440"
        stroke="#dcdcdc"
        stroke-width="2.5"
      />
      <image
        v-if="avatar && !model.privateMode"
        :href="avatar"
        x="112"
        y="40"
        width="120"
        height="120"
        preserveAspectRatio="xMidYMid slice"
        :clip-path="`url(#${id}-avatar)`"
      />
      <text
        v-else
        x="172"
        y="115"
        font-size="40"
        text-anchor="middle"
        font-weight="700"
      >
        {{ model.initials }}
      </text>
      <text
        x="260"
        y="76"
        v-if="model.customerId.length <= 18"
        font-size="22"
        fill="#fff"
        fill-opacity=".6"
      >
        ID Strategy: {{ model.customerId }}
      </text>
      <text
        v-if="model.customerId.length > 18"
        x="260"
        y="55"
        font-size="22"
        fill-opacity=".6"
      >
        ID Strategy:
        <tspan x="260" y="84" font-size="16">{{ model.customerId }}</tspan>
      </text>
      <rect
        x="600"
        y="49"
        width="98"
        height="38"
        rx="6"
        fill="white"
        fill-opacity=".08"
        stroke="#00a3ff"
        stroke-width="1.5"
      />
      <text x="649" y="75" text-anchor="middle" font-size="22">
        Nível {{ model.level ?? "—" }}
      </text>
      <text
        x="260"
        y="132"
        :font-size="model.name.length > 24 ? 30 : 40"
        font-weight="700"
        :textLength="model.name.length > 30 ? 440 : undefined"
        :lengthAdjust="model.name.length > 30 ? 'spacingAndGlyphs' : undefined"
      >
        {{ model.name }}
      </text>
      <text
        x="968"
        y="91"
        :font-size="model.tenure.length > 10 ? 29 : 54"
        fill="#00a3ff"
        font-weight="700"
        text-anchor="end"
      >
        {{ model.tenure }}
      </text>
      <text x="968" y="123" font-size="20" fill-opacity=".72" text-anchor="end">
        na Strategy Analytics
      </text>
      <rect
        x="755"
        y="137"
        width="213"
        height="39"
        rx="20"
        fill="white"
        fill-opacity=".08"
        stroke="white"
        stroke-opacity=".18"
      />
      <image :href="calendar" x="769" y="146" width="20" height="20" />
      <text x="797" y="163" font-size="20">desde {{ model.since }}</text>
      <path d="M112 210 H968" stroke="white" stroke-opacity=".16" />
      <g
        v-for="(stat, index) in stats"
        :key="stat.label"
        :transform="`translate(${index % 2 ? 560 : 112} ${index < 2 ? 262 : 410})`"
      >
        <text font-size="22" fill-opacity=".6">{{ stat.label }}</text>
        <text y="57" font-size="44" font-weight="700" :fill="stat.color">
          {{ stat.value }}
        </text>
        <text y="94" font-size="20" fill-opacity=".6">{{ stat.detail }}</text>
      </g>
    </g>
    <g :transform="`translate(72 ${story ? 1480 : 1060})`">
      <rect width="132" height="132" rx="10" fill="white" />
      <qrcode-vue
        v-if="model.invitationUrl"
        :value="model.invitationUrl"
        :size="132"
        :margin="4"
        level="M"
        render-as="svg"
        foreground="#0d121f"
      />
      <text
        v-else
        x="66"
        y="61"
        text-anchor="middle"
        font-size="17"
        fill="#59616d"
      >
        <tspan x="66">Convite</tspan>
        <tspan x="66" dy="23">indisponível</tspan>
      </text>
      <text x="160" y="30" font-size="24" fill-opacity=".72">
        Comece a investir com o meu código de indicação
      </text>
      <text
        x="160"
        y="87"
        :font-size="model.referralCode.length > 28 ? 24 : 44"
        font-weight="700"
        fill="#00a3ff"
      >
        {{ model.referralCode || "Indisponível" }}
      </text>
      <text x="160" y="122" font-size="20" fill-opacity=".6">
        Aponte a câmera para o QR Code ou acesse strategyanalytics.com.br
      </text>
    </g>
    <text
      x="72"
      :y="height - (story ? 116 : 76)"
      font-size="16"
      fill-opacity=".45"
    >
      <tspan x="72">
        Perfil em {{ model.date }}. A imagem não mostra valores, documentos nem
        contatos.
      </tspan>
      <tspan x="72" dy="21">
        Rentabilidade passada não garante resultados futuros.
      </tspan>
    </text>
  </svg>
</template>
<script setup>
import { computed, ref, useId } from "vue";
import QrcodeVue from "qrcode.vue";
import { SHARE_FORMATS, sharePercent } from "src/services/profileShareImage";
const props = defineProps({
  model: { type: Object, required: true },
  format: { type: String, default: "feed" },
  logo: String,
  calendar: String,
  avatar: String,
  font: String,
});
const id = `share-${useId().replace(/[^a-z0-9-]/gi, "")}`;
const artwork = ref(null);
const story = computed(() => props.format === "story");
const height = computed(() => SHARE_FORMATS[props.format]?.height || 1350);
const stats = computed(() => [
  {
    label: "Performance desde a entrada",
    value: sharePercent(props.model.sinceEntry),
    detail: props.model.period,
    color: props.model.sinceEntry < 0 ? "#ffc9c9" : "#73ffa1",
  },
  {
    label: "Últimos 12 meses",
    value: sharePercent(props.model.last12Months),
    detail:
      props.model.last12Months == null
        ? "Dados indisponíveis"
        : "performance no período",
    color: props.model.last12Months < 0 ? "#ffc9c9" : "#73ffa1",
  },
  {
    label: "Contratos",
    value:
      props.model.activeContracts == null
        ? "—"
        : `${props.model.activeContracts} ativos`,
    detail:
      props.model.completedContracts == null
        ? "Dados indisponíveis"
        : `${props.model.completedContracts} concluídos desde a entrada`,
    color: "#fff",
  },
  {
    label: "Rendimento médio mensal",
    value: sharePercent(props.model.monthlyAverage),
    detail:
      props.model.monthlyAverage == null
        ? "Dados indisponíveis"
        : "na Carteira Strategy",
    color: props.model.monthlyAverage < 0 ? "#ffc9c9" : "#73ffa1",
  },
]);
defineExpose({ element: () => artwork.value });
</script>
