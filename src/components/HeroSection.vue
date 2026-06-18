<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';
import { gsap } from 'gsap';
import { useWindowSize } from '@vueuse/core';

interface ImageAsset {
  url: string;
}

const props = defineProps({
  images: {
    type: Array as PropType<ImageAsset[]>,
    required: true,
  }
});

const heroSection = ref<HTMLElement | null>(null);
const parallaxImages = ref<HTMLElement[]>([]);
const { width, height } = useWindowSize();

const handleMouseMove = (e: MouseEvent) => {
  if (!heroSection.value) return;
  const xPos = (e.clientX / width.value - 0.5) * 40;
  const yPos = (e.clientY / height.value - 0.5) * 40;

  parallaxImages.value.forEach((img, i) => {
    const depth = (i + 1) * 0.5;
    gsap.to(img, {
      x: xPos * depth,
      y: yPos * depth,
      duration: 1,
      ease: 'power2.out'
    });
  });
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);

  const tl = gsap.timeline();
  
  tl.fromTo('.word-reveal span', 
    { y: 100, opacity: 0, rotation: 10 }, 
    { y: 0, opacity: 1, rotation: 0, duration: 1, stagger: 0.1, ease: 'expo.out' },
    '+=0.5'
  )
  .fromTo('.hero-floating-img',
    { scale: 0.8, opacity: 0, y: 50 },
    { scale: 1, opacity: 1, y: 0, duration: 1.5, stagger: 0.2, ease: 'elastic.out(1, 0.7)' },
    '-=1'
  )
  .fromTo('.reveal-up-hero',
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
    '-=1.2'
  );
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});

const getImages = (count: number, startIndex: number = 0) => {
  if (!props.images.length) return [];
  return props.images.slice(startIndex, startIndex + count);
};
</script>

<template>
  <section class="hero" ref="heroSection" id="inicio">
    <div class="hero-bg-text">METRÓPOLIS</div>
    
    <div class="hero-content">
      <div class="award-badge hover-target">
        <svg viewBox="0 0 100 100" class="rotating-text">
          <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
          <text>
            <textPath href="#circle">ESTRELLA CULINARIA ORO 2019 • </textPath>
          </text>
        </svg>
        <div class="badge-center">B</div>
      </div>

      <h1 class="main-title word-reveal">
        <div class="line"><span>Vas a querer</span></div>
        <div class="line"><span>vivir</span> <span class="highlight">aquí.</span></div>
      </h1>
      
      <p class="hero-subtitle reveal-up-hero">La capital del verde y el sabor costeño. Una experiencia donde la tradición se encuentra con la energía urbana.</p>
    </div>

    <div class="hero-images">
      <div 
        v-for="(img, idx) in getImages(3, 0)" 
        :key="img.url"
        class="hero-floating-img hover-target"
        :class="`pos-${idx + 1}`"
        :ref="el => { if(el) parallaxImages.push(el as HTMLElement) }"
      >
        <div class="img-inner" :style="{ backgroundImage: `url(${img.url})` }"></div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
$green: #00a523;
$yellow: #efd537;
$text-dark: #1A1A1A;

.hero {
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 4vw;
  overflow: hidden;

  .hero-bg-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 25vw;
    font-weight: 800;
    color: rgba($text-dark, 0.03);
    white-space: nowrap;
    z-index: 0;
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    max-width: 800px;
    margin-top: 5vh;
  }

  .award-badge {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 2rem;
    cursor: pointer;
    
    .rotating-text {
      width: 100%;
      height: 100%;
      animation: rotate 15s linear infinite;
      
      text {
        font-family: 'Switzer', sans-serif;
        font-weight: 800;
        font-size: 13px;
        letter-spacing: 3px;
        fill: $green;
      }
    }

    .badge-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-weight: 800;
      font-size: 2rem;
      color: $yellow;
    }
  }

  .main-title {
    font-size: clamp(4rem, 8vw, 10rem);
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -2px;
    margin-bottom: 2rem;
    text-transform: uppercase;

    .line {
      overflow: hidden;
      display: flex;
      gap: 2vw;
      flex-wrap: wrap;
      
      span {
        display: inline-block;
      }
    }

    .highlight {
      color: $green;
    }
  }

  .hero-subtitle {
    font-size: 1.5rem;
    max-width: 500px;
    line-height: 1.5;
    font-weight: 500;
  }

  .hero-images {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;

    .hero-floating-img {
      position: absolute;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0,0,0,0.15);
      pointer-events: auto;

      .img-inner {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
      }

      &.pos-1 { width: 25vw; height: 35vw; top: 15%; right: 5%; }
      &.pos-2 { width: 18vw; height: 25vw; bottom: 10%; right: 35%; }
      &.pos-3 { width: 15vw; height: 20vw; top: 20%; left: 55%; z-index: -1; }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .hero .main-title { font-size: 4rem; }
  .hero .hero-images .hero-floating-img { display: none; }
}
</style>
