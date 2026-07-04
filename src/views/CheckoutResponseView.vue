<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderService from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const status = ref('Procesando...')
const phase = ref<'loading' | 'success' | 'error'>('loading')
const { success, error } = useToast()
const cart = useCartStore()

onMounted(async () => {
  const id = Number(route.query.id)
  const clientTxId = String(route.query.clientTransactionId || '')

  if (!id || !clientTxId) {
    status.value = 'Respuesta incompleta.'
    phase.value = 'error'
    error('PayPhone no retorno parametros completos')
    return
  }

  try {
    const response = await OrderService.confirm(id, clientTxId)
    status.value = 'Pago confirmado correctamente.'
    phase.value = 'success'
    cart.clear()
    success('Pago confirmado')
    window.setTimeout(() => router.push('/pedido'), 1500)
    return response
  } catch {
    status.value = 'No se pudo confirmar el pago.'
    phase.value = 'error'
    error('Error al confirmar el pago')
  }
})
</script>

<template>
  <section class="page page--center response-page">
    <div class="panel response-card" :class="phase">
      <div v-if="phase === 'loading'" class="response-card__mark response-card__mark--loading" />
      <div v-else-if="phase === 'success'" class="response-card__mark response-card__mark--success">✓</div>
      <div v-else class="response-card__mark response-card__mark--error">!</div>

      <p class="response-card__eyebrow">Pago</p>
      <h1>Confirmando transacción</h1>
      <p class="muted">{{ status }}</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.response-page {
  background: linear-gradient(180deg, rgba(35, 89, 49, 0.04), rgba(255, 255, 255, 0));
}

.response-card {
  display: grid;
  gap: 0.9rem;
  max-width: 460px;
  padding: 2.25rem 1.5rem;
  text-align: center;
}

.response-card__eyebrow {
  @include eyebrow;
  color: #00a523;
}

.response-card h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  text-transform: uppercase;
}

.response-card__mark {
  align-items: center;
  border-radius: 50%;
  display: grid;
  height: 76px;
  justify-self: center;
  place-items: center;
  width: 76px;
}

.response-card__mark--loading {
  border: 4px solid rgba(35, 89, 49, 0.12);
  border-top-color: #235931;
  animation: spin 0.8s linear infinite;
}

.response-card__mark--success {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
  font-size: 2rem;
  font-weight: 800;
}

.response-card__mark--error {
  background: rgba(160, 40, 40, 0.08);
  color: #a02828;
  font-size: 2rem;
  font-weight: 800;
}

.success {
  border-color: rgba(35, 89, 49, 0.15);
}

.error {
  border-color: rgba(160, 40, 40, 0.15);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
