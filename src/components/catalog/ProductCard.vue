<script setup lang="ts">
import type { ProductDTO } from '@/services/ProductService'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'

const props = defineProps<{ product: ProductDTO }>()
const cart = useCartStore()
const { success } = useToast()
const router = useRouter()

function addToCart() {
  cart.addItem({
    productId: props.product._id,
    slug: props.product.slug,
    name: props.product.name,
    price: props.product.price,
    quantity: 1,
    image: props.product.images[0]?.url,
  })
  success('Producto agregado al carrito')
}
</script>

<template>
  <article class="product-card">
    <button class="product-card__image" type="button" @click="router.push(`/producto/${product.slug}`)">
      <img :src="product.images[0]?.url || ''" :alt="product.name" />
      <span class="product-card__overlay">
        <span>Ver detalle</span>
      </span>
    </button>
    <div class="product-card__body">
      <p class="product-card__code">{{ product.code }}</p>
      <h3>{{ product.name }}</h3>
      <div class="product-card__meta">
        <strong>${{ product.price.toFixed(2) }}</strong>
        <span v-if="product.hasIva">IVA</span>
      </div>
      <button type="button" class="product-card__add" @click="addToCart">Agregar</button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-card {
  @include card-base;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 24px 48px rgba(26, 26, 26, 0.12);
    transform: translateY(-6px);
  }
}

.product-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  border: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
  background: rgba(26, 26, 26, 0.04);

  &:hover img {
    transform: scale(1.06);
  }

  &:hover .product-card__overlay {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.product-card__overlay {
  align-items: end;
  background: linear-gradient(180deg, rgba(26, 26, 26, 0.02) 0%, rgba(26, 26, 26, 0.65) 100%);
  color: #fff;
  display: flex;
  inset: 0;
  justify-content: start;
  opacity: 0;
  padding: 1rem;
  position: absolute;
  transition: opacity 0.35s ease;
}

.product-card__overlay span {
  @include pill-button(rgba(255, 255, 255, 0.16), #fff);
  min-height: 40px;
  padding: 0.6rem 0.9rem;
}

.product-card__body {
  display: grid;
  gap: 0.7rem;
  padding: 1.15rem;
}

h3 {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0;
}

.product-card__code {
  @include eyebrow;
  color: #00a523;
}

.product-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(26, 26, 26, 0.7);
  font-weight: 700;
}

.product-card__add {
  @include pill-button(#235931, #fff);
  width: 100%;
}

.product-card__add:hover {
  background: #00a523;
  box-shadow: 0 14px 24px rgba(35, 89, 49, 0.18);
}
</style>
