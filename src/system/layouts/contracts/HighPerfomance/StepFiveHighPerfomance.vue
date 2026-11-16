<template>
  <q-card class="step-five-high-perfomance tool-padding" bordered>
    <q-card-section>
      <p class="text-inter-24-700 text-bolder-weight">Regiões</p>
      <p class="text-grey">Define a alocação geográfica do portfólio</p>
    </q-card-section>
    <q-list class="list-type-control q-px-lg q-pb-lg">
      <q-item
        class="badge-perfomance q-mb-sm"
        tag="label"
        v-ripple
        v-for="(item, index) in list"
        :key="index"
      >
        <q-item-section top avatar>
          <q-toggle v-model="highPerfomance.regions" :val="item.value" :aria-label="item.label" />
        </q-item-section>
        <q-item-section>
          <q-item-label>
            <q-icon
              class="icon-control"
              size="16px"
              :name="`img:${item.icon}`"
              v-if="item.icon != ''"
            />
            <!-- width="32px" -->
            <span class="q-ml-sm">
              {{ item.label }}
            </span>
          </q-item-label>
          <q-item-label caption>
            {{ item.description }}
            <div class="" v-if="item.descriptions">
              <span v-for="(d, index) in item.descriptions" :key="index">
                <q-icon
                  class="icon-control"
                  size="16px"
                  :name="`img:${d.icon}`"
                  v-if="d.icon != ''"
                />
                {{ d.description }}
              </span>
            </div>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card>
</template>

<script setup>
import { defineComponent } from "vue";
import { useInvestmentStore } from "src/stores/investments";
import {storeToRefs} from "pinia";

defineComponent({
  name: "StepFiveHighPerfomance",
});
const {highPerfomance}=storeToRefs(useInvestmentStore());
const list = [
  {
    label: "EUA",
    icon: "/system/icons/contracts/us.png",
    value: "EUA",
    description:
      "New York Stock Exchange (NYSE), Nasdaq Stock Market (NASDAQ), NYSE American (NYSEAM), Chicago Board Options Exchange (CBOE)",
  },
  {
    label: "China",
    icon: "/system/icons/contracts/cn.png",
    value: "CHINA",
    description:
      "Shanghai Stock Exchange (SSE), Shenzhen Stock Exchange (SZSE), Beijing Stock Exchange (BSE)",
  },
  {
    label: "Japão",
    icon: "/system/icons/contracts/jp.png",
    value: "Japão",
    description: "Tokyo Stock Exchange (TSE), Osaka Exchange (OSE)",
  },
  {
    label: "Austrália",
    icon: "/system/icons/contracts/au.png",
    value: "Austrália",
    description: "Australian Securities Exchange (ASX)",
  },
  {
    label: "Canadá",
    icon: "/system/icons/contracts/ca.png",
    value: "Canadá",
    description:
      "Toronto Stock Exchange (TSX), TSX Venture Exchange (TSXV), Canadian Securities Exchange (CSE)",
  },
  {
    label: "Alemanha",
    icon: "/system/icons/contracts/de.png",
    value: "Alemanha",
    description: "Frankfurt Stock Exchange (FWB/Deutsche Börse)",
  },
  {
    label: "Espanha",
    icon: "/system/icons/contracts/es.png",
    value: "Espanha",
    description: "Bolsa de Madrid",
  },
  {
    label: "Zona do Euro",
    icon: "/system/icons/contracts/eu.png",
    value: "Zona do Euro",
    description:
      "Euronext (França, Países Baixos, Bélgica, Portugal, Itália, Irlanda, Noruega)",
  },
  {
    label: "Índia",
    icon: "/system/icons/contracts/in.png",
    value: "Índia",
    description: "National Stock Exchange (NSE), Bombay Stock Exchange (BSE)",
  },
  {
    label: "Reino Unido",
    icon: "/system/icons/contracts/gb.png",
    value: "Reino Unido",
    description:
      "London Stock Exchange (LSE), Alternative Investment Market (AIMX)",
  },
  {
    label: "Suíça",
    icon: "/system/icons/contracts/ch.png",
    value: "Suíça",
    description: "SIX Swiss Exchange (XSWX)",
  },
  {
    label: "Mercados Emergentes Globais",
    value: "Mercados Emergentes Globais",
    icon: "/system/icons/contracts/world_earth.png",
    descriptions: [
      { icon: "/system/icons/contracts/br.png", description: "Brasil (B3)," },
      {
        icon: "/system/icons/contracts/kr.png",
        description: "Coreia do Sul (KRX),",
      },
      { icon: "/system/icons/contracts/tw.png", description: "Taiwan (TWSE)," },
      { icon: "/system/icons/contracts/mx.png", description: "México," },
      { icon: "", description: "(BMV)," },
      {
        icon: "/system/icons/contracts/za.png",
        description: "África do Sul (JSE),",
      },
      {
        icon: "/system/icons/contracts/tr.png",
        description: "Turquia (BIST),",
      },
      {
        icon: "/system/icons/contracts/id.png",
        description: "Indonésia (IDX).",
      },
    ],
  },
];
</script>

<style scoped>
.list-type-control {
  max-height: min(1000px,60dvh);
  overflow: auto;
}
.icon-control {
  width: 1.5rem;
}
</style>
