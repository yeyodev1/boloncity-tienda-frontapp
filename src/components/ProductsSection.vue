<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
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

const getImages = (count: number, startIndex: number = 0) => {
  if (!props.images || !props.images.length) return [];
  return props.images.slice(startIndex, startIndex + count);
};

const sliderRef = ref<HTMLElement | null>(null);

onMounted(() => {
  setTimeout(() => {
    // 1. Reveal intro texts
    gsap.fromTo('.reveal-up-prod', 
      { y: 100, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 1, 
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-header',
          start: 'top 80%',
        }
      }
    );

    // 2. Horizontal Scroll Logic
    const slider = sliderRef.value;
    if (slider) {
      const totalWidth = slider.scrollWidth;
      const viewportWidth = window.innerWidth;
      
      gsap.to(slider, {
        x: () => -(totalWidth - viewportWidth + 100), // 100px buffer
        ease: 'none',
        scrollTrigger: {
          trigger: '.products-container',
          start: 'top top',
          end: () => `+=${totalWidth}`,
          pin: true,
          scrub: 1, // Smooth scrub
          invalidateOnRefresh: true,
        }
      });
    }
  }, 200);
});

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(t => {
    if (t.vars.trigger === '.products-container' || t.vars.trigger === '.products-header') {
      t.kill();
    }
  });
});
</script>

<template>
  <section class="products-section" id="menu">
    <div class="products-header">
      <div class="container text-center">
        <span class="eyebrow green reveal-up-prod">Nuestros Monumentos</span>
        <h2 class="reveal-up-prod">Arquitectura <br/> del Sabor</h2>
      </div>
    </div>

    <!-- Pinned Container -->
    <div class="products-container">
      <div class="product-slider" ref="sliderRef">
        
        <!-- Large cinematic cards -->
        <div 
          v-for="(img, idx) in getImages(6, 7)" 
          :key="img.public_id" 
          class="cinematic-card hover-target"
        >
          <div class="card-img-wrapper">
            <img :src="img.url" :alt="img.description" loading="lazy" />
            <div class="card-badge" v-if="idx === 0">Más Votado</div>
            
            <div class="card-overlay">
              <div class="card-content">
                <h3>Bolón Metropolitano 0{{ idx + 1 }}</h3>
                <p>Vía rápida de chicharrón y queso.</p>
                <div class="card-footer">
                  <span class="price">$5.50</span>
                  <button class="btn-icon"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="end-spacer"></div>

      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
$green: #00a523;
$green-dark: #235931;
$yellow: #efd537;
$bg-light: #F4F4F0;
$white: #FFFFFF;
$text-dark: #1A1A1A;

.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 4vw;
}

.text-center { text-align: center; }

.products-section {
  padding-top: 10vw;
  background-color: $bg-light;
  overflow: hidden;
}

.products-header {
  margin-bottom: 5vh;

  .eyebrow.green {
    color: $green;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    display: block;
  }

  h2 {
    font-size: clamp(3rem, 6vw, 8rem);
    font-weight: 800;
    line-height: 1;
    color: $green-dark;
    text-transform: uppercase;
  }
}

.products-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background-color: $text-dark; // Dark background for cinematic feel
  padding: 5vh 0;
}

.product-slider {
  display: flex;
  gap: 4vw;
  padding: 0 10vw;
  height: 80vh; // Fill most of the screen
  align-items: center;
  will-change: transform;

  .cinematic-card {
    flex: 0 0 45vw; // Massive width
    height: 100%;
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;

    .card-img-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      background-color: #111; // Dark background for contain

      img {
        width: 100%;
        height: 100%;
        object-fit: contain; // Prevent cropping
        transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1);
      }

      .card-badge {
        position: absolute;
        top: 2rem;
        left: 2rem;
        background: $yellow;
        color: $text-dark;
        padding: 0.8rem 1.5rem;
        border-radius: 50px;
        font-weight: 800;
        font-size: 1rem;
        text-transform: uppercase;
        z-index: 10;
      }

      .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba($text-dark, 0.9) 0%, rgba($text-dark, 0) 50%);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 3rem;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;

        .card-content {
          color: $white;

          h3 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
          }

          p {
            font-size: 1.2rem;
            color: rgba($white, 0.8);
            margin-bottom: 2rem;
            font-weight: 500;
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .price {
              font-size: 2rem;
              font-weight: 800;
              color: $yellow;
            }

            .btn-icon {
              width: 60px;
              height: 60px;
              border-radius: 50%;
              background: $white;
              color: $text-dark;
              border: none;
              font-size: 1.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;

              &:hover {
                background: $green;
                color: $white;
              }
            }
          }
        }
      }
    }

    &:hover {
      .card-img-wrapper img {
        transform: scale(1.08);
      }
      .card-overlay {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  .end-spacer {
    flex: 0 0 10vw; // Buffer at the end of the scroll
  }
}

@media (max-width: 768px) {
  .product-slider .cinematic-card {
    flex: 0 0 85vw;
  }
  .product-slider .cinematic-card .card-img-wrapper .card-overlay {
    opacity: 1; // Always show on mobile
    transform: translateY(0);
  }
  .product-slider .cinematic-card .card-img-wrapper .card-overlay .card-content h3 {
    font-size: 2rem;
  }
}
</style>
