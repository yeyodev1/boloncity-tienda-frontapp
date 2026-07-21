<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  showBilling: boolean
  billingDocType: 'cedula' | 'ruc'
  billingName: string
  billingDocNumber: string
  billingEmail: string
  billingAddress: string
}>()

const emit = defineEmits<{
  (e: 'update:showBilling', v: boolean): void
  (e: 'update:billingDocType', v: 'cedula' | 'ruc'): void
  (e: 'update:billingName', v: string): void
  (e: 'update:billingDocNumber', v: string): void
  (e: 'update:billingEmail', v: string): void
  (e: 'update:billingAddress', v: string): void
}>()

const isRuc = computed(() => props.billingDocType === 'ruc')
</script>

<template>
  <div class="checkout-billing">
    <button type="button" class="checkout-billing__toggle" @click="emit('update:showBilling', !showBilling)">
      <span><i class="fa-solid fa-file-invoice" /> Datos de facturación</span>
      <i class="fa-solid" :class="showBilling ? 'fa-chevron-up' : 'fa-chevron-down'" />
    </button>

    <Transition name="billing-fade">
      <div v-if="showBilling" class="checkout-billing__form">
        <div class="checkout-billing__doc-type">
          <button type="button" class="checkout-billing__doc-btn" :class="{ active: billingDocType === 'cedula' }" @click="emit('update:billingDocType', 'cedula')">
            <i class="fa-solid fa-id-card" /> Cédula
          </button>
          <button type="button" class="checkout-billing__doc-btn" :class="{ active: isRuc }" @click="emit('update:billingDocType', 'ruc')">
            <i class="fa-solid fa-building" /> RUC
          </button>
        </div>

        <div class="checkout-form__row">
          <label class="checkout-field checkout-field--half">
            <span class="checkout-field__label">Nombres</span>
            <input class="checkout-field__input" :value="billingName" @input="emit('update:billingName', ($event.target as HTMLInputElement).value)" placeholder="Nombres completos" />
          </label>
          <label class="checkout-field checkout-field--half">
            <span class="checkout-field__label">{{ isRuc ? 'RUC' : 'Cédula' }}</span>
            <input class="checkout-field__input" :value="billingDocNumber" @input="emit('update:billingDocNumber', ($event.target as HTMLInputElement).value)" :placeholder="isRuc ? '0000000000001' : '0000000000'" maxlength="13" />
          </label>
        </div>

        <label class="checkout-field">
          <span class="checkout-field__label">Correo electrónico</span>
          <input class="checkout-field__input" :value="billingEmail" @input="emit('update:billingEmail', ($event.target as HTMLInputElement).value)" type="email" placeholder="factura@email.com" />
        </label>

        <label class="checkout-field">
          <span class="checkout-field__label">Dirección</span>
          <input class="checkout-field__input" :value="billingAddress" @input="emit('update:billingAddress', ($event.target as HTMLInputElement).value)" placeholder="Dirección fiscal" />
        </label>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.checkout-billing { margin: 1rem 0 0; }

.checkout-billing__toggle {
  align-items: center;
  background: rgba(35, 89, 49, 0.04);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 14px;
  color: #235931;
  cursor: pointer;
  display: flex;
  font-size: 0.85rem;
  font-weight: 700;
  gap: 0.6rem;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  width: 100%;
}

.checkout-billing__toggle:hover { background: rgba(35, 89, 49, 0.08); border-color: rgba(35, 89, 49, 0.2); }
.checkout-billing__toggle span i { margin-right: 0.5rem; }

.checkout-billing__form {
  background: rgba(35, 89, 49, 0.02);
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 14px;
  margin-top: 0.6rem;
  padding: 1rem;
}

.checkout-billing__doc-type { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }

.checkout-billing__doc-btn {
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(26, 26, 26, 0.1);
  border-radius: 10px;
  color: #555;
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  justify-content: center;
  padding: 0.65rem;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.checkout-billing__doc-btn.active { background: #235931; border-color: #235931; color: #fff; }
.checkout-billing__doc-btn:hover:not(.active) { background: rgba(35, 89, 49, 0.06); border-color: rgba(35, 89, 49, 0.3); }

.billing-fade-enter-active,
.billing-fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.billing-fade-enter-from,
.billing-fade-leave-to { opacity: 0; transform: translateY(-8px); }

.checkout-form__row { display: flex; gap: 0.75rem; }

.checkout-field {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.1);
  border-radius: 22px;
  box-shadow: 0 10px 24px rgba(8, 17, 13, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  padding: 1rem 1.05rem 1.1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.checkout-field:focus-within { border-color: rgba(35, 89, 49, 0.35); box-shadow: 0 18px 40px rgba(35, 89, 49, 0.12); transform: translateY(-2px); }
.checkout-field--half { flex: 1 1 0; }

.checkout-field__label { align-items: center; color: rgba(8, 17, 13, 0.62); display: flex; font-size: 0.78rem; font-weight: 900; gap: 0.45rem; letter-spacing: 0.12em; text-transform: uppercase; }
.checkout-field__input { background: transparent; border: 0; border-radius: 0; box-shadow: none; color: #08110d; min-height: 34px; padding: 0; }
.checkout-field__input:focus { box-shadow: none; }
</style>
