<script setup lang="ts">
import { onMounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// Versión para fondo oscuro: 'CITY' en blanco (la original es verde oscuro y se perdía sobre el verde del footer).
import logoImg from '../assets/logos/logo-light.png';

gsap.registerPlugin(ScrollTrigger);

onMounted(() => {
  gsap.fromTo('.big-footer-text',
    { y: 150, opacity: 0 },
    {
      y: 0, 
      opacity: 1, 
      duration: 1.2, 
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top 70%',
      }
    }
  );
});
</script>

<template>
  <footer class="footer section-dark" id="contacto">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img :src="logoImg" alt="Boloncity Logo" class="logo-img" />
        <h3>La Metrópolis del Sabor</h3>
        <p>"Vas a querer vivir aquí"</p>
      </div>
      <div class="footer-links">
        <h4>Navegación</h4>
        <ul>
          <li><a href="#inicio" class="hover-target">Inicio</a></li>
          <li><a href="#menu" class="hover-target">Monumentos</a></li>
          <li><a href="#nosotros" class="hover-target">Comunidad</a></li>
        </ul>
      </div>
      <div class="footer-social">
        <h4>Social</h4>
        <ul>
          <li><a href="#" class="hover-target"><i class="fa-brands fa-instagram"></i> Instagram</a></li>
          <li><a href="#" class="hover-target"><i class="fa-brands fa-tiktok"></i> TikTok</a></li>
          <li><a href="#" class="hover-target"><i class="fa-brands fa-facebook-f"></i> Facebook</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-massive-text">
      <h2 class="big-footer-text">BOLONCITY</h2>
    </div>

    <div class="footer-bottom">
      <p>© 2016 - 2026 Boloncity. Todos los derechos reservados por la Alcaldía del Sabor.</p>
      <p class="footer-credits">
        <span class="footer-credits__label">Creado por</span>
        <a href="https://yeyo.dev" target="_blank" rel="noopener" class="footer-credits__link hover-target">
          yeyo.dev <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </a>
        <span class="footer-credits__x" aria-hidden="true">×</span>
        <a href="https://bakano.ec" target="_blank" rel="noopener" class="footer-credits__link hover-target">
          bakano.ec <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
        </a>
      </p>
      <div class="footer-legal">
        <a href="#" class="hover-target">Términos</a>
        <a href="#" class="hover-target">Privacidad</a>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
$yellow: #efd537;
$green-dark: #235931;
$white: #FFFFFF;
$text-dark: #1A1A1A;

.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 4vw;
}

.footer {
  background-color: $green-dark;
  color: $white;
  padding-top: 8vw;
  margin-top: 0;
  position: relative;
  overflow: hidden;

  .footer-grid {
    display: flex;
    flex-direction: column;
    gap: 4vw;
    margin-bottom: 6vw;
    position: relative;
    z-index: 2;

    .logo-img {
      height: 60px;
      width: auto;
      object-fit: contain;
      margin-bottom: 1.5rem;
    }

    h3 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      color: $white;
    }

    p { 
      color: rgba($white, 0.7); 
      font-size: 1.2rem;
    }

    h4 {
      font-size: 1.2rem;
      color: $yellow;
      margin-bottom: 1.5rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 1rem;
        a {
          color: $white;
          text-decoration: none;
          font-size: 1.1rem;
          font-weight: 500;
          transition: color 0.3s ease, transform 0.3s ease;
          display: inline-block;

          &:hover { 
            color: $yellow; 
            transform: translateX(10px);
          }
        }
      }
    }
  }

  .footer-massive-text {
    width: 100%;
    text-align: center;
    line-height: 0.8;
    overflow: hidden;
    padding-bottom: 2vw;

    .big-footer-text {
      font-size: 18vw;
      font-weight: 800;
      color: transparent;
      -webkit-text-stroke: 2px rgba($white, 0.1);
      margin: 0;
      text-transform: uppercase;
      transition: color 0.5s ease;

      &:hover {
        color: $white;
        -webkit-text-stroke: 0px transparent;
      }
    }
  }

  .footer-bottom {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    padding: 2vw 4vw;
    border-top: 1px solid rgba($white, 0.1);
    color: rgba($white, 0.5);
    font-size: 0.9rem;
    position: relative;
    text-align: center;
    z-index: 2;

    .footer-credits {
      align-items: center;
      background: rgba($white, 0.06);
      border: 1px solid rgba($white, 0.14);
      border-radius: 999px;
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.35rem 0.55rem;
      justify-content: center;
      margin: 0;
      padding: 0.45rem 0.6rem 0.45rem 1rem;
    }

    .footer-credits__label {
      color: rgba($white, 0.55);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .footer-credits__link {
      align-items: center;
      border-radius: 999px;
      color: $white;
      display: inline-flex;
      font-size: 0.92rem;
      font-weight: 800;
      gap: 0.4rem;
      letter-spacing: -0.01em;
      padding: 0.3rem 0.7rem;
      text-decoration: none;
      transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;

      i {
        font-size: 0.65rem;
        opacity: 0.55;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }

      &:hover,
      &:focus-visible {
        background: $yellow;
        color: $green-dark;

        i { opacity: 1; transform: translate(1px, -1px); }
      }

      &:focus-visible { outline: 2px solid $yellow; outline-offset: 2px; }
    }

    .footer-credits__x {
      color: $yellow;
      font-weight: 800;
    }

    /* Celular: la firma entra en una sola línea. */
    @media (max-width: 768px) {
      .footer-credits { flex-wrap: nowrap; gap: 0.2rem; padding: 0.35rem 0.4rem 0.35rem 0.8rem; }
      .footer-credits__label { font-size: 0.6rem; letter-spacing: 0.12em; white-space: nowrap; }
      .footer-credits__link { font-size: 0.85rem; padding: 0.3rem 0.5rem; white-space: nowrap; }
      .footer-credits__link i { display: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .footer-credits__link,
      .footer-credits__link i { transition: none; }
    }

    .footer-legal {
      display: flex;
      gap: 2rem;

      a {
        color: rgba($white, 0.5);
        text-decoration: none;
        transition: color 0.3s ease;

        &:hover { color: $white; }
      }
    }
  }
}

@media (min-width: 769px) {
  .footer .footer-grid {
    flex-direction: row;
  }

  .footer .footer-bottom {
    flex-direction: row;
    text-align: left;
  }

  .footer .footer-grid > *:first-child {
    flex: 2 1 0;
  }

  .footer .footer-grid > *:not(:first-child) {
    flex: 1 1 0;
  }
}
</style>
