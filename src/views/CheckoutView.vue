<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import PayPhoneBox from '@/components/checkout/PayPhoneBox.vue'
import { useCartStore } from '@/stores/cart'
import OrderService from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import type { OrderDTO } from '@/services/OrderService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useBranchStore } from '@/stores/branch'

const cart = useCartStore()
const branchStore = useBranchStore()
cart.hydrate()
branchStore.hydrate()

const customerName = ref('')
const customerEmail = ref('')
const customerPhone = ref('')
const notes = ref('')
const order = ref<OrderDTO | null>(null)
const loading = ref(false)
const ready = ref(false)
const branch = ref<BranchDTO | null>(null)
const branchLoading = ref(false)
const publicBranches = ref<BranchDTO[]>([])
const { error } = useToast()
const payphoneToken = import.meta.env.VITE_PAYPHONE_TOKEN as string
const payphoneStoreId = import.meta.env.VITE_PAYPHONE_STORE_ID as string

const total = computed(() => cart.subtotal)

function onPayPhoneReady() {
  ready.value = true
}

async function detectBranch() {
  branchLoading.value = true
  try {
    if (branchStore.selectedBranchId) {
      branchLoading.value = false
      branch.value = null
      return
    }

    if (!navigator.geolocation) {
      branchLoading.value = false
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await BranchService.nearest(position.coords.latitude, position.coords.longitude)
        branch.value = response.data.branch
        branchStore.setSelectedBranch(branch.value?._id || null)
      } finally {
        branchLoading.value = false
      }
    }, async () => {
      const response = await BranchService.getPublic()
      publicBranches.value = response.data
      branchLoading.value = false
    })
  } catch {
    branchLoading.value = false
  }
}

async function createOrder() {
  try {
    loading.value = true
    const response = await OrderService.create({
      items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      customerEmail: customerEmail.value,
      customerName: customerName.value,
      customerPhone: customerPhone.value,
      notes: notes.value,
      branchId: branchStore.selectedBranchId || branch.value?._id || null,
    })
    order.value = response.data
  } catch {
    error('No se pudo iniciar el pago')
  } finally {
    loading.value = false
  }
}

function selectBranch(item: BranchDTO) {
  branch.value = item
  branchStore.setSelectedBranch(item._id)
}

detectBranch()
</script>

<template>
  <div class="checkout-page">
    <StoreHeader />

    <main class="checkout-page__main">
      <section class="checkout-hero panel">
        <div>
          <p class="checkout-hero__eyebrow">Checkout</p>
          <h1>Finalizar pedido</h1>
          <p>
            Recibirás tus credenciales por email y el número de pedido para seguir tu compra.
          </p>
        </div>

        <div class="checkout-hero__total">
          <span>Total</span>
          <strong>${{ total.toFixed(2) }}</strong>
        </div>
      </section>

      <section v-if="!order" class="checkout-layout">
        <form class="panel checkout-form" @submit.prevent="createOrder">
          <div class="checkout-form__grid">
            <label>
              <span>Nombre</span>
              <input v-model.trim="customerName" placeholder="Tu nombre" autocomplete="name" />
            </label>

            <label>
              <span>Email</span>
              <input v-model.trim="customerEmail" type="email" placeholder="tu@email.com" autocomplete="email" />
            </label>

            <label>
              <span>Teléfono</span>
              <input v-model.trim="customerPhone" placeholder="Tu número" autocomplete="tel" />
            </label>

            <label>
              <span>Notas</span>
              <textarea v-model.trim="notes" placeholder="Indicaciones opcionales" />
            </label>
          </div>

          <div class="checkout-branch">
            <div class="checkout-branch__head">
              <span class="checkout-branch__label">Sucursal</span>
              <span v-if="branchLoading" class="muted">Detectando...</span>
              <span v-else-if="branch">{{ branch.name }}</span>
              <span v-else-if="branchStore.selectedBranchId" class="muted">Sucursal guardada</span>
            </div>

            <div v-if="!branch && publicBranches.length" class="checkout-branch__pills">
              <button
                v-for="item in publicBranches"
                :key="item._id"
                type="button"
                class="checkout-branch__pill"
                :class="{ active: branchStore.selectedBranchId === item._id }"
                @click="selectBranch(item)"
              >
                {{ item.name }}
              </button>
            </div>
          </div>

          <button class="btn-primary" type="submit" :disabled="loading || !cart.items.length || !customerEmail">
            {{ loading ? 'Procesando...' : 'Generar orden y pagar' }}
          </button>
        </form>

        <aside class="panel checkout-summary">
          <p class="checkout-summary__eyebrow">Resumen</p>
          <article v-for="item in cart.items" :key="item.productId" class="checkout-summary__item">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="muted">x{{ item.quantity }}</p>
            </div>
            <strong>${{ (item.price * item.quantity).toFixed(2) }}</strong>
          </article>

          <div class="checkout-summary__row">
            <span>Subtotal</span>
            <strong>${{ total.toFixed(2) }}</strong>
          </div>

          <RouterLink class="btn-secondary checkout-summary__link" to="/carrito">Volver al carrito</RouterLink>
        </aside>
      </section>

      <section v-else class="panel checkout-payment">
        <div class="checkout-payment__head">
          <div>
            <p class="checkout-payment__eyebrow">Pago</p>
            <h2>Pedido {{ order.orderNumber }}</h2>
          </div>
          <p class="muted">Tu orden ya está lista para PayPhone.</p>
        </div>

        <div class="checkout-payment__box">
          <PayPhoneBox
            :token="payphoneToken"
            :store-id="payphoneStoreId"
            :client-transaction-id="order.payphone?.clientTransactionId || ''"
            :amount="order.total"
            :amount-with-tax="order.total"
            :reference="`Pedido ${order.orderNumber}`"
            :email="customerEmail"
            :phone-number="customerPhone"
            :on-ready="onPayPhoneReady"
          />
        </div>

        <p v-if="ready" class="muted">El módulo de pago ya está listo.</p>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.checkout-page {
  display: grid;
  min-height: 100vh;
}

.checkout-page__main {
  display: grid;
  gap: 1.25rem;
  margin: 0 auto;
  max-width: 1400px;
  width: 100%;
}

.checkout-hero,
.checkout-layout,
.checkout-payment {
  margin: 0 1.25rem;
}

.checkout-hero {
  align-items: end;
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
}

.checkout-hero__eyebrow,
.checkout-summary__eyebrow,
.checkout-payment__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.checkout-hero h1,
.checkout-payment h2 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.checkout-hero p {
  @include body-text;
  margin-top: 0.85rem;
  max-width: 40rem;
}

.checkout-hero__total {
  display: grid;
  justify-items: end;
}

.checkout-hero__total span {
  @include eyebrow;
  color: rgba(26, 26, 26, 0.55);
}

.checkout-hero__total strong {
  color: #235931;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.checkout-layout {
  display: grid;
  gap: 1.25rem;
}

.checkout-form,
.checkout-summary,
.checkout-payment {
  padding: 1.25rem;
}

.checkout-form {
  display: grid;
  gap: 1.25rem;
}

.checkout-form__grid {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.55rem;
}

label span,
.checkout-branch__label {
  font-size: 0.9rem;
  font-weight: 700;
}

.checkout-branch {
  background: rgba(35, 89, 49, 0.04);
  border-radius: 18px;
  display: grid;
  gap: 0.9rem;
  padding: 1rem;
}

.checkout-branch__head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.checkout-branch__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkout-branch__pill {
  background: rgba(26, 26, 26, 0.05);
  border-radius: 999px;
  min-height: 40px;
  padding: 0.7rem 0.95rem;
}

.checkout-branch__pill.active {
  background: #235931;
  color: #fff;
}

.checkout-summary {
  display: grid;
  gap: 0.85rem;
}

.checkout-summary__item,
.checkout-summary__row {
  align-items: start;
  display: flex;
  justify-content: space-between;
}

.checkout-summary__item {
  border-bottom: 1px solid rgba(26, 26, 26, 0.06);
  padding-bottom: 0.75rem;
}

.checkout-summary__link {
  width: 100%;
}

.checkout-payment {
  display: grid;
  gap: 1.25rem;
}

.checkout-payment__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.checkout-payment__box {
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 18px;
  padding: 1rem;
}

@media (min-width: 980px) {
  .checkout-layout {
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: start;
  }

  .checkout-summary {
    position: sticky;
    top: 6rem;
  }
}

@media (max-width: 760px) {
  .checkout-hero,
  .checkout-payment__head {
    flex-direction: column;
    align-items: start;
  }
}
</style>
