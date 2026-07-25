<script setup lang="ts">
defineProps<{ loading: boolean; productCount: number }>()
const emit = defineEmits<{ create: [] }>()
</script>

<template>
  <header class="products-hero panel">
    <div>
      <p class="products-hero__eyebrow"><span /> Centro de catálogo</p>
      <h1>Tu menú, bajo control.</h1>
      <p>Edita disponibilidad, precios e imágenes sin perderte entre formularios.</p>
    </div>
    <div class="products-hero__actions">
      <span><i class="fa-solid fa-cloud" /> {{ loading ? 'Sincronizando...' : `${productCount} sincronizados` }}</span>
      <button type="button" @click="emit('create')"><i class="fa-solid fa-plus" /> Nuevo producto</button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.products-hero { align-items: flex-start; background: linear-gradient(145deg, #123822, #235931 58%, #2f7041); border: 0; box-shadow: 0 24px 60px rgba(35, 89, 49, .22); color: $white; display: flex; flex-direction: column; gap: 1rem; overflow: hidden; padding: clamp(1.25rem, 3vw, 2rem); position: relative; }
.products-hero::after { background: radial-gradient(circle, rgba(239, 213, 55, .18), transparent 64%); content: ''; height: 220px; position: absolute; right: -80px; top: -90px; width: 220px; }
.products-hero__eyebrow { align-items: center; color: rgba(255,255,255,.72); display: flex; font-size: .78rem; font-weight: 800; gap: .55rem; letter-spacing: .16em; text-transform: uppercase; }
.products-hero__eyebrow span { background: #efd537; border-radius: 50%; box-shadow: 0 0 0 5px rgba(239,213,55,.14); height: 8px; width: 8px; }
h1 { font-size: clamp(2rem, 4vw, 3.4rem); font-weight: 800; letter-spacing: -.05em; line-height: .95; margin-top: .35rem; }
p:not(.products-hero__eyebrow) { color: rgba(255,255,255,.7); margin-top: .75rem; max-width: 42rem; }
.products-hero__actions { display: flex; flex-direction: column; gap: .75rem; position: relative; width: 100%; z-index: 1; }
.products-hero__actions span { align-items: center; color: rgba(255,255,255,.72); display: inline-flex; font-size: .82rem; gap: .45rem; }
button { align-items: center; background: linear-gradient(135deg, #efd537, #f8e98a); border: 0; border-radius: 999px; color: #08110d; display: inline-flex; font-weight: 800; gap: .5rem; justify-content: center; min-height: 48px; padding: .85rem 1.2rem; }
@media (min-width: 769px) { .products-hero { align-items: flex-end; flex-direction: row; } .products-hero__actions { align-items: flex-end; flex: 0 0 auto; width: auto; } }
</style>
