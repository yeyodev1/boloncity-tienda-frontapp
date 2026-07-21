<script setup lang="ts">
defineProps<{ deliveryType: 'delivery' | 'pickup' }>()
const emit = defineEmits<{ (e: 'update:deliveryType', v: 'delivery' | 'pickup'): void }>()
function toggle(v: 'delivery' | 'pickup') { emit('update:deliveryType', v) }
</script>

<template>
  <div class="checkout-form__toggle">
    <button type="button" class="checkout-form__toggle-btn" :class="{ active: deliveryType === 'delivery' }" @click="toggle('delivery')">
      <i class="fa-solid fa-motorcycle" /> <span>Delivery</span>
    </button>
    <button type="button" class="checkout-form__toggle-btn" :class="{ active: deliveryType === 'pickup' }" @click="toggle('pickup')">
      <i class="fa-solid fa-store" /> <span>Recoger</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.checkout-form__toggle {
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  display: flex;
  gap: 0.25rem;
  padding: 0.3rem;
}

.checkout-form__toggle-btn {
  align-items: center;
  border-radius: 999px;
  display: flex;
  flex: 1 1 0;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 46px;
  padding: 0.65rem 1rem;
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.checkout-form__toggle-btn.active {
  background: #235931;
  box-shadow: 0 8px 20px rgba(35, 89, 49, 0.18);
  color: #fff;
}

.checkout-form__toggle-btn:not(.active) { background: transparent; color: rgba(8, 17, 13, 0.6); }
.checkout-form__toggle-btn:not(.active):hover { color: #235931; }
</style>
