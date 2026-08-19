<script setup lang="ts">
defineProps<{
  pointsToEarn: number
  balance: { points: number; discountCents: number } | null
  balanceLoading: boolean
  discount: number
}>()

const useMyPoints = defineModel<boolean>('useMyPoints', { required: true })
</script>

<template>
  <aside class="checkout-points">
    <p v-if="pointsToEarn > 0" class="checkout-points__earn">
      <i class="fa-solid fa-star" /> Con esta compra ganarás <b>{{ pointsToEarn }} puntos</b>.
    </p>
    <p v-if="balanceLoading" class="checkout-points__hint">Buscando tus puntos...</p>
    <label v-else-if="balance" class="checkout-points__redeem">
      <input type="checkbox" v-model="useMyPoints" />
      <span>
        Usar mis <b>{{ balance.points }} puntos</b>
        (descuento de <b>${{ (balance.discountCents / 100).toFixed(2) }}</b>)
      </span>
    </label>
    <p v-if="useMyPoints && discount > 0" class="checkout-points__hint">
      Se descontará ${{ discount.toFixed(2) }} del total al confirmar el pedido.
    </p>
  </aside>
</template>

<style scoped lang="scss">
.checkout-points {
  background: #e9f7ec;
  border: 1px solid rgba(0, 165, 35, 0.35);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.9rem 1rem;
}

.checkout-points__earn {
  align-items: center;
  color: #14682a;
  display: flex;
  font-weight: 700;
  gap: 0.5rem;

  i {
    color: #efd537;
  }
}

.checkout-points__redeem {
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 0.6rem;

  input {
    accent-color: #235931;
    height: 20px;
    width: 20px;
  }
}

.checkout-points__hint {
  color: #4c6b53;
  font-size: 0.85rem;
}
</style>
