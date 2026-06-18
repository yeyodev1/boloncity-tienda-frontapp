<script setup lang="ts">
import { onMounted } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import logoImg from '../assets/logos/logo.png';

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
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
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
    justify-content: space-between;
    align-items: center;
    padding: 2vw 4vw;
    border-top: 1px solid rgba($white, 0.1);
    color: rgba($white, 0.5);
    font-size: 0.9rem;
    position: relative;
    z-index: 2;

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

@media (max-width: 768px) {
  .footer .footer-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  .footer .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
