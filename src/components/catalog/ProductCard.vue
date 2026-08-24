<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductDTO } from '@/services/ProductService'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{ product: ProductDTO }>()
const emit = defineEmits<{ (event: 'open'): void }>()
const imageLoaded = ref(false)
// Promo global: el precio tachado es el de catálogo y el grande, el que se cobra.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const promoPrice = computed(() => settings.promoPrice(props.product.price))
const categoryLabel = computed(() => props.product.categories?.[1]?.name || props.product.categories?.[0]?.name || 'Boloncity')
</script>

<template>
  <article class="product-card" tabindex="0" role="button" :aria-label="`Ver ${product.name}`" @click="emit('open')" @keydown.enter="emit('open')">
    <div class="product-card__media">
      <div v-if="product.images[0]?.url && !imageLoaded" class="product-card__skeleton" />
      <img v-if="product.images[0]?.url" :class="{ 'is-loaded': imageLoaded }" :src="product.images[0].url" :alt="product.name" loading="lazy" @load="imageLoaded = true" />
      <span v-else class="product-card__placeholder"><i class="fa-solid fa-utensils" /></span>
      <span class="product-card__category">{{ categoryLabel }}</span>
      <span v-if="promo.active" class="product-card__promo">-{{ promo.percent }}%</span>
      <span class="product-card__view"><i class="fa-solid fa-eye" /> Ver detalle</span>
    </div>

    <div class="product-card__body">
      <p class="product-card__code">{{ product.code }}</p>
      <h3>{{ product.name }}</h3>
      <p class="product-card__description">{{ product.description || 'Producto disponible en nuestro menú.' }}</p>

      <footer>
        <span v-if="promo.active" class="product-card__prices">
          <small>${{ product.price.toFixed(2) }}</small>
          <strong>${{ promoPrice.toFixed(2) }}</strong>
        </span>
        <strong v-else>${{ product.price.toFixed(2) }}</strong>
        <button type="button" :aria-label="`Elegir cantidad de ${product.name}`" @click.stop="emit('open')">
          <i class="fa-solid fa-cart-plus" /> Agregar
        </button>
      </footer>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-card {
  background: #fff;
  border: 1px solid rgba(26, 26, 26, 0.07);
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(28, 22, 12, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.product-card:hover,
.product-card:focus-visible {
  border-color: rgba(35, 89, 49, 0.22);
  box-shadow: 0 20px 38px rgba(35, 89, 49, 0.13);
  outline: none;
  transform: translateY(-5px);
}

.product-card__media {
  aspect-ratio: 4 / 3;
  background: #edf1e7;
  overflow: hidden;
  position: relative;
}

.product-card__media img {
  display: block;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.5s ease;
  width: 100%;
}

.product-card__media img.is-loaded {
  opacity: 1;
}

.product-card:hover .product-card__media img.is-loaded {
  transform: scale(1.04);
}

.product-card__skeleton {
  animation: card-shimmer 1.2s ease infinite;
  background: linear-gradient(100deg, #dfe8df 25%, #f5f0d8 45%, #dfe8df 65%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.product-card__placeholder {
  align-items: center;
  background: linear-gradient(145deg, #dfe8d9, #f3e66e);
  color: #235931;
  display: flex;
  font-size: 2rem;
  height: 100%;
  justify-content: center;
}

.product-card__category,
.product-card__view {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 900;
  gap: 0.35rem;
  line-height: 1;
  position: absolute;
  text-transform: uppercase;
}

.product-card__category {
  background: rgba(35, 89, 49, 0.92);
  bottom: 0.7rem;
  color: #efd537;
  left: 0.7rem;
  max-width: calc(100% - 1.4rem);
  overflow: hidden;
  padding: 0.45rem 0.65rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card__promo {
  align-items: center;
  background: #a52323;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 900;
  left: 0.7rem;
  line-height: 1;
  padding: 0.4rem 0.6rem;
  position: absolute;
  top: 0.7rem;
}

.product-card__prices { align-items: baseline; display: flex; gap: 0.4rem; }
.product-card__prices small { color: rgba(26, 26, 26, 0.45); font-size: 0.85rem; text-decoration: line-through; }
.product-card__prices strong { color: #a52323; }

.product-card__view {
  background: rgba(255, 255, 255, 0.94);
  color: #235931;
  opacity: 0;
  padding: 0.5rem 0.7rem;
  right: 0.7rem;
  top: 0.7rem;
  transform: translateY(-5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.product-card:hover .product-card__view,
.product-card:focus-visible .product-card__view {
  opacity: 1;
  transform: translateY(0);
}

.product-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 1rem;
}

.product-card__code {
  color: #00a523;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.product-card h3 {
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.15;
  margin-top: 0.35rem;
  overflow-wrap: anywhere;
}

.product-card__description {
  color: rgba(26, 26, 26, 0.56);
  display: -webkit-box;
  font-size: 0.82rem;
  line-height: 1.45;
  margin-top: 0.55rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card footer {
  align-items: center;
  border-top: 1px solid rgba(26, 26, 26, 0.07);
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.9rem;
}

.product-card footer > strong {
  color: #102719;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.product-card footer button {
  align-items: center;
  background: #efd537;
  border-radius: 12px;
  color: #102719;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.65rem 0.8rem;
}

.product-card footer button:hover {
  background: #f7e66b;
}

@keyframes card-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
