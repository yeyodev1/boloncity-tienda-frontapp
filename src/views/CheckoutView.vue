<script setup lang="ts">
import { Transition } from 'vue'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import PayPhoneBox from '@/components/checkout/PayPhoneBox.vue'
import BaseDatePicker from '@/components/global/BaseDatePicker.vue'
import { useCheckout } from '@/composables/useCheckout'
import {
  CheckoutHero,
  CheckoutDeliveryType,
  CheckoutLocation,
  CheckoutBilling,
  CheckoutSummary,
} from '@/components/checkout'

const {
  branchStore, countries,
  customerFirstName, customerLastName, customerEmail, customerPhone, phoneCountryCode,
  notes, deliveryAddress, deliveryGoogleMapsUrl, deliveryType, paymentMethod, scheduleOrder, scheduledDate, scheduledTime, scheduleSlots, order,
  loading, ready, branch, branchLoading, publicBranches,
  deliveryCost, deliveryDistance, mapsError, locating, locationDetected,
  manualMapsLink, displayLat, displayLng,
  showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
  total, isFormValid,
  payphoneToken, payphoneStoreId,
  onPayPhoneReady, closePayment, toggleDeliveryType,
  detectLocation, useManualLink, clearLocation,
  detectBranch, createOrder, selectBranch,
} = useCheckout()
</script>

<template>
  <div class="checkout-page">
    <StoreHeader />

    <main class="checkout-page__main">
      <CheckoutHero :total="total" />

      <Transition name="page-fade" mode="out-in">
        <section v-if="!order" key="form" class="checkout-layout">
          <form class="panel checkout-form" @submit.prevent="createOrder">
            <CheckoutDeliveryType :delivery-type="deliveryType" @update:delivery-type="toggleDeliveryType" />

            <div class="checkout-form__grid">
              <div class="checkout-form__row">
                <label class="checkout-field checkout-field--half">
                  <span class="checkout-field__label"><i class="fa-solid fa-user" /> Nombre</span>
                  <input class="checkout-field__input" v-model.trim="customerFirstName" placeholder="Tu nombre" autocomplete="given-name" />
                </label>
                <label class="checkout-field checkout-field--half">
                  <span class="checkout-field__label"><i class="fa-solid fa-user" /> Apellido</span>
                  <input class="checkout-field__input" v-model.trim="customerLastName" placeholder="Tu apellido" autocomplete="family-name" />
                </label>
              </div>

              <label class="checkout-field">
                <span class="checkout-field__label"><i class="fa-solid fa-envelope" /> Email <em>*</em></span>
                <input class="checkout-field__input" v-model.trim="customerEmail" type="email" placeholder="tu@email.com" autocomplete="email" />
              </label>

              <div class="checkout-form__row">
                <div class="checkout-field checkout-field--code">
                  <span class="checkout-field__label"><i class="fa-solid fa-globe" /> País</span>
                  <select class="checkout-field__input checkout-field__select" v-model="phoneCountryCode">
                    <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
                  </select>
                </div>
                <label class="checkout-field checkout-field--phone">
                  <span class="checkout-field__label"><i class="fa-solid fa-phone" /> Teléfono</span>
                  <input class="checkout-field__input" v-model.trim="customerPhone" type="tel" placeholder="Número" autocomplete="tel" />
                </label>
              </div>

              <template v-if="deliveryType === 'delivery'">
                <label class="checkout-field">
                  <span class="checkout-field__label"><i class="fa-solid fa-location-dot" /> Dirección de entrega <em>*</em></span>
                  <input class="checkout-field__input" v-model.trim="deliveryAddress" placeholder="Calle, número, referencia" />
                </label>

                <CheckoutLocation
                  :delivery-google-maps-url="deliveryGoogleMapsUrl"
                  :delivery-distance="deliveryDistance"
                  :delivery-cost="deliveryCost"
                  :maps-error="mapsError"
                  :locating="locating"
                  :location-detected="locationDetected"
                  :manual-maps-link="manualMapsLink"
                  :branch-name="branch?.name || ''"
                  :display-lat="displayLat"
                  :display-lng="displayLng"
                  @detect-location="detectLocation"
                  @use-manual-link="useManualLink"
                  @clear-location="clearLocation"
                  @update:manual-maps-link="manualMapsLink = $event"
                />
              </template>

              <div class="checkout-payment-method">
                <span class="checkout-field__label"><i class="fa-solid fa-credit-card" /> Método de pago</span>
                <div class="checkout-payment-method__options">
                  <label class="checkout-payment-method__option" :class="{ active: paymentMethod === 'card' }">
                    <input v-model="paymentMethod" type="radio" value="card" />
                    <i class="fa-solid fa-credit-card" />
                    <span><strong>Tarjeta</strong><small>Pago seguro con PayPhone</small></span>
                  </label>
                  <label class="checkout-payment-method__option" :class="{ active: paymentMethod === 'cash' }">
                    <input v-model="paymentMethod" type="radio" value="cash" />
                    <i class="fa-solid fa-money-bill-wave" />
                    <span><strong>Efectivo</strong><small>Paga al motorizado al recibir</small></span>
                  </label>
                </div>
              </div>

              <section class="checkout-schedule" :class="{ active: scheduleOrder }"><label><input v-model="scheduleOrder" type="checkbox" /><span><i class="fa-solid fa-calendar-clock" /><strong>Programar pedido</strong><small>Elige una fecha y horario de atención entre 07:00 y 13:00.</small></span></label><div v-if="scheduleOrder" class="checkout-schedule__fields"><BaseDatePicker v-model="scheduledDate" label="Fecha" :min-date="new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' })" /><label><span>Hora</span><select v-model="scheduledTime"><option v-for="slot in scheduleSlots" :key="slot" :value="slot">{{ slot }}</option></select></label></div></section>

              <label class="checkout-field">
                <span class="checkout-field__label"><i class="fa-solid fa-pen" /> Notas</span>
                <textarea class="checkout-field__input checkout-field__textarea" v-model.trim="notes" placeholder="Indicaciones opcionales para tu pedido"></textarea>
              </label>

              <CheckoutBilling
                :show-billing="showBilling"
                :billing-doc-type="billingDocType"
                :billing-name="billingName"
                :billing-doc-number="billingDocNumber"
                :billing-email="billingEmail"
                :billing-address="billingAddress"
                @update:show-billing="showBilling = $event"
                @update:billing-doc-type="billingDocType = $event"
                @update:billing-name="billingName = $event"
                @update:billing-doc-number="billingDocNumber = $event"
                @update:billing-email="billingEmail = $event"
                @update:billing-address="billingAddress = $event"
              />
            </div>

            <div v-if="deliveryType === 'pickup'" class="checkout-branch">
              <div class="checkout-branch__head">
                <span class="checkout-branch__label"><i class="fa-solid fa-store" /> Elige tu sucursal <em>*</em></span>
                <span v-if="branchLoading" class="muted">Detectando...</span>
              </div>
              <button v-if="!branchStore.selectedBranchId" type="button" class="checkout-branch__nearby" @click="detectBranch">
                <i class="fa-solid fa-location-crosshairs" /> Usar mi ubicación
              </button>
              <div v-if="!branchStore.selectedBranchId && publicBranches.length" class="checkout-branch__pills">
                <button v-for="item in publicBranches" :key="item._id" type="button" class="checkout-branch__pill" :class="{ active: branchStore.selectedBranchId === item._id }" @click="selectBranch(item)">
                  {{ item.name }}
                </button>
              </div>
              <p v-if="branchStore.selectedBranchId || branch" class="checkout-branch__selected">
                <i class="fa-solid fa-check-circle" /> {{ branch?.name || 'Sucursal seleccionada' }}
              </p>
            </div>

            <button class="btn-primary checkout-form__submit" type="submit" :disabled="loading || !isFormValid">
              <template v-if="loading">Procesando...</template>
              <template v-else><i class="fa-solid fa-arrow-right" /> {{ deliveryType === 'delivery' ? 'Pedir a domicilio' : 'Pedir para recoger' }}</template>
            </button>
          </form>

          <CheckoutSummary
            :delivery-type="deliveryType"
            :delivery-cost="deliveryCost"
            :delivery-distance="deliveryDistance"
            :total="total"
          />
        </section>
      </Transition>
    </main>

    <StoreFooter />

    <Transition name="modal-fade">
      <div v-if="order && paymentMethod === 'card'" class="payment-overlay">
        <div class="payment-modal">
          <div class="payment-modal__header">
            <button type="button" class="payment-modal__back" @click="closePayment">
              <i class="fa-solid fa-arrow-left" /> Volver
            </button>
            <p class="payment-modal__eyebrow"><i class="fa-solid fa-lock" /> Pago seguro</p>
            <p class="payment-modal__secure">No almacenamos tus datos de pago</p>
            <h2>Pedido {{ order.orderNumber }}</h2>
          </div>

          <div class="payment-modal__content">
            <div class="payment-modal__summary">
              <div class="payment-modal__summary-icon"><i class="fa-solid fa-credit-card" /></div>
              <div>
                <span>Total a pagar</span>
                <strong>${{ (order.total / 100).toFixed(2) }}</strong>
              </div>
              <small><i class="fa-solid fa-shield-halved" /> Encriptado</small>
            </div>

            <div class="payment-modal__box">
              <PayPhoneBox
                :token="payphoneToken"
                :store-id="payphoneStoreId"
                :client-transaction-id="order.payphone?.clientTransactionId || ''"
                :amount="order.total"
                :amount-with-tax="order.total"
                :reference="`Pedido ${order.orderNumber}`"
                :email="customerEmail"
                :phone-number="`${phoneCountryCode} ${customerPhone}`"
                :on-ready="onPayPhoneReady"
              />
            </div>
          </div>

          <p v-if="ready" class="payment-modal__ready">
            <i class="fa-solid fa-circle-check" /> Módulo de pago listo
          </p>
        </div>
      </div>
    </Transition>

    <section v-if="order && paymentMethod === 'cash'" class="cash-success">
      <i class="fa-solid fa-circle-check" />
      <h2>Pedido recibido</h2>
      <p>Tu pedido {{ order.orderNumber }} se pagará en efectivo al motorizado cuando lo recibas.</p>
      <a href="/pedido" class="btn-primary">Seguir mi pedido</a>
    </section>
  </div>
</template>

<style scoped lang="scss">
.checkout-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.2), transparent 32%),
    linear-gradient(180deg, #f8f6ec 0%, #f2f4ed 52%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.checkout-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: 1.5rem;
  margin: 0 auto;
  max-width: 1400px;
  padding: calc(60px + clamp(1.5rem, 4vw, 3rem)) 1rem clamp(1.5rem, 4vw, 3rem);
  width: 100%;
}

.checkout-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 0 1.25rem;
}

.checkout-form {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.checkout-form__grid { display: flex; flex-direction: column; gap: 0.85rem; }
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
.checkout-field--code { flex: 0 0 140px; }
.checkout-field--phone { flex: 1 1 0; }

.checkout-field__label {
  align-items: center;
  color: rgba(8, 17, 13, 0.62);
  display: flex;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.45rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.checkout-field__label i { color: #235931; font-size: 0.72rem; opacity: 0.8; }
.checkout-field__label em { color: #a02828; font-style: normal; }

.checkout-field__input {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  color: #08110d;
  min-height: 34px;
  padding: 0;
}

.checkout-field__input:focus { box-shadow: none; }
.checkout-field__select { appearance: none; cursor: pointer; padding-right: 1.2rem; }
.checkout-field__textarea { min-height: 100px; resize: vertical; }

.checkout-form__submit {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  min-height: 56px;
  box-shadow: 0 18px 34px rgba(35, 89, 49, 0.18);
  font-size: 1.05rem;
}

.checkout-payment-method { display: flex; flex-direction: column; gap: 0.6rem; }
.checkout-payment-method__options { display: flex; flex-direction: column; gap: 0.6rem; }
.checkout-payment-method__option { align-items: center; background: #fff; border: 1px solid rgba(35, 89, 49, 0.12); border-radius: 16px; cursor: pointer; display: flex; gap: 0.7rem; min-height: 64px; padding: 0.85rem; position: relative; transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
.checkout-payment-method__option:hover { border-color: rgba(35, 89, 49, 0.35); transform: translateY(-1px); }
.checkout-payment-method__option.active { background: linear-gradient(145deg, #f5f9f4, #e9f4eb); border-color: #235931; box-shadow: 0 10px 24px rgba(35, 89, 49, 0.12); }
.checkout-payment-method__option input { height: 1px; opacity: 0; pointer-events: none; position: absolute; width: 1px; }
.checkout-payment-method__option > i { align-items: center; background: rgba(35, 89, 49, 0.08); border-radius: 12px; color: #235931; display: flex; flex: 0 0 38px; font-size: 1rem; height: 38px; justify-content: center; }
.checkout-payment-method__option.active > i { background: #235931; color: #fff; }
.checkout-payment-method__option span { display: flex; flex-direction: column; gap: 0.12rem; }
.checkout-payment-method__option strong { font-size: 0.92rem; }
.checkout-payment-method__option small { color: rgba(8, 17, 13, 0.55); font-size: 0.75rem; }

.checkout-branch {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.15rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.checkout-branch:focus-within { border-color: rgba(35, 89, 49, 0.3); box-shadow: 0 14px 34px rgba(35, 89, 49, 0.08); }

.checkout-branch__head { align-items: center; display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; }

.checkout-branch__label {
  align-items: center;
  color: rgba(8, 17, 13, 0.62);
  display: flex;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.45rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.checkout-branch__label i { color: #235931; font-size: 0.72rem; opacity: 0.8; }
.checkout-branch__label em { color: #a02828; font-style: normal; }

.checkout-branch__nearby {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.checkout-branch__nearby:hover { background: rgba(35, 89, 49, 0.12); transform: translateY(-1px); }
.checkout-branch__pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.checkout-branch__pill {
  background: rgba(26, 26, 26, 0.05);
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  min-height: 42px;
  padding: 0.75rem 1.05rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.checkout-branch__pill:hover { background: rgba(35, 89, 49, 0.06); border-color: rgba(35, 89, 49, 0.15); transform: translateY(-1px); }
.checkout-branch__pill.active { background: #235931; border-color: #235931; color: #fff; }
.checkout-branch__selected { align-items: center; color: #235931; display: flex; font-weight: 700; gap: 0.4rem; }

.payment-overlay {
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.payment-modal {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 460px;
  padding: 1.5rem;
  width: 92vw;
}

.payment-modal__header { text-align: center; }

.payment-modal__back {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.9rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.payment-modal__back:hover { background: rgba(35, 89, 49, 0.12); color: #00a523; }

.payment-modal__eyebrow {
  align-items: center;
  color: #00a523;
  display: flex;
  font-size: 0.76rem;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.payment-modal__secure { color: rgba(8, 17, 13, 0.45); font-size: 0.8rem; margin-top: 0.25rem; }

.payment-modal__header h2 {
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin-top: 0.5rem;
  text-transform: uppercase;
}

.payment-modal__summary { align-items: center; background: linear-gradient(135deg, #102719, #235931); border-radius: 20px; color: #fff; display: flex; gap: 0.75rem; padding: 1rem; }
.payment-modal__summary-icon { align-items: center; background: #efd537; border-radius: 14px; color: #102719; display: flex; flex: 0 0 44px; height: 44px; justify-content: center; }
.payment-modal__summary div { display: flex; flex: 1 1 0; flex-direction: column; }
.payment-modal__summary span { color: rgba(255, 255, 255, 0.65); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
.payment-modal__summary strong { font-size: 1.35rem; letter-spacing: -0.04em; }
.payment-modal__summary small { color: #efd537; font-size: 0.68rem; font-weight: 800; }
.payment-modal__content { display: flex; flex-direction: column; gap: 1rem; }

.payment-modal__box {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 22px;
  padding: 1.5rem;
}

.payment-modal__ready { align-items: center; color: #00a523; display: flex; font-size: 0.85rem; font-weight: 700; gap: 0.4rem; justify-content: center; }

.cash-success { align-items: center; background: #fff; border-radius: 24px; box-shadow: 0 24px 60px rgba(28, 22, 12, 0.12); display: flex; flex-direction: column; gap: 0.8rem; left: 50%; max-width: 420px; padding: 2rem; position: fixed; text-align: center; top: 50%; transform: translate(-50%, -50%); width: calc(100% - 2rem); z-index: 1000; }
.cash-success > i { color: #00a523; font-size: 2.5rem; }
.cash-success h2 { font-size: 1.5rem; }
.cash-success p { color: rgba(8, 17, 13, 0.65); line-height: 1.5; }
.cash-success a { padding: 0.8rem 1.2rem; text-decoration: none; }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.35s cubic-bezier(0.65, 0, 0.35, 1); }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

@media (min-width: 980px) {
  .checkout-layout { align-items: start; flex-direction: row; }
  .checkout-form { flex: 1 1 0; }
  .payment-modal { max-width: 820px; padding: 2rem; width: min(90vw, 820px); }
  .payment-modal__header { text-align: left; }
  .payment-modal__eyebrow { justify-content: flex-start; }
  .payment-modal__content { align-items: stretch; flex-direction: row; }
  .payment-modal__summary { align-items: flex-start; flex: 0 0 230px; flex-direction: column; justify-content: center; padding: 1.5rem; }
  .payment-modal__summary div { flex: 0 0 auto; }
  .payment-modal__summary strong { font-size: 2rem; }
  .payment-modal__box { display: flex; flex: 1 1 0; flex-direction: column; justify-content: center; padding: 1.75rem; }
  .checkout-payment-method__options { flex-direction: row; }
  .checkout-payment-method__option { align-items: flex-start; flex: 1 1 0; flex-direction: column; min-height: 108px; padding: 1rem 1.1rem; position: relative; }
  .checkout-payment-method__option > i { flex-basis: 44px; font-size: 1.15rem; height: 44px; width: 44px; }
  .checkout-payment-method__option small { max-width: 14rem; }
}
.checkout-schedule { background:rgba(35,89,49,.04); border:1px solid rgba(35,89,49,.14); border-radius:16px; display:flex; flex-direction:column; gap:.8rem; padding:.85rem; }.checkout-schedule.active { background:rgba(35,89,49,.08); border-color:rgba(35,89,49,.3); }.checkout-schedule > label { align-items:flex-start; cursor:pointer; display:flex; gap:.65rem; }.checkout-schedule input[type='checkbox'] { accent-color:#235931; margin-top:.2rem; }.checkout-schedule label > span { display:flex; flex-direction:column; gap:.15rem; }.checkout-schedule label > span > i { color:#235931; }.checkout-schedule strong { color:#152019; font-size:.9rem; }.checkout-schedule small { color:rgba(8,17,13,.58); font-size:.75rem; }.checkout-schedule__fields { display:flex; flex-wrap:wrap; gap:.65rem; }.checkout-schedule__fields > * { flex:1 1 150px; }.checkout-schedule__fields label { display:flex; flex-direction:column; gap:.3rem; }.checkout-schedule__fields label > span { color:#235931; font-size:.7rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }.checkout-schedule__fields select { background:#fff; border:1px solid rgba(8,17,13,.12); border-radius:12px; color:#152019; min-height:42px; padding:.55rem .65rem; }
</style>
