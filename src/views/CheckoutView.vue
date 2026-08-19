<script setup lang="ts">
import { Transition } from 'vue'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import { useCheckout } from '@/composables/useCheckout'
import {
  CheckoutHero,
  CheckoutDeliveryType,
  CheckoutLocation,
  CheckoutSchedule,
  CheckoutBilling,
  CheckoutSummary,
  CheckoutPaymentMethod,
  CheckoutBranchPicker,
  CheckoutPoints,
  CheckoutClosedNotice,
  CheckoutPaymentModal,
  CheckoutSuccessModal,
} from '@/components/checkout'

const {
  branchStore, countries,
  customerFirstName, customerLastName, customerEmail, customerPhone, phoneCountryCode,
  notes, deliveryAddress, deliveryGoogleMapsUrl, deliveryType, paymentMethod, order,
  scheduleOrder, scheduledDate, scheduledTime, scheduleSlots, scheduleDays, selectScheduleDay, toggleScheduleOrder,
  loading, ready, branch, branchLoading, publicBranches,
  deliveryCost, deliveryDistance, mapsError, locating, resolvingLink, locationDetected,
  manualMapsLink, displayLat, displayLng,
  showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
  total, isFormValid,
  ivaRate, pricesIncludeIva, payphoneAmounts,
  payphoneToken, payphoneStoreId,
  onPayPhoneReady, closePayment, toggleDeliveryType,
  detectLocation, useManualLink, clearLocation,
  detectBranch, reloadBranches, createOrder, selectBranch,
  branchClosedInfo, scheduleForNextOpening,
  pointsEnabled, pointsToEarn, pointsBalance, pointsBalanceLoading, useMyPoints, pointsDiscount,
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
                  :resolving="resolvingLink"
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

              <CheckoutPaymentMethod v-model="paymentMethod" />

              <CheckoutSchedule
                :enabled="scheduleOrder"
                :days="scheduleDays"
                :slots="scheduleSlots"
                :selected-date="scheduledDate"
                :selected-time="scheduledTime"
                :branch-name="branch?.name"
                @update:enabled="toggleScheduleOrder"
                @select-day="selectScheduleDay"
                @update:selected-time="scheduledTime = $event"
              />

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

            <CheckoutBranchPicker
              v-if="deliveryType === 'pickup'"
              :loading="branchLoading"
              :branches="publicBranches"
              :selected-branch-id="branchStore.selectedBranchId"
              :branch-name="branch?.name"
              @detect="detectBranch"
              @reload="reloadBranches"
              @select="selectBranch"
            />

            <CheckoutPoints
              v-if="pointsEnabled && (pointsToEarn > 0 || pointsBalance || pointsBalanceLoading)"
              v-model:use-my-points="useMyPoints"
              :points-to-earn="pointsToEarn"
              :balance="pointsBalance"
              :balance-loading="pointsBalanceLoading"
              :discount="pointsDiscount"
            />

            <CheckoutClosedNotice v-if="branchClosedInfo" :info="branchClosedInfo" @schedule="scheduleForNextOpening" />

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
            :iva-rate="ivaRate"
            :prices-include-iva="pricesIncludeIva"
          />
        </section>
      </Transition>
    </main>

    <StoreFooter />

    <CheckoutPaymentModal
      :order="paymentMethod === 'card' ? order : null"
      :payphone-token="payphoneToken"
      :payphone-store-id="payphoneStoreId"
      :amounts="payphoneAmounts"
      :email="customerEmail"
      :phone-number="`${phoneCountryCode} ${customerPhone}`"
      :ready="ready"
      @close="closePayment"
      @ready="onPayPhoneReady"
    />

    <CheckoutSuccessModal :order="paymentMethod === 'cash' ? order : null" />
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

.checkout-form__submit { align-items: center; box-shadow: 0 18px 34px rgba(35, 89, 49, 0.18); display: flex; font-size: 1.05rem; gap: 0.5rem; justify-content: center; min-height: 56px; }

@media (min-width: 980px) {
  .checkout-layout { align-items: start; flex-direction: row; }
  .checkout-form { flex: 1 1 0; }
}
</style>
