<script setup lang="ts">
import { ref, onMounted } from 'vue';
import CustomCursor from '../components/CustomCursor.vue';
import HeaderMenu from '../components/HeaderMenu.vue';
import HeroSection from '../components/HeroSection.vue';
import MarqueeBanner from '../components/MarqueeBanner.vue';
import ExperienceSection from '../components/ExperienceSection.vue';
import ProductsSection from '../components/ProductsSection.vue';
import CallToActionSection from '../components/CallToActionSection.vue';
import FooterIncredible from '../components/FooterIncredible.vue';

interface ImageAsset {
  filename: string;
  url: string;
  public_id: string;
  description: string;
}

const images = ref<ImageAsset[]>([]);

onMounted(async () => {
  try {
    const imagesData = await import('../assets/images.json');
    images.value = imagesData.default || imagesData;
  } catch (e) {
    console.warn('images.json no encontrado.');
  }
});
</script>

<template>
  <div class="home-wrapper hide-cursor">
    <CustomCursor />
    <HeaderMenu :images="images" />
    <HeroSection :images="images" />
    <MarqueeBanner />
    <ExperienceSection :images="images" />
    <ProductsSection :images="images" />
    <CallToActionSection :images="images" />
    <FooterIncredible />
  </div>
</template>

<style lang="scss" scoped>
$bg-light: #F4F4F0;
$text-dark: #1A1A1A;

.home-wrapper {
  background-color: $bg-light;
  color: $text-dark;
  font-family: 'Switzer', sans-serif;
  overflow-x: hidden;
  position: relative;
  
  &.hide-cursor {
    cursor: none !important;
    * { cursor: none !important; }
  }
}
</style>
