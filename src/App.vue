<script setup lang="ts">
import { gsap } from 'gsap';

const onLeave = (el: Element, done: () => void) => {
  gsap.to('.global-curtain', {
    y: '0%',
    duration: 1.0,
    ease: 'expo.inOut',
    onComplete: done
  });
};

const onEnter = (el: Element, done: () => void) => {
  // Reveal the new page by sliding curtain out
  gsap.fromTo('.global-curtain', 
    { y: '0%' },
    {
      y: '100%',
      duration: 1.0,
      delay: 0.3, // Hold the curtain on screen slightly before it goes down
      ease: 'expo.inOut',
      onComplete: () => {
        gsap.set('.global-curtain', { y: '-100%' }); // reset for next time
        done();
      }
    }
  );
  
  // Slide up the new content
  gsap.fromTo(el, 
    { y: 50, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, delay: 0.8, ease: 'power3.out' }
  );
};
</script>

<template>
  <div class="app-container">
    <div class="global-curtain">
      <div class="curtain-logo">BOLONCITY</div>
    </div>
    <RouterView v-slot="{ Component }">
      <transition 
        @enter="onEnter" 
        @leave="onLeave" 
        :css="false" 
        mode="out-in"
      >
        <component :is="Component" />
      </transition>
    </RouterView>
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.global-curtain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #efd537; // Metropolitan Yellow
  z-index: 99999;
  transform: translateY(-100%);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;

  .curtain-logo {
    font-family: 'Switzer', sans-serif;
    font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 800;
    color: #235931; // Green regeneration
    text-transform: uppercase;
  }
}
</style>
