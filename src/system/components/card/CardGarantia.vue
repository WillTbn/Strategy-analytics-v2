<template>
  <article class="card-garantia">
    <div class="product-art" v-if="kind">
      <div class="art-crop" :class="kind"><img :src="image" alt="" /></div>
    </div>
    <img v-else-if="image" :src="image" alt="" class="dynamic-art" />
    <div class="product-content">
      <h3>{{ title }}</h3>
      <p>{{ description }}<br />{{ subDescription }}</p>
    </div>
    <button type="button" @click="$emit('simular')">
      Simular<img
        src="/figma/leverage/imgIconJamIconsOutlineLogosArrowRight.svg"
        alt=""
      />
    </button>
  </article>
</template>
<script setup>
defineProps({
  kind: { type: String, default: "" },
  image: String,
  title: String,
  description: String,
  subDescription: String,
});
defineEmits(["simular"]);
</script>
<style scoped>
.card-garantia {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #efefef29;
  background: linear-gradient(
    209deg,
    #0000003d 14.79%,
    #0000001f 66.18%,
    #00a3ff66
  );
  backdrop-filter: blur(20px);
  box-shadow: 4px 4px 12px #0000003d;
  color: white;
}
.product-art {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.art-crop {
  position: relative;
  overflow: hidden;
  width: 225px;
  height: 200px;
  transform: scaleX(-1);
  flex: none;
}
.art-crop img {
  position: absolute;
  max-width: none;
}
.imovel img {
  height: 107.53%;
  width: 175.44%;
  left: -37.72%;
  top: -3.76%;
}
.art-crop.automovel {
  width: 173px;
  height: 150px;
}
.automovel img {
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  object-fit: cover;
}
.card-garantia h3 {
  font-size: 17px;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: normal;
  margin: 0;
}
.card-garantia p {
  font-size: 14px;
  line-height: 1.35;
  color: #dcdcdc;
  margin: 0;
  flex: 1;
}
.card-garantia button {
  background: none;
  border: 0;
  padding: 0;
  color: #00a3ff;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 20px;
  width: fit-content;
}
.card-garantia button:focus-visible {
  outline: 2px solid #00a3ff;
  outline-offset: 4px;
}
.dynamic-art {
  height: 200px;
  object-fit: contain;
  max-width: 100%;
}
@media (max-width: 1100px) {
  .card-garantia {
    padding: 16px;
  }
  .product-art {
    overflow: hidden;
  }
}
</style>

<style scoped>
.product-content {
  display: grid;
  gap: 12px;
}
</style>

<style scoped>
.card-garantia {
  font-family: Inter, sans-serif;
}
</style>
