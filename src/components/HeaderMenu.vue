<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import { gsap } from 'gsap';
import logoImg from '../assets/logos/logo.png';

interface ImageAsset {
  url: string;
}

const props = defineProps({
  images: {
    type: Array as PropType<ImageAsset[]>,
    required: true,
  }
});

const isMenuOpen = ref(false);
const activeImage = ref('');

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Set a default image if available
watch(() => props.images, (newImages) => {
  if (newImages.length > 0 && !activeImage.value) {
    activeImage.value = newImages[0].url;
  }
}, { immediate: true });

const handleMenuHover = (index: number) => {
  if (props.images.length > index) {
    activeImage.value = props.images[index].url;
  }
};

// Watcher to animate menu open/close
watch(isMenuOpen, (isOpen) => {
  if (isOpen) {
    gsap.to('.menu-overlay', { y: '0%', duration: 0.8, ease: 'expo.inOut' });
    gsap.fromTo('.menu-item-link', 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.4, ease: 'power3.out' }
    );
  } else {
    gsap.to('.menu-overlay', { y: '-100%', duration: 0.8, ease: 'expo.inOut' });
  }
});
</script>

<template>
  <header>
    <!-- Navbar -->
    <nav class="navbar" :class="{ 'menu-open': isMenuOpen }">
      <div class="logo">
        <img :src="logoImg" alt="Boloncity Logo" class="logo-img" />
      </div>
      <div class="nav-right">
        <button class="menu-toggle hover-target" @click="toggleMenu" aria-label="Toggle Menu">
          <i class="fa-solid fa-bars" v-if="!isMenuOpen"></i>
          <i class="fa-solid fa-times" v-else></i>
        </button>
        <button class="btn-solid hover-target"><i class="fa-solid fa-shopping-bag"></i> Pedir Ahora</button>
      </div>
    </nav>

    <!-- Fullscreen Menu Overlay -->
    <div class="menu-overlay">
      <div class="menu-bg" :style="{ backgroundImage: `url(${activeImage})` }"></div>
      <div class="menu-bg-overlay"></div>
      
      <div class="menu-content">
        <ul class="menu-list">
          <li class="menu-item" @mouseenter="handleMenuHover(0)">
            <a href="#inicio" class="menu-item-link hover-target" @click="toggleMenu">01. Inicio</a>
          </li>
          <li class="menu-item" @mouseenter="handleMenuHover(1)">
            <a href="#nosotros" class="menu-item-link hover-target" @click="toggleMenu">02. Nosotros</a>
          </li>
          <li class="menu-item" @mouseenter="handleMenuHover(2)">
            <a href="#menu" class="menu-item-link hover-target" @click="toggleMenu">03. Monumentos</a>
          </li>
          <li class="menu-item" @mouseenter="handleMenuHover(3)">
            <a href="#contacto" class="menu-item-link hover-target" @click="toggleMenu">04. Contacto</a>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
$yellow: #efd537;
$text-dark: #1A1A1A;
$white: #FFFFFF;
$green-dark: #235931;

.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2vw 4vw;
  z-index: 101; // Above overlay
  background: rgba($white, 0.95);
  backdrop-filter: blur(10px);
  color: $text-dark;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);

  .logo {
    display: flex;
    align-items: center;
    
    .logo-img {
      height: 40px; // Adjust height for the long logo to look good
      width: auto;
      object-fit: contain;
      transition: filter 0.4s ease;
    }
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 3vw;

    .menu-toggle {
      background: transparent;
      border: none;
      color: $text-dark;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      transition: all 0.4s ease;

      i {
        font-size: 1.8rem;
      }

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  // Styles when menu is open
  &.menu-open {
    background: transparent;
    backdrop-filter: none;
    box-shadow: none;
    color: $white;

    .logo-img {
      filter: brightness(0) invert(1);
    }

    .nav-right .menu-toggle {
      color: $white;
    }
  }
}

.btn-solid {
  background: $yellow;
  color: $text-dark;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: scale(1.05);
  }
}

/* --- OVERLAY MENU --- */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: $green-dark;
  z-index: 100;
  transform: translateY(-100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .menu-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    transition: background-image 0.5s ease-in-out;
  }

  .menu-bg-overlay {
    position: absolute;
    inset: 0;
    background: rgba($green-dark, 0.85);
  }

  .menu-content {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 0 10vw;

    .menu-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2vh;

      .menu-item {
        overflow: hidden;

        .menu-item-link {
          display: inline-block;
          font-size: clamp(4rem, 8vw, 8rem);
          font-weight: 800;
          color: transparent;
          -webkit-text-stroke: 2px rgba($white, 0.5);
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          line-height: 1;

          &:hover {
            color: $yellow;
            -webkit-text-stroke: 0px transparent;
            transform: translateX(30px);
          }
        }
      }
    }
  }
}
</style>
