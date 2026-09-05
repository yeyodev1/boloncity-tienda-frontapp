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
  CheckoutCoverageNotice,
  CheckoutMapPicker,
  CheckoutSection,
  CheckoutPaymentModal,
  CheckoutSuccessModal,
} from '@/components/checkout'

const {
  branchStore, countries,
  customerFirstName, customerLastName, customerEmail, customerPhone, phoneCountryCode,
  notes, deliveryAddress, deliveryGoogleMapsUrl, deliveryType, paymentMethod, order, promo, promoDiscount,
  scheduleOrder, scheduledDate, scheduledTime, scheduleSlots, scheduleDays, selectScheduleDay, toggleScheduleOrder,
  loading, ready, branch, branchLoading, publicBranches,
  deliveryCost, deliveryDistance, driverEtaMinutes, mapsError, locating, locationDetected,
  displayLat, displayLng,
  showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
  total, isFormValid, missingFields, cardPaymentBroken,
  ivaRate, pricesIncludeIva, payphoneAmounts,
  payphoneToken, payphoneStoreId,
  onPayPhoneReady, closePayment, toggleDeliveryType,
  detectLocation, clearLocation,
  detectBranch, reloadBranches, createOrder, selectBranch,
  branchClosedInfo, scheduleForNextOpening, outOfCoverage,
  mapPickerOpen, confirmMapLocation,
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
            <CheckoutSection :step="1" title="¿Cómo lo recibes?" hint="Elige entrega a domicilio o retiro en el local." icon="fa-motorcycle">
              <CheckoutDeliveryType :delivery-type="deliveryType" @update:delivery-type="toggleDeliveryType" />

              <template v-if="deliveryType === 'delivery'">
                <label class="ck-field">
                  <span class="ck-field__label">Dirección de entrega <em>*</em></span>
                  <input class="ck-field__input" v-model.trim="deliveryAddress" placeholder="Calle, número, referencia" />
                </label>

                <CheckoutLocation
                  :delivery-google-maps-url="deliveryGoogleMapsUrl"
                  :delivery-distance="deliveryDistance"
                  :delivery-cost="deliveryCost"
                  :driver-eta-minutes="driverEtaMinutes"
                  :maps-error="mapsError"
                  :locating="locating"
                  :location-detected="locationDetected"
                  :branch-name="branch?.name || ''"
                  :display-lat="displayLat"
                  :display-lng="displayLng"
                  @open-map="mapPickerOpen = true"
                  @detect-location="detectLocation"
                  @clear-location="clearLocation"
                />

                <CheckoutCoverageNotice
                  v-if="outOfCoverage"
                  :message="outOfCoverage"
                  @switch-to-pickup="toggleDeliveryType('pickup')"
                />
              </template>

              <CheckoutBranchPicker
                v-else
                :loading="branchLoading"
                :branches="publicBranches"
                :selected-branch-id="branchStore.selectedBranchId"
                :branch-name="branch?.name"
                @detect="detectBranch"
                @reload="reloadBranches"
                @select="selectBranch"
              />
            </CheckoutSection>

            <CheckoutSection :step="2" title="¿Quién lo recibe?" hint="Te enviamos la confirmación y el seguimiento por correo." icon="fa-user">
              <div class="ck-row">
                <label class="ck-field ck-field--half">
                  <span class="ck-field__label">Nombre</span>
                  <input class="ck-field__input" v-model.trim="customerFirstName" placeholder="Tu nombre" autocomplete="given-name" />
                </label>
                <label class="ck-field ck-field--half">
                  <span class="ck-field__label">Apellido</span>
                  <input class="ck-field__input" v-model.trim="customerLastName" placeholder="Tu apellido" autocomplete="family-name" />
                </label>
              </div>

              <label class="ck-field">
                <span class="ck-field__label">Email <em>*</em></span>
                <input class="ck-field__input" v-model.trim="customerEmail" type="email" placeholder="tu@email.com" autocomplete="email" />
              </label>

              <div class="ck-row">
                <div class="ck-field ck-field--code">
                  <span class="ck-field__label">País</span>
                  <select class="ck-field__input ck-field__select" v-model="phoneCountryCode">
                    <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
                  </select>
                </div>
                <label class="ck-field ck-field--phone">
                  <span class="ck-field__label">Teléfono</span>
                  <input class="ck-field__input" v-model.trim="customerPhone" type="tel" placeholder="Número" autocomplete="tel" />
                </label>
              </div>
            </CheckoutSection>

            <CheckoutSection :step="3" title="¿Cuándo y cómo pagas?" hint="Ambas formas de pago son seguras." icon="fa-credit-card">
              <CheckoutPaymentMethod v-model="paymentMethod" :schedule-enabled="scheduleOrder" :delivery-type="deliveryType" />

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
            </CheckoutSection>

            <!--
              Notas y facturación son opcionales y las usa una minoría: van al final
              y sin número, para que no parezcan un paso más que hay que completar.
            -->
            <section class="ck-extras">
              <label class="ck-field">
                <span class="ck-field__label">Notas para tu pedido <small>(opcional)</small></span>
                <textarea class="ck-field__input ck-field__textarea" v-model.trim="notes" placeholder="Ej.: casa de reja verde, tocar el timbre"></textarea>
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
            </section>

            <CheckoutPoints
              v-if="pointsEnabled && (pointsToEarn > 0 || pointsBalance || pointsBalanceLoading)"
              v-model:use-my-points="useMyPoints"
              :points-to-earn="pointsToEarn"
              :balance="pointsBalance"
              :balance-loading="pointsBalanceLoading"
              :discount="pointsDiscount"
            />

            <CheckoutClosedNotice
              v-if="branchClosedInfo"
              :info="branchClosedInfo"
              :already-scheduled="scheduleOrder && Boolean(scheduledDate) && Boolean(scheduledTime)"
              @schedule="scheduleForNextOpening"
            />

            <CheckoutMapPicker
              :open="mapPickerOpen"
              :initial="displayLat && displayLng ? { lat: displayLat, lng: displayLng } : null"
              @close="mapPickerOpen = false"
              @confirm="confirmMapLocation"
            />

            <!--
              Un botón gris que no dice por qué está gris es lo que termina en un
              mensaje al local («no me sale algún botón para confirmar»). Acá se
              nombra exactamente lo que falta.
            -->
            <div v-if="cardPaymentBroken" class="ck-broken" role="alert">
              <p><i class="fa-solid fa-triangle-exclamation" /> El pago con tarjeta no está disponible en este momento.</p>
              <p>Elige <b>Efectivo</b> para completar tu pedido, o escríbenos y lo tomamos por ti.</p>
            </div>

            <div v-else-if="!isFormValid && !loading" class="ck-missing">
              <p class="ck-missing__title"><i class="fa-solid fa-circle-info" /> Para confirmar tu pedido falta:</p>
              <ul>
                <li v-for="item in missingFields" :key="item"><i class="fa-solid fa-circle" /> {{ item }}</li>
              </ul>
              <p v-if="!missingFields.length" class="ck-missing__single">
                Revisa el aviso de la ubicación de arriba.
              </p>
            </div>

            <button class="btn-primary checkout-form__submit" type="submit" :disabled="loading || !isFormValid">
              <template v-if="loading">Procesando...</template>
              <template v-else-if="scheduleOrder"><i class="fa-solid fa-calendar-check" /> Programar pedido</template>
              <template v-else><i class="fa-solid fa-arrow-right" /> {{ deliveryType === 'delivery' ? 'Pedir a domicilio' : 'Pedir para recoger' }}</template>
            </button>
          </form>

          <CheckoutSummary
            :delivery-type="deliveryType"
            :delivery-cost="deliveryCost"
            :delivery-distance="deliveryDistance"
            :total="total"
            :promo-label="promo.label"
            :promo-discount="promoDiscount"
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
  // El formulario deja de ser una tarjeta gigante con tarjetas adentro: ahora es
  // solo la columna que ordena los pasos. La caja la pone cada paso.
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ck-row { display: flex; gap: 0.7rem; }

.ck-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.ck-field--half { flex: 1 1 0; }
.ck-field--code { flex: 0 0 128px; }
.ck-field--phone { flex: 1 1 0; }

.ck-field__label {
  color: rgba(8, 17, 13, 0.62);
  font-size: 0.82rem;
  font-weight: 700;
  // Se van las mayúsculas y el interletrado ancho: catorce etiquetas gritando a la
  // vez no jerarquizan nada, solo cansan.
  letter-spacing: 0;
  text-transform: none;

  em { color: #a02828; font-style: normal; }
  small { color: rgba(8, 17, 13, 0.4); font-weight: 500; }
}

.ck-field__input {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.14);
  border-radius: 14px;
  color: #08110d;
  font-size: 0.95rem;
  min-height: 48px;
  padding: 0.7rem 0.9rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  width: 100%;
}

.ck-field__input::placeholder { color: rgba(8, 17, 13, 0.34); }

.ck-field__input:focus {
  border-color: #235931;
  box-shadow: 0 0 0 3px rgba(35, 89, 49, 0.12);
  outline: none;
}

.ck-field__select { appearance: none; cursor: pointer; }
.ck-field__textarea { min-height: 88px; resize: vertical; }

.ck-extras {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ck-broken {
  background: #fdeceb;
  border: 1px solid rgba(165, 35, 35, 0.35);
  border-radius: 16px;
  color: #7c1a1a;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.86rem;
  line-height: 1.5;
  padding: 0.85rem 1rem;

  p:first-child { font-weight: 800; }
}

.ck-missing {
  background: #fff8d6;
  border: 1px solid rgba(239, 213, 55, 0.7);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;

  ul { display: flex; flex-direction: column; gap: 0.3rem; list-style: none; margin: 0; padding: 0; }

  li {
    align-items: center;
    color: #4b4100;
    display: flex;
    font-size: 0.85rem;
    gap: 0.5rem;
    line-height: 1.4;
  }

  li i { font-size: 0.32rem; opacity: 0.55; }
}

.ck-missing__title {
  align-items: center;
  color: #4b4100;
  display: flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.45rem;
}

.ck-missing__single { color: #4b4100; font-size: 0.85rem; line-height: 1.45; }

.checkout-form__submit {
  align-items: center;
  box-shadow: 0 14px 30px rgba(35, 89, 49, 0.22);
  display: flex;
  font-size: 1.02rem;
  gap: 0.5rem;
  justify-content: center;
  min-height: 58px;
  // Es la acción que cierra todo: se queda a la vista mientras se llena el resto.
  position: sticky;
  bottom: 1rem;
  z-index: 5;
}

@media (min-width: 980px) {
  .checkout-layout { align-items: start; flex-direction: row; }
  .checkout-form { flex: 1 1 0; }
  // El resumen acompaña el scroll: el total es lo que la gente vuelve a mirar
  // mientras llena el formulario.
  .checkout-form__submit { position: static; }
}
</style>
