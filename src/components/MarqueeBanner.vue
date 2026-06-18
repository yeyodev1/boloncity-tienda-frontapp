<script setup lang="ts">
import { onMounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

onMounted(() => {
  gsap.fromTo('.marquee-container',
    { opacity: 0 },
    { opacity: 1, duration: 1, delay: 1 }
  );
});
</script>

<template>
  <div class="marquee-container">
    <div class="marquee-content">
      <span>LA ILUSTRE MUNICIPALIDAD DE BOLONCITY INFORMA: EL SABOR NUNCA DUERME ✦ </span>
      <span>LA ILUSTRE MUNICIPALIDAD DE BOLONCITY INFORMA: EL SABOR NUNCA DUERME ✦ </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$yellow: #efd537;
$text-dark: #1A1A1A;

.marquee-container {
  background: $yellow;
  color: $text-dark;
  padding: 1.5rem 0;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  transform: rotate(-2deg) scale(1.05);
  margin-top: -3rem;
  z-index: 20;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);

  .marquee-content {
    display: flex;
    animation: marquee 20s linear infinite;

    span {
      font-weight: 800;
      font-size: 1.5rem;
      padding-right: 2rem;
      letter-spacing: 2px;
    }
  }
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
