<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';
import { useMouse } from '@vueuse/core';
import cursorImg from '../assets/cursor/cursor.png';

const cursor = ref<HTMLElement | null>(null);
const cursorIcon = ref<HTMLElement | null>(null);
const cursorActive = ref(false);

const { x, y } = useMouse({ type: 'client' });

const updateCursor = () => {
  if (cursor.value) {
    gsap.to(cursor.value, {
      x: x.value,
      y: y.value,
      xPercent: -50,
      yPercent: -50,
      duration: 0.15,
      ease: 'power2.out'
    });
  }
};

const handleMouseOver = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('a, button, .hover-target, [role="button"]')) {
    cursorActive.value = true;
    if (cursorIcon.value) {
      gsap.to(cursorIcon.value, { scale: 1.5, rotation: 15, duration: 0.3, ease: 'back.out(1.7)' });
    }
  }
};

const handleMouseOut = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('a, button, .hover-target, [role="button"]')) {
    cursorActive.value = false;
    if (cursorIcon.value) {
      gsap.to(cursorIcon.value, { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out' });
    }
  }
};

onMounted(() => {
  window.addEventListener('mousemove', updateCursor);
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', updateCursor);
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
});
</script>

<template>
  <Teleport to="body">
    <div ref="cursor" class="custom-cursor-wrapper">
      <img :src="cursorImg" class="cursor-img" ref="cursorIcon" alt="" />
      <div class="cursor-glow" :class="{ 'active': cursorActive }"></div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
$yellow: #efd537;

.custom-cursor-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 2147483647 !important; // Max z-index
  display: flex;
  align-items: center;
  justify-content: center;

  .cursor-img {
    width: 45px;
    height: auto;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
    transform-origin: center center;
  }

  .cursor-glow {
    position: absolute;
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba($yellow, 0.8) 0%, rgba($yellow, 0) 70%);
    border-radius: 50%;
    z-index: 1;
    opacity: 0.5;
    transform: scale(1);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;

    &.active {
      transform: scale(2.5);
      opacity: 0.9;
      background: radial-gradient(circle, rgba($yellow, 1) 0%, rgba($yellow, 0) 70%);
    }
  }
}
</style>
