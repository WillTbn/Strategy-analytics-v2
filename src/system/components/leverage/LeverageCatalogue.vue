<template>
  <section class="leverage-catalogue">
    <h2>Confira Formas de Alavancagem pela Strategy Analytics</h2>
    <article v-for="item in products" :key="item.kind" class="leverage-product">
      <div class="catalogue-art">
        <div :class="['catalogue-crop', item.kind]">
          <img :src="asset(item.image)" alt="" />
        </div>
      </div>
      <div class="product-copy">
        <h3>{{ item.title }}</h3>
        <p>{{ item.subtitle }}</p>
        <router-link :to="item.link"
          >Quero Conhecer<img
            :src="asset('imgIconJamIconsOutlineLogosArrowRight.svg')"
            alt=""
        /></router-link>
      </div>
      <div class="product-brands">
        <template v-if="item.kind === 'secured'"
          ><div v-for="(row, index) in banks" :key="index" class="brand-row">
            <div
              v-for="bank in row"
              :key="bank.image"
              :style="{ width: bank.width + 'px', height: '32px' }"
              :class="[
                'brand-slot',
                {
                  stretched: ['Bradesco', 'GaleriaBank', 'CashMe'].includes(
                    bank.name,
                  ),
                },
              ]"
            >
              <img
                :src="asset(bank.image)"
                :alt="bank.name"
                :class="{ itau: bank.name === 'Itaú' }"
              />
            </div></div
        ></template>
        <div v-else-if="item.kind === 'consortium'" class="brand-row">
          <img
            :src="asset('imgImage265.png')"
            alt="Porto"
            width="172"
            height="40"
          /><img
            :src="asset('imgImage259.png')"
            alt="Bradesco"
            width="165"
            height="40"
          />
        </div>
        <div v-else class="coin-groups">
          <div class="brand-row">
            <img
              v-for="coin in fiat"
              :key="coin.image"
              :src="asset(coin.image)"
              :alt="coin.name"
              :width="coin.width"
              height="50"
            />
          </div>
          <div class="brand-row">
            <div
              v-for="(coin, index) in crypto"
              :key="coin.name"
              class="crypto-crop"
              :class="'crypto-' + index"
            >
              <img
                :src="asset('imgChatGptImage13DeAgoDe20252108132.png')"
                :alt="coin.name"
              />
            </div>
            <span>...</span>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
<script setup>
const asset = (name) => `/figma/leverage/${name}`;
const products = [
  {
    kind: "secured",
    image: "imgWhisk41901F58Df2.png",
    title: "Empréstimo com Garantia",
    subtitle:
      "Crédito com juros menores usando um patrimônio seu como segurança!",
    link: "/system/loan/securedLoan",
  },
  {
    kind: "consortium",
    image: "imgWhiskEfef90628E.png",
    title: "Consórcio",
    subtitle:
      "Participe de um grupo e conquiste seu patrimônio no momento certo!",
    link: "/system/loan/consortiumLoan",
  },
  {
    kind: "collateral",
    image: "imgWhisk6079F395702.png",
    title: "Empréstimo Colateral",
    subtitle: "Transforme seus ativos financeiros em crédito rápido e seguro!",
    link: "/system/loan/collateralLoan",
  },
];
const banks = [
  [
    { image: "imgId6HerfXiULogos1.png", name: "C6", width: 59 },
    { image: "imgLogo11.png", name: "Inter", width: 125 },
    { image: "imgLogo2.png", name: "Itaú", width: 60 },
    { image: "imgImage257.png", name: "Santander", width: 183 },
    { image: "imgImage261.png", name: "Trinus", width: 102 },
  ],
  [
    { image: "imgImage259.png", name: "Bradesco", width: 132 },
    { image: "imgImage262.png", name: "GaleriaBank", width: 133 },
    { image: "imgImage258.png", name: "Sicredi", width: 136 },
    { image: "imgImage264.png", name: "CashMe", width: 156 },
  ],
];
const fiat = [
  { image: "imgChatGptImage13DeAgoDe20250053212.png", name: "Real", width: 51 },
  {
    image: "imgChatGptImage13DeAgoDe20250053213.png",
    name: "Dólar",
    width: 53,
  },
  { image: "imgChatGptImage13DeAgoDe20250053214.png", name: "Euro", width: 52 },
  { image: "imgChatGptImage13DeAgoDe20250053215.png", name: "Iene", width: 52 },
];
const crypto = [{ name: "Bitcoin" }, { name: "Tether" }, { name: "Solana" }];
</script>
<style scoped>
.leverage-catalogue {
  margin: 48px;
  padding: 24px;
  display: grid;
  gap: 40px;
  border: 1px solid #efefef29;
  border-radius: 8px;
  background: linear-gradient(194deg, #0000003d, #00000014 51%, #0000000a);
  color: white;
}
.leverage-catalogue h2 {
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  text-align: center;
  margin: 0;
  letter-spacing: normal;
}
.leverage-product {
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 200px;
  padding: 24px 40px;
  border: 1px solid #efefef29;
  border-radius: 8px;
  background: linear-gradient(182deg, #ffffff29, #ffffff0a 50%, #ffffff03);
  box-shadow: 4px 4px 12px #0000003d;
  backdrop-filter: blur(20px);
}
.leverage-product + .leverage-product {
  margin-top: 24px;
}
.catalogue-art {
  width: 220px;
  height: 152px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(196deg, #0000003d, #00000014 51%, #0000000a);
  border-radius: 4px;
}
.catalogue-crop {
  position: relative;
  overflow: hidden;
}
.catalogue-crop img {
  position: absolute;
  max-width: none;
}
.secured {
  width: 144px;
  height: 145px;
}
.secured img {
  height: 152.01%;
  left: -93.03%;
  top: -29.77%;
  width: 280.48%;
}
.consortium {
  width: 173px;
  height: 145px;
}
.consortium img {
  height: 144.09%;
  left: -60.69%;
  top: -27.77%;
  width: 221.38%;
}
.collateral {
  width: 204px;
  height: 103px;
}
.collateral img {
  height: 131.9%;
  left: -12.9%;
  top: -16.4%;
  width: 122.58%;
}
.product-copy {
  flex: 1;
  min-width: 0;
}
.product-copy h3 {
  font-size: 24px;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: normal;
  margin: 0 0 8px;
}
.product-copy p {
  font-size: 17px;
  line-height: 1.35;
  color: #dcdcdc;
  margin: 0 0 24px;
}
.product-copy a {
  color: #00a3ff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  text-decoration: none;
}
.product-brands {
  flex: none;
  width: 800px;
  align-self: stretch;
  border-left: 1px solid #464646;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 24px;
  padding-left: 24px;
  min-width: 0;
}
.brand-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  flex-wrap: wrap;
}
.brand-slot {
  position: relative;
  flex: none;
  overflow: hidden;
}
.brand-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.brand-slot img.itau {
  position: absolute;
  width: 53.33%;
  left: 23.33%;
  top: 0;
}
.coin-groups {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 40px;
  flex-wrap: wrap;
}
.coin-groups .brand-row {
  gap: 8px;
}
.coin-groups span {
  font-size: 24px;
  font-weight: 700;
}
.crypto-crop {
  width: 50px;
  height: 48px;
  position: relative;
  overflow: hidden;
  flex: none;
}
.crypto-crop img {
  position: absolute;
  max-width: none;
  height: 280.52%;
  top: -89.61%;
  width: 400%;
  left: -272.84%;
}
.crypto-0 {
  width: 49px;
  height: 50px;
}
.crypto-0 img {
  width: 432%;
  left: -36%;
}
.crypto-1 {
  height: 45px;
}
.crypto-1 img {
  width: 376.74%;
  left: -138.37%;
}
a:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 4px;
}
@media (max-width: 1700px) {
  .product-brands {
    width: 45%;
  }
}
@media (max-width: 1100px) {
  .leverage-product {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    padding: 24px;
  }
  .product-brands {
    grid-column: 1/-1;
    width: 100%;
    border-left: 0;
    border-top: 1px solid #464646;
    padding: 24px 0 0;
    align-items: center;
  }
  .brand-row {
    justify-content: center;
  }
}
@media (max-width: 700px) {
  .leverage-catalogue {
    margin: 16px;
    padding: 16px;
    gap: 24px;
  }
  .leverage-catalogue h2 {
    font-size: 22px;
  }
  .leverage-product {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
    gap: 16px;
  }
  .leverage-product + .leverage-product {
    margin-top: 0;
  }
  .catalogue-art {
    justify-self: center;
  }
  .product-copy h3 {
    font-size: 22px;
  }
  .brand-row {
    gap: 16px;
  }
  .coin-groups {
    justify-content: center;
  }
  .product-brands img {
    max-width: 100%;
    object-fit: contain;
  }
}
</style>

<style scoped>
.brand-slot.stretched img {
  object-fit: fill;
}
</style>

<style scoped>
.leverage-catalogue {
  font-family: Inter, sans-serif;
}
</style>
