<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

const props = defineProps<{
  order: OrderDTO | null
}>()

// El backend guarda scheduledFor en UTC; Ecuador es UTC-5 fijo.
const scheduledLabel = computed(() => {
  const iso = props.order?.scheduledFor
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
})
</script>

<template>
  <Transition name="success-pop">
    <div v-if="order" class="success-overlay">
      <section class="cash-success">
        <span class="cash-success__icon"><i class="fa-solid fa-circle-check" /></span>
        <p class="cash-success__order">Pedido {{ order.orderNumber }}</p>
        <h2>{{ order.scheduledFor ? '¡Pedido programado!' : '¡Pedido recibido!' }}</h2>
        <p v-if="order.scheduledFor" class="cash-success__scheduled">
          <i class="fa-solid fa-calendar-check" /> Para {{ scheduledLabel }}
        </p>
        <p class="cash-success__note">
          {{ order.deliveryType === 'pickup'
            ? 'Pagas en efectivo en el local al retirar tu pedido.'
            : 'Pagas en efectivo al motorizado cuando recibas tu pedido.' }}
        </p>
        <div class="cash-success__where">
          <p v-if="order.customerEmail">
            <i class="fa-solid fa-envelope" />
            <span>Te enviamos la confirmación a <b>{{ order.customerEmail }}</b></span>
          </p>
          <p>
            <i class="fa-solid fa-location-arrow" />
            <span>Sigue el estado de tu pedido en cualquier momento con el botón de abajo.</span>
          </p>
        </div>
        <a href="/pedido" class="btn-primary">Seguir mi pedido</a>
      </section>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.success-overlay {
  align-items: center;
  background: rgba(8, 17, 13, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.cash-success { align-items: center; background: #fff; border-radius: 28px; box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; gap: 0.8rem; max-width: 420px; padding: 2.2rem 1.6rem; text-align: center; width: 100%; }
.cash-success__icon { align-items: center; background: rgba(0, 165, 35, 0.12); border-radius: 50%; color: #00a523; display: flex; font-size: 2rem; height: 72px; justify-content: center; width: 72px; }
.cash-success__order { background: rgba(35, 89, 49, 0.08); border-radius: 999px; color: #235931; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; padding: 0.35rem 0.9rem; text-transform: uppercase; }
.cash-success h2 { font-size: 1.5rem; letter-spacing: -0.03em; }
.cash-success__scheduled { align-items: center; background: #fff8d6; border: 1px solid rgba(239, 213, 55, 0.6); border-radius: 12px; color: #6a4e05; display: flex; font-size: 0.85rem; font-weight: 700; gap: 0.45rem; padding: 0.55rem 0.9rem; }
.cash-success__note { color: rgba(8, 17, 13, 0.65); line-height: 1.5; }

.cash-success__where {
  background: rgba(35, 89, 49, 0.05);
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.85rem 1rem;
  text-align: left;
  width: 100%;
}

.cash-success__where p { align-items: flex-start; color: rgba(8, 17, 13, 0.72); display: flex; font-size: 0.82rem; gap: 0.55rem; line-height: 1.45; }
.cash-success__where i { color: #235931; margin-top: 0.15rem; }
.cash-success__where b { word-break: break-all; }
.cash-success a { margin-top: 0.4rem; padding: 0.8rem 1.4rem; text-decoration: none; }

.success-pop-enter-active,
.success-pop-leave-active { transition: opacity 0.3s ease; }
.success-pop-enter-active .cash-success { transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.success-pop-leave-active .cash-success { transition: opacity 0.25s ease, transform 0.25s ease; }
.success-pop-enter-from,
.success-pop-leave-to { opacity: 0; }
.success-pop-enter-from .cash-success { opacity: 0; transform: translateY(28px) scale(0.94); }
.success-pop-leave-to .cash-success { opacity: 0; transform: translateY(12px) scale(0.97); }
</style>
