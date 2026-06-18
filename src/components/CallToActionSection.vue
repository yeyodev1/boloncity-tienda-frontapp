<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ImageAsset {
  url: string;
  public_id: string;
}

const props = defineProps({
  images: {
    type: Array as PropType<ImageAsset[]>,
    required: true,
  }
});

// use the last image for the CTA background
const getCtaImage = () => {
  return props.images.length > 0 ? props.images[props.images.length - 1].url : '';
};

onMounted(() => {
  // Background scale parallax effect
  gsap.fromTo('.cta-image-inner',
    { scale: 1.5 },
    {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    }
  );
  
  // Massive Text parallax
  gsap.fromTo('.cta-text-massive',
    { y: 150 },
    {
      y: -150,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cta-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    }
  );
});

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(t => {
    if (t.vars.trigger === '.cta-section') {
      t.kill();
    }
  });
});
</script>

<template>
  <section class="cta-section">
    <div class="cta-image-wrapper">
      <div class="cta-image-inner" :style="{ backgroundImage: `url(${getCtaImage()})` }"></div>
      <div class="cta-overlay"></div>
    </div>
    
    <div class="cta-content">
      <h2 class="cta-text-massive">VISÍTANOS</h2>
      <button class="btn-solid-large hover-target">Haz tu Reserva</button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
$yellow: #efd537;
$white: #FFFFFF;
$text-dark: #1A1A1A;

.cta-section {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cta-image-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;

  .cta-image-inner {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    will-change: transform;
  }

  .cta-overlay {
    position: absolute;
    inset: 0;
    background: rgba($text-dark, 0.4);
  }
}

.cta-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: $white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;

  .cta-text-massive {
    font-size: clamp(5rem, 15vw, 20rem);
    font-weight: 800;
    line-height: 0.8;
    margin: 0;
    color: transparent;
    -webkit-text-stroke: 2px $white;
    text-transform: uppercase;
    will-change: transform;
    pointer-events: none;
  }

  .btn-solid-large {
    background: $yellow;
    color: $text-dark;
    border: none;
    padding: 1.5rem 4rem;
    border-radius: 100px;
    font-weight: 800;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    margin-top: -5vh; // Overlap slightly with the text
    transition: transform 0.3s ease, background 0.3s ease;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);

    &:hover {
      transform: scale(1.05);
      background: $white;
    }
  }
}
</style>
