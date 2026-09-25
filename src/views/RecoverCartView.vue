<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import CartTrackingService from '@/services/CartTrackingService'

/**
 * Destino del link que viaja en el WhatsApp de carrito abandonado.
 *
 * Rearma el carrito tal como lo dejó el cliente y lo manda al checkout: la idea es que solo
 * tenga que confirmar. Visitar esta página es además lo que cuenta como "volvió desde el
 * mensaje" en las métricas, así que se entra aunque después el cliente no compre.
 */
const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const error = ref('')
const yaComprado = ref(false)

onMounted(async () => {
  const token = String(route.params.token || '')
  if (!token) {
    error.value = 'El enlace está incompleto.'
    return
  }

  try {
    const { data } = await CartTrackingService.recover(token)
    if (data.yaComprado) {
      yaComprado.value = true
      return
    }
    if (!data.items?.length) {
      error.value = 'Ese carrito ya no tiene productos.'
      return
    }

    // Se reemplaza el carrito, no se suma: el cliente espera encontrar lo que dejó, no el doble.
    cart.items = data.items.map((i) => ({
      productId: String(i.product || ''),
      slug: '',
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }))
    cart.persist()
    router.replace('/checkout')
  } catch {
    error.value = 'No pudimos recuperar tu carrito. Puede que el enlace ya haya vencido.'
  }
})
</script>

<template>
  <main class="recover">
    <section class="recover__card">
      <p class="recover__brand">BOLONCITY</p>
      <template v-if="yaComprado">
        <h1>¡Ya lo tenías pedido! 🎉</h1>
        <p>Este carrito terminó en un pedido. Si quieres otro, empieza desde el catálogo.</p>
        <RouterLink class="recover__cta" to="/catalogo">Ver el menú</RouterLink>
      </template>
      <template v-else-if="error">
        <h1>Ups 😅</h1>
        <p>{{ error }}</p>
        <RouterLink class="recover__cta" to="/catalogo">Ver el menú</RouterLink>
      </template>
      <template v-else>
        <h1>Recuperando tu carrito 🛒</h1>
        <p>Un segundito, ya te llevamos a terminar tu pedido...</p>
      </template>
    </section>
  </main>
</template>

<style scoped lang="scss">
.recover { align-items: center; background: #f8f6ec; display: flex; justify-content: center; min-height: 100vh; padding: 1rem; }
.recover__card { background: #fff; border-radius: 20px; box-shadow: 0 20px 48px rgba(0, 0, 0, .12); max-width: 440px; padding: 2rem; text-align: center; width: 100%; }
.recover__brand { color: #235931; font-size: .75rem; font-weight: 800; letter-spacing: .16em; margin: 0; }
h1 { color: #235931; margin: .6rem 0 1rem; }
.recover__cta { background: #235931; border-radius: 999px; color: #fff; display: inline-block; font-weight: 700; margin-top: 1.2rem; padding: .7rem 1.6rem; text-decoration: none; }
</style>
