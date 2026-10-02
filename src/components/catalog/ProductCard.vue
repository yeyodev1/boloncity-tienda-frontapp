<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductDTO } from '@/services/ProductService'
import { useSettingsStore } from '@/stores/settings'
import { displayDescription, displayProductName, isCustomerCategory } from '@/utils/productName'

const props = defineProps<{ product: ProductDTO }>()
const emit = defineEmits<{ (event: 'open'): void }>()

const imageLoaded = ref(false)
// Una imagen rota o borrada no deja un hueco gris: se muestra el plato de respaldo.
const imageFailed = ref(false)
const imageUrl = computed(() => (imageFailed.value ? '' : props.product.images[0]?.url || ''))

// Promo global: el precio tachado es el de catálogo y el grande, el que se cobra.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const finalPrice = computed(() => settings.promoPrice(props.product.price))
// La categoría del cliente ("Bolones clásicos"), nunca un grupo interno del POS ("Cocina", "Caja").
const categoryLabel = computed(() => (props.product.categories || []).filter(isCustomerCategory).slice(-1)[0]?.name || '')
const money = (value: number) => `$${value.toFixed(2)}`
const name = computed(() => displayProductName(props.product.name))
const category = computed(() => displayProductName(categoryLabel.value))
const description = computed(() => displayDescription(props.product.description))
</script>

<template>
  <article
    class="product-card"
    tabindex="0"
    role="button"
    :aria-label="`Ver ${name}, ${money(finalPrice)}`"
    @click="emit('open')"
    @keydown.enter.prevent="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <div class="product-card__media">
      <div v-if="imageUrl && !imageLoaded" class="product-card__shimmer" />
      <img
        v-if="imageUrl"
        :class="{ 'is-loaded': imageLoaded }"
        :src="imageUrl"
        :alt="product.name"
        loading="lazy"
        decoding="async"
        @load="imageLoaded = true"
        @error="imageFailed = true"
      />
      <div v-else class="product-card__fallback" aria-hidden="true">
        <i class="fa-solid fa-utensils" />
      </div>

      <span v-if="product.isBestSeller" class="product-card__badge"><i class="fa-solid fa-fire" /> Favorito</span>
      <span v-else-if="promo.active" class="product-card__badge product-card__badge--promo">-{{ promo.percent }}%</span>

      <span class="product-card__tag">
        <small v-if="promo.active">{{ money(product.price) }}</small>
        <strong>{{ money(finalPrice) }}</strong>
      </span>
    </div>

    <div class="product-card__body">
      <p v-if="category" class="product-card__category">{{ category }}</p>
      <h3>{{ name }}</h3>
      <p v-if="description" class="product-card__description">{{ description }}</p>

      <button
        class="product-card__add"
        type="button"
        :aria-label="`Agregar ${name}`"
        @click.stop="emit('open')"
      >
        <i class="fa-solid fa-plus" />
        <span>Agregar</span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-card {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.06);
  border-radius: 22px;
  box-shadow: 0 1px 2px rgba(16, 39, 25, 0.04), 0 10px 24px -14px rgba(16, 39, 25, 0.18);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  padding: 0.45rem;
  position: relative;
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s ease, border-color 0.22s ease;
  -webkit-tap-highlight-color: transparent;
}

.product-card:hover {
  border-color: rgba(35, 89, 49, 0.16);
  box-shadow: 0 1px 2px rgba(16, 39, 25, 0.05), 0 22px 40px -18px rgba(35, 89, 49, 0.35);
  transform: translateY(-3px);
}

.product-card:active {
  transform: scale(0.985);
}

.product-card:focus-visible {
  box-shadow: 0 0 0 3px rgba(239, 213, 55, 0.9), 0 0 0 5px #235931;
  outline: none;
}

/* ─── Foto ─────────────────────────────────────────────────────────────── */
.product-card__media {
  aspect-ratio: 1 / 1;
  background: #eef2e8;
  border-radius: 17px;
  overflow: hidden;
  position: relative;
}

.product-card__media img {
  display: block;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  width: 100%;
}

.product-card__media img.is-loaded { opacity: 1; }
.product-card:hover .product-card__media img.is-loaded { transform: scale(1.05); }

.product-card__shimmer {
  animation: card-shimmer 1.3s ease infinite;
  background: linear-gradient(100deg, #e6ece0 30%, #f6f1d6 50%, #e6ece0 70%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.product-card__fallback {
  align-items: center;
  background:
    radial-gradient(circle at 50% 50%, #fff 0 34%, transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(35, 89, 49, 0.08) 0 46%, transparent 47%),
    linear-gradient(145deg, #e3ebdc, #f4ecbf);
  color: rgba(35, 89, 49, 0.55);
  display: flex;
  font-size: 1.6rem;
  height: 100%;
  justify-content: center;
}

.product-card__badge {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(16, 39, 25, 0.12);
  color: #235931;
  display: inline-flex;
  font-size: 0.66rem;
  font-weight: 800;
  gap: 0.3rem;
  left: 0.5rem;
  letter-spacing: 0.02em;
  line-height: 1;
  padding: 0.38rem 0.55rem;
  position: absolute;
  top: 0.5rem;
}

.product-card__badge i { color: #e46a1b; }
.product-card__badge--promo { background: #a52323; color: #fff; }

/* Firma: la etiqueta de precio pegada sobre el plato, como en el mercado. */
.product-card__tag {
  align-items: baseline;
  background: #efd537;
  border-radius: 10px 10px 10px 3px;
  bottom: 0.55rem;
  box-shadow: 0 6px 14px -4px rgba(16, 39, 25, 0.35);
  color: #102719;
  display: inline-flex;
  gap: 0.3rem;
  left: 0.55rem;
  padding: 0.32rem 0.6rem 0.36rem;
  position: absolute;
  transform: rotate(-3deg);
  transform-origin: left bottom;
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.product-card:hover .product-card__tag { transform: rotate(0deg) translateY(-2px); }

.product-card__tag strong {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.product-card__tag small {
  color: rgba(16, 39, 25, 0.55);
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: line-through;
}

/* ─── Texto ────────────────────────────────────────────────────────────── */
.product-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  padding: 0.7rem 0.35rem 0.3rem;
  position: relative;
}

.product-card__category {
  color: #00a523;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.product-card h3 {
  color: #102719;
  display: -webkit-box;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0.2rem 0 0;
  overflow: hidden;
  padding-right: 2.6rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card__description {
  color: rgba(16, 39, 25, 0.55);
  display: none;
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 0.35rem 0 0;
  overflow: hidden;
  padding-right: 2.6rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card__add {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  bottom: 0.25rem;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 0.4rem;
  height: 36px;
  justify-content: center;
  position: absolute;
  right: 0.2rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  width: 36px;
}

.product-card__add span { display: none; }
.product-card__add:hover { background: #00a523; }
.product-card__add:active { transform: scale(0.92); }

@media (min-width: 641px) {
  .product-card { padding: 0.55rem; }
  .product-card__media { aspect-ratio: 5 / 4; }
  .product-card__body { padding: 0.85rem 0.45rem 0.4rem; }
  .product-card h3 { font-size: 1.05rem; padding-right: 0; }
  .product-card__description { display: -webkit-box; padding-right: 0; }
  .product-card__tag strong { font-size: 1.15rem; }

  .product-card__body { padding-bottom: 3.4rem; }

  .product-card__add {
    bottom: 0.45rem;
    height: 42px;
    left: 0.45rem;
    right: 0.45rem;
    width: auto;
  }

  .product-card__add span { display: inline; }
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .product-card__media img,
  .product-card__tag,
  .product-card__add { transition: none; }
  .product-card:hover,
  .product-card:active { transform: none; }
  .product-card:hover .product-card__media img.is-loaded { transform: none; }
  .product-card:hover .product-card__tag { transform: rotate(-3deg); }
  .product-card__shimmer { animation: none; }
}

@keyframes card-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
