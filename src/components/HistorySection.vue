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

const getImages = (count: number, startIndex: number = 0) => {
  if (!props.images.length) return [];
  return props.images.slice(startIndex, startIndex + count);
};

onMounted(() => {
  setTimeout(() => {
    // Reveal main history text
    gsap.fromTo('.reveal-up-hist', 
      { y: 50, opacity: 0 }, 
      {
        y: 0, 
        opacity: 1, 
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.history-content',
          start: 'top 80%',
        }
      }
    );

    // Floating images parallax
    gsap.utils.toArray('.floating-img').forEach((elem: any, index: number) => {
      const speed = index % 2 === 0 ? 100 : -100;
      gsap.fromTo(elem, 
        { y: speed }, 
        {
          y: -speed, 
          ease: 'none',
          scrollTrigger: {
            trigger: '.history-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    });
  }, 200);
});

onUnmounted(() => {
  ScrollTrigger.getAll().forEach(t => {
    if (t.vars.trigger === '.history-content' || t.vars.trigger === '.history-section') {
      t.kill();
    }
  });
});
</script>

<template>
  <section class="history-section" id="historia">
    <div class="history-container">
      
      <!-- Text Content -->
      <div class="history-content">
        <span class="eyebrow green reveal-up-hist">El Origen</span>
        <h2 class="reveal-up-hist">De la Calle <br/> a la <span class="italic-highlight">Leyenda</span></h2>
        
        <div class="history-desc-wrapper">
          <p class="history-desc reveal-up-hist">
            Todo comenzó con la búsqueda del bolón perfecto. No queríamos hacer solo comida, queríamos edificar monumentos al sabor.
          </p>
          <p class="history-desc reveal-up-hist mt-3">
            Boloncity nació como un punto de encuentro metropolitano, donde la tradición del plátano verde se fusiona con la velocidad y la innovación de la vida urbana.
          </p>
          
          <div class="reveal-up-hist mt-5">
             <button class="btn-text-animated hover-target">
               Leer Nuestra Filosofía <i class="fa-solid fa-arrow-right"></i>
             </button>
          </div>
        </div>
      </div>

      <!-- Floating Images Archive -->
      <div class="history-gallery">
        <div 
          v-for="(img, idx) in getImages(3, 10)" 
          :key="img.public_id" 
          :class="['floating-img', `img-pos-${idx + 1}`]"
        >
          <img :src="img.url" :alt="img.description" loading="lazy" />
        </div>
      </div>

    </div>
  </section>
</template>

<style lang="scss" scoped>
$green: #00a523;
$green-dark: #235931;
$bg-light: #F4F4F0;
$text-dark: #1A1A1A;

.history-section {
  background-color: $bg-light;
  color: $text-dark;
  padding: 15vw 4vw;
  position: relative;
  overflow: hidden;
}

.history-container {
  display: flex;
  max-width: 1600px;
  margin: 0 auto;
  align-items: center;
  gap: 5vw;
}

.history-content {
  flex: 0 0 50%;
  position: relative;
  z-index: 2;

  .eyebrow.green {
    color: $green;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    display: block;
  }

  h2 {
    font-size: clamp(3.5rem, 6vw, 7rem);
    font-weight: 800;
    line-height: 1;
    color: $green-dark;
    text-transform: uppercase;
    margin-bottom: 3rem;

    .italic-highlight {
      font-style: italic;
      color: $green;
      font-weight: 400; // Contrast with bold
      text-transform: lowercase; // Stylistic choice
    }
  }

  .history-desc-wrapper {
    max-width: 80%;
    
    .history-desc {
      font-size: 1.3rem;
      line-height: 1.6;
      color: rgba($text-dark, 0.8);
      font-weight: 500;
      margin: 0;
    }

    .mt-3 { margin-top: 1.5rem; }
    .mt-5 { margin-top: 3rem; }

    .btn-text-animated {
      background: none;
      border: none;
      color: $green-dark;
      font-size: 1.2rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      padding: 0;
      
      i {
        transition: transform 0.3s ease;
      }

      &:hover i {
        transform: translateX(10px);
      }
    }
  }
}

.history-gallery {
  flex: 1;
  position: relative;
  height: 600px; // Fixed height context for absolute images

  .floating-img {
    position: absolute;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: sepia(0.3) contrast(1.1); // Vintage archive feel
      transition: filter 0.5s ease;
      
      &:hover {
        filter: sepia(0) contrast(1);
      }
    }
  }

  // Asymmetric Positioning
  .img-pos-1 {
    width: 250px;
    height: 350px;
    top: 0;
    left: 0;
    z-index: 2;
  }

  .img-pos-2 {
    width: 350px;
    height: 450px;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    z-index: 1;
  }

  .img-pos-3 {
    width: 200px;
    height: 250px;
    bottom: -50px;
    left: 20%;
    z-index: 3;
  }
}

@media (max-width: 1024px) {
  .history-container {
    flex-direction: column;
  }
  .history-content {
    flex: none;
    .history-desc-wrapper { max-width: 100%; }
  }
  .history-gallery {
    width: 100%;
    height: 500px;
    margin-top: 10vw;
  }
}
</style>
