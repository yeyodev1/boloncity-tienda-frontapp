<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ImageAsset {
  url: string;
  public_id: string;
  description: string;
}

const props = defineProps({
  images: {
    type: Array as PropType<ImageAsset[]>,
    required: true,
  }
});

onMounted(() => {
  setTimeout(() => {
    // Parallax effect on images
    gsap.utils.toArray('.editorial-img').forEach((elem: any) => {
      gsap.fromTo(elem.querySelector('img'), 
        { y: -50, scale: 1.1 }, 
        {
          y: 50, 
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: elem,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });

    // Reveal text
    gsap.fromTo('.reveal-up-exp', 
      { y: 50, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.editorial-left',
          start: 'top 80%',
        }
      }
    );

    // Pin the left side content
    ScrollTrigger.create({
      trigger: '.editorial-container',
      start: 'top 20%', // When container hits 20% from top of viewport
      end: 'bottom 80%', // Unpin when bottom of container hits 80%
      pin: '.sticky-content',
      pinSpacing: false,
      id: 'experience-pin'
    });
  }, 200);
});

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(t => {
    if (t.vars.trigger === '.editorial-left' || t.vars.trigger === '.editorial-img' || t.vars.id === 'experience-pin') {
      t.kill();
    }
  });
});

const getImages = (count: number, startIndex: number = 0) => {
  if (!props.images.length) return [];
  return props.images.slice(startIndex, startIndex + count);
};
</script>

<template>
  <section class="experience section-dark" id="nosotros">
    <div class="editorial-container">
      
      <!-- Sticky Left Side -->
      <div class="editorial-left">
        <div class="sticky-content">
          <span class="eyebrow reveal-up-exp">Comunidad Cálida</span>
          <h2 class="reveal-up-exp">Ajetreo <br/> <span class="outline-text">Vibrante</span></h2>
          <p class="editorial-desc reveal-up-exp">
            Nuestros espacios están diseñados para el encuentro. 
            Una convergencia de sabores metropolitanos y energía citadina.
          </p>
          <div class="reveal-up-exp mt-4">
            <button class="btn-outline hover-target">Conoce la Historia</button>
          </div>
        </div>
      </div>

      <!-- Scrolling Right Side (Images) -->
      <div class="editorial-right">
        <div 
          v-for="(img, idx) in getImages(4, 3)" 
          :key="img.public_id" 
          class="editorial-img hover-target"
        >
          <div class="img-overflow-hidden">
            <img :src="img.url" :alt="img.description" loading="lazy" />
          </div>
          <div class="img-caption" v-if="idx % 2 === 0">
            <span>Boloncity Center - 2026</span>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style lang="scss" scoped>
$yellow: #efd537;
$green-dark: #235931;
$white: #FFFFFF;
$text-dark: #1A1A1A;

.section-dark {
  background-color: $green-dark;
  color: $white;
  padding: 15vw 4vw;
  position: relative;
  z-index: 10;
}

.editorial-container {
  display: flex;
  gap: 5vw;
  max-width: 1600px;
  margin: 0 auto;
}

.editorial-left {
  flex: 0 0 40%;
  position: relative;

  .sticky-content {
    // Replaced CSS position: sticky with GSAP Pinning
    padding-right: 2vw;
    will-change: transform;

    .eyebrow {
      color: $yellow;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 1rem;
      display: block;
    }

    h2 {
      font-size: clamp(4rem, 7vw, 9rem);
      font-weight: 800;
      line-height: 0.9;
      margin-bottom: 2rem;
      text-transform: uppercase;

      .outline-text {
        color: transparent;
        -webkit-text-stroke: 2px $white;
      }
    }

    .editorial-desc {
      font-size: 1.5rem;
      line-height: 1.6;
      color: rgba($white, 0.8);
      max-width: 500px;
      font-weight: 500;
    }

    .mt-4 {
      margin-top: 2rem;
    }

    .btn-outline {
      background: transparent;
      border: 2px solid $yellow;
      color: $yellow;
      padding: 1rem 2rem;
      border-radius: 50px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: $yellow;
        color: $green-dark;
      }
    }
  }
}

.editorial-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10vw; // Massive gap between images
  padding-top: 10vh; // Offset start
  padding-bottom: 10vh;

  .editorial-img {
    position: relative;
    width: 100%;

    .img-overflow-hidden {
      overflow: hidden;
      border-radius: 20px;
      width: 100%;
      aspect-ratio: 4/5; // Editorial portrait ratio
      
      img {
        width: 100%;
        height: 120%; // Extra height for parallax
        object-fit: cover;
      }
    }

    .img-caption {
      position: absolute;
      bottom: -3rem;
      right: 0;
      font-size: 1.2rem;
      font-weight: 800;
      color: $yellow;
      text-transform: uppercase;
    }

    // Offset every other image for a scattered look
    &:nth-child(even) {
      width: 80%;
      margin-left: auto;
      .img-overflow-hidden {
        aspect-ratio: 16/9; // Landscape
      }
    }
  }
}

@media (max-width: 1024px) {
  .editorial-container {
    flex-direction: column;
  }
  .editorial-left {
    flex: none;
    margin-bottom: 10vw;
    .sticky-content {
      position: relative;
      top: 0;
    }
  }
  .editorial-right .editorial-img:nth-child(even) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
