<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { gsap } from 'gsap';
import HeaderMenu from '../components/HeaderMenu.vue';
import FooterIncredible from '../components/FooterIncredible.vue';
import CustomCursor from '../components/CustomCursor.vue';

interface ImageAsset {
  url: string;
  public_id: string;
  description: string;
}

const images = ref<ImageAsset[]>([]);

onMounted(async () => {
  try {
    const imagesData = await import('../assets/images.json');
    images.value = imagesData.default || imagesData;
    
    // Simple stagger reveal for the grid items once loaded
    setTimeout(() => {
      gsap.fromTo('.catalog-item', 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power3.out' }
      );
    }, 100);
  } catch (e) {
    console.warn('images.json no encontrado.');
  }
});
</script>

<template>
  <div class="catalog-wrapper hide-cursor">
    <CustomCursor />
    <HeaderMenu :images="images" />
    
    <main class="catalog-main">
      <div class="catalog-header">
        <h1 class="catalog-title">Nuestro Menú <br/> <span class="outline-text">Metropolitano</span></h1>
        <p class="catalog-subtitle">Explora el sabor de la ciudad. Selecciona tus bolones favoritos y prepárate para la experiencia Boloncity.</p>
      </div>

      <div class="catalog-grid">
        <div 
          v-for="(img, idx) in images" 
          :key="img.public_id" 
          class="catalog-item hover-target"
        >
          <div class="item-img-wrapper">
            <img :src="img.url" :alt="img.description" loading="lazy" />
            <div class="item-overlay">
              <button class="btn-add"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
          <div class="item-info">
            <div class="item-header">
              <h3>Bolón Metropolitano {{ String(idx + 1).padStart(2, '0') }}</h3>
              <span class="price">$5.50</span>
            </div>
            <p class="item-desc">Relleno espectacular para sobrevivir el tráfico de la ciudad.</p>
          </div>
        </div>
      </div>
    </main>

    <FooterIncredible />
  </div>
</template>

<style lang="scss" scoped>
$bg-light: #F4F4F0;
$text-dark: #1A1A1A;
$green-dark: #235931;
$yellow: #efd537;
$white: #FFFFFF;

.catalog-wrapper {
  background-color: $bg-light;
  color: $text-dark;
  font-family: 'Switzer', sans-serif;
  min-height: 100vh;
  
  &.hide-cursor {
    cursor: none !important;
    * { cursor: none !important; }
  }
}

.catalog-main {
  padding: 15vh 4vw 10vh;
  max-width: 1600px;
  margin: 0 auto;
}

.catalog-header {
  text-align: center;
  margin-bottom: 8vh;

  .catalog-title {
    font-size: clamp(3rem, 6vw, 7rem);
    font-weight: 800;
    line-height: 1;
    color: $green-dark;
    text-transform: uppercase;
    margin-bottom: 1rem;

    .outline-text {
      color: transparent;
      -webkit-text-stroke: 2px $green-dark;
    }
  }

  .catalog-subtitle {
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    color: rgba($text-dark, 0.7);
    font-weight: 500;
  }
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 3vw;
}

.catalog-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0; // for GSAP initial state

  .item-img-wrapper {
    position: relative;
    border-radius: 15px;
    overflow: hidden;
    aspect-ratio: 4/5;
    background: #111;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }

    .item-overlay {
      position: absolute;
      inset: 0;
      background: rgba($green-dark, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.4s ease;

      .btn-add {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: $yellow;
        color: $text-dark;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        transform: translateY(20px);
        transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      }
    }

    &:hover {
      img {
        transform: scale(1.05);
      }
      .item-overlay {
        opacity: 1;

        .btn-add {
          transform: translateY(0);
        }
      }
    }
  }

  .item-info {
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;

      h3 {
        font-size: 1.2rem;
        font-weight: 800;
        text-transform: uppercase;
        margin: 0;
        max-width: 70%;
        line-height: 1.2;
      }

      .price {
        font-size: 1.2rem;
        font-weight: 800;
        color: $green-dark;
      }
    }

    .item-desc {
      font-size: 0.95rem;
      color: rgba($text-dark, 0.6);
      margin: 0;
    }
  }
}

@media (max-width: 768px) {
  .catalog-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
</style>
