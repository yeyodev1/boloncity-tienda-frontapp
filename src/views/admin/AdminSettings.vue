<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import PageHead from '@/components/admin/catalog-ui/PageHead.vue'
import '@/components/admin/catalog-ui/ui.scss'
import SettingsService, { type SettingsDTO } from '@/services/SettingsService'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

const settings = ref<SettingsDTO | null>(null)
const ivaRate = ref(15)
const pricesIncludeIva = ref(true)
const deliveryPricePerKm = ref(0)
const pointsEnabled = ref(true)
const pointsEarnDollars = ref(1)
const pointsEarnAmount = ref(1)
const pointsRedeemPerDollar = ref(100)
// Promoción global: % de descuento sobre productos. El envío nunca se descuenta.
const promoEnabled = ref(false)
const promoPercent = ref(0)
const promoLabel = ref('')
const promoStartsAt = ref('')
const promoEndsAt = ref('')
const loading = ref(true)
const saving = ref(false)
const applying = ref(false)
const { confirm } = useConfirm()
const { success, error } = useToast()

/** Foto de lo guardado: si el formulario difiere, aparece la barra de "cambios sin guardar". */
const savedSnapshot = ref('')
const snapshot = () => JSON.stringify([ivaRate.value, pricesIncludeIva.value, deliveryPricePerKm.value, pointsEnabled.value, pointsEarnDollars.value, pointsEarnAmount.value, pointsRedeemPerDollar.value, promoEnabled.value, promoPercent.value, promoLabel.value, promoStartsAt.value, promoEndsAt.value])
const dirty = computed(() => !loading.value && savedSnapshot.value !== '' && snapshot() !== savedSnapshot.value)
const promoOn = computed(() => promoEnabled.value && Number(promoPercent.value) > 0)

function discard() {
  if (settings.value) hydrate(settings.value)
}

function hydrate(data: SettingsDTO) {
  settings.value = data
  ivaRate.value = data.ivaRate ?? 15
  pricesIncludeIva.value = data.pricesIncludeIva ?? true
  // El precio por km se guarda en centavos.
  deliveryPricePerKm.value = (data.deliveryPricePerKm ?? 0) / 100
  pointsEnabled.value = data.pointsEnabled ?? true
  pointsEarnDollars.value = data.pointsEarnDollars || 1
  pointsEarnAmount.value = data.pointsEarnAmount ?? 1
  pointsRedeemPerDollar.value = data.pointsRedeemPerDollar || 100
  promoEnabled.value = data.promoEnabled ?? false
  promoPercent.value = data.promoPercent ?? 0
  promoLabel.value = data.promoLabel || ''
  // Los <input type="datetime-local"> usan hora local sin zona: se recorta la ISO.
  promoStartsAt.value = toLocalInput(data.promoStartsAt)
  promoEndsAt.value = toLocalInput(data.promoEndsAt)
  savedSnapshot.value = snapshot()
}

/** ISO del backend -> valor de <input type="datetime-local"> en hora local. */
function toLocalInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function load() {
  try { hydrate((await SettingsService.fetch()).data) }
  catch { error('No se pudo cargar la configuración') }
  finally { loading.value = false }
}

async function save() {
  if (ivaRate.value < 0 || ivaRate.value > 100) { error('El IVA debe estar entre 0 y 100'); return }
  if (promoPercent.value < 0 || promoPercent.value > 100) { error('El descuento de la promo debe estar entre 0 y 100'); return }
  if (promoEnabled.value && Number(promoPercent.value) <= 0) { error('Escribe el porcentaje de la promo antes de activarla'); return }
  if (promoStartsAt.value && promoEndsAt.value && new Date(promoStartsAt.value) > new Date(promoEndsAt.value)) {
    error('La promo no puede terminar antes de empezar'); return
  }
  try {
    saving.value = true
    hydrate((await SettingsService.update({
      ivaRate: Number(ivaRate.value),
      pricesIncludeIva: pricesIncludeIva.value,
      deliveryPricePerKm: Math.round(Number(deliveryPricePerKm.value) * 100),
      pointsEnabled: pointsEnabled.value,
      pointsEarnDollars: Math.max(0.01, Number(pointsEarnDollars.value) || 1),
      pointsEarnAmount: Math.max(0, Number(pointsEarnAmount.value) || 0),
      pointsRedeemPerDollar: Math.max(1, Number(pointsRedeemPerDollar.value) || 100),
      promoEnabled: promoEnabled.value,
      promoPercent: Math.min(100, Math.max(0, Number(promoPercent.value) || 0)),
      promoLabel: promoLabel.value.trim(),
      promoStartsAt: promoStartsAt.value ? new Date(promoStartsAt.value).toISOString() : null,
      promoEndsAt: promoEndsAt.value ? new Date(promoEndsAt.value).toISOString() : null,
    })).data)
    success('Configuración guardada')
  } catch { error('No se pudo guardar la configuración') }
  finally { saving.value = false }
}

/** Cambiar la tasa en settings no reescribe los productos ya guardados; esto sí. */
async function applyIva() {
  const ok = await confirm({
    title: `Aplicar IVA del ${ivaRate.value}% a todo el catálogo`,
    message: 'Se reescribirá el IVA de todos los productos. Los precios no cambian: siguen incluyendo IVA, solo se ajusta el desglose que va en la factura y en el cobro.',
    confirmText: 'Aplicar a todos',
    cancelText: 'Cancelar',
    type: 'warning',
    icon: 'fa-solid fa-percent',
  })
  if (!ok) return
  try {
    applying.value = true
    const response = await SettingsService.applyIvaToCatalog({ ivaRate: Number(ivaRate.value), hasIva: true })
    hydrate(response.data.settings)
    success(response.data.message)
  } catch { error('No se pudo aplicar el IVA al catálogo') }
  finally { applying.value = false }
}

onMounted(load)
</script>

<template>
  <!-- Envoltorio: así el reset del SCSS con scope de esta vista no le quita el padding a AdminLayout. -->
  <div class="cui-root">
    <AdminLayout>
      <main class="cui-page settings" :class="{ 'has-bar': dirty }">
        <PageHead eyebrow="Ajustes de la tienda" title="Configuración" description="Promociones, puntos, impuestos y envío. Vale para la web y para WhatsApp." />

        <!-- Promoción -->
        <section class="block cui-panel">
          <header class="block__head">
            <span class="block__icon"><i class="fa-solid fa-tag" aria-hidden="true" /></span>
            <div><h2>Promoción global</h2><p>Descuento en todos los productos. El envío nunca se descuenta.</p></div>
            <span class="cui-chip" :class="promoOn ? 'cui-chip--yellow' : ''">{{ promoOn ? `Activa · -${promoPercent}%` : 'Apagada' }}</span>
          </header>
          <div class="block__body">
            <button type="button" class="cui-switch" :class="{ 'is-on': promoEnabled }" role="switch" :aria-checked="promoEnabled" :disabled="loading || saving" @click="promoEnabled = !promoEnabled">
              <i class="fa-solid fa-bolt" aria-hidden="true" /><span><strong>Promoción activa</strong><small>Sin fechas corre hasta que la apagues; con fechas se prende y apaga sola</small></span><span class="cui-switch__knob" />
            </button>
            <label class="cui-field half"><span>Descuento (%)</span><input v-model.number="promoPercent" type="number" min="0" max="100" step="1" :disabled="loading || saving" /></label>
            <label class="cui-field half"><span>Texto para el cliente</span><input v-model="promoLabel" type="text" maxlength="120" placeholder="20% de descuento en todo" :disabled="loading || saving" /></label>
            <label class="cui-field half"><span>Empieza <em>opcional</em></span><input v-model="promoStartsAt" type="datetime-local" :disabled="loading || saving" /></label>
            <label class="cui-field half"><span>Termina <em>opcional</em></span><input v-model="promoEndsAt" type="datetime-local" :disabled="loading || saving" /></label>
            <p class="block__note">Se calcula al crear el pedido y queda guardado: cambiar la promo no altera pedidos ya hechos.</p>
          </div>
        </section>

        <!-- Puntos -->
        <section class="block cui-panel">
          <header class="block__head">
            <span class="block__icon"><i class="fa-solid fa-star" aria-hidden="true" /></span>
            <div><h2>Programa de puntos</h2><p>El cliente gana puntos al comprar y los canjea como descuento.</p></div>
            <span class="cui-chip" :class="pointsEnabled ? 'cui-chip--good' : ''">{{ pointsEnabled ? 'Activo' : 'Apagado' }}</span>
          </header>
          <div class="block__body">
            <button type="button" class="cui-switch" :class="{ 'is-on': pointsEnabled }" role="switch" :aria-checked="pointsEnabled" :disabled="loading || saving" @click="pointsEnabled = !pointsEnabled">
              <i class="fa-solid fa-star" aria-hidden="true" /><span><strong>Puntos activos</strong><small>Al apagarlo no se ganan ni se canjean puntos; los saldos se conservan</small></span><span class="cui-switch__knob" />
            </button>
            <label class="cui-field third"><span>Cada cuántos $</span><input v-model.number="pointsEarnDollars" type="number" min="0.01" step="0.5" :disabled="loading || saving" /></label>
            <label class="cui-field third"><span>Se dan estos puntos</span><input v-model.number="pointsEarnAmount" type="number" min="0" step="1" :disabled="loading || saving" /></label>
            <label class="cui-field third"><span>Puntos que valen $1</span><input v-model.number="pointsRedeemPerDollar" type="number" min="1" step="10" :disabled="loading || saving" /></label>
            <p class="block__summary" aria-live="polite">
              <i class="fa-solid fa-calculator" aria-hidden="true" />
              Cada <strong>${{ pointsEarnDollars }}</strong> de compra = <strong>{{ pointsEarnAmount }} {{ pointsEarnAmount === 1 ? 'punto' : 'puntos' }}</strong> · <strong>{{ pointsRedeemPerDollar }} puntos</strong> = <strong>$1</strong> de descuento. Los puntos por producto (Rewards) se suman aparte.
            </p>
          </div>
        </section>

        <!-- IVA y envío -->
        <section class="block cui-panel">
          <header class="block__head">
            <span class="block__icon"><i class="fa-solid fa-percent" aria-hidden="true" /></span>
            <div><h2>IVA y envío</h2><p>Los precios ya incluyen IVA: cambiar la tasa no cambia lo que paga el cliente.</p></div>
          </header>
          <div class="block__body">
            <label class="cui-field half"><span>IVA vigente (%)</span><input v-model.number="ivaRate" type="number" min="0" max="100" step="0.5" :disabled="loading || saving" /></label>
            <label class="cui-field half"><span>Envío por km (USD)</span><input v-model.number="deliveryPricePerKm" type="number" min="0" step="0.05" :disabled="loading || saving" /><small>Solo si Picker no devuelve una cotización.</small></label>
            <button type="button" class="cui-switch" :class="{ 'is-on': pricesIncludeIva }" role="switch" :aria-checked="pricesIncludeIva" :disabled="loading || saving" @click="pricesIncludeIva = !pricesIncludeIva">
              <i class="fa-solid fa-receipt" aria-hidden="true" /><span><strong>Los precios incluyen IVA</strong><small>Apágalo solo si el catálogo pasa a precios sin impuesto</small></span><span class="cui-switch__knob" />
            </button>
            <div class="block__apply">
              <p>Guardar cambia el IVA de los productos <strong>nuevos</strong>. Para los que ya existen:</p>
              <button type="button" class="cui-btn cui-btn--ghost" :disabled="loading || applying" @click="applyIva">
                <i class="fa-solid fa-wand-magic-sparkles" /> {{ applying ? 'Aplicando…' : `Aplicar ${ivaRate}% a todo el catálogo` }}
              </button>
            </div>
          </div>
        </section>

        <!-- Delivery -->
        <section class="delivery cui-panel">
          <span class="block__icon"><i class="fa-solid fa-truck-fast" aria-hidden="true" /></span>
          <div>
            <h2>Delivery con Picker <span class="cui-chip cui-chip--good">Activo</span></h2>
            <p>Picker cotiza el envío, asigna el motorizado y da el seguimiento. Cada sucursal necesita su cuenta de Picker conectada (en Sucursales). Repartidores propios: requiere un perfil de logística, todavía no disponible.</p>
          </div>
        </section>

        <Transition name="save-bar">
          <div v-if="dirty" class="save-bar" role="region" aria-label="Cambios sin guardar">
            <span><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> Tienes cambios sin guardar</span>
            <div>
              <button type="button" class="cui-btn cui-btn--ghost" :disabled="saving" @click="discard">Descartar</button>
              <button type="button" class="cui-btn cui-btn--primary" :disabled="saving" @click="save"><i class="fa-solid fa-floppy-disk" /> {{ saving ? 'Guardando…' : 'Guardar cambios' }}</button>
            </div>
          </div>
        </Transition>
      </main>
    </AdminLayout>
  </div>
</template>

<style scoped lang="scss">
.settings { max-width: 980px; }
.settings.has-bar { padding-bottom: 7rem; }

.block { overflow: hidden; }

.block__head {
  align-items: flex-start;
  border-bottom: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem;

  > div { flex: 1 1 220px; min-width: 0; }
  h2 { font-size: 1.02rem; margin: 0; }
  p { color: var(--admin-muted); font-size: 0.8rem; line-height: 1.4; margin: 0.15rem 0 0; }
}

.block__icon {
  align-items: center;
  background: var(--admin-accent-soft);
  border-radius: 12px;
  color: var(--admin-accent);
  display: flex;
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
}

.block__body {
  display: flex;
  flex-flow: row wrap;
  gap: 0.85rem;
  padding: 1rem;

  > * { flex: 1 1 100%; }
  /* De a dos por fila (Descuento + Texto, Empieza + Termina); en celular, uno debajo del otro. */
  > .half { flex: 1 1 calc(50% - 0.45rem); min-width: 200px; }
  > .third { flex: 1 1 160px; }
}

.block__note { color: var(--admin-muted); font-size: 0.76rem; line-height: 1.4; margin: 0; }

.block__summary {
  align-items: flex-start;
  background: var(--admin-surface-2);
  border: 1px dashed var(--admin-line-strong);
  border-radius: 12px;
  color: var(--admin-muted);
  display: flex;
  font-size: 0.82rem;
  gap: 0.5rem;
  line-height: 1.5;
  margin: 0;
  padding: 0.7rem 0.85rem;

  i { color: var(--admin-accent); margin-top: 0.2rem; }
  strong { color: var(--admin-text); }
}

.block__apply {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: space-between;
  padding-top: 0.85rem;

  p { color: var(--admin-muted); flex: 1 1 260px; font-size: 0.8rem; margin: 0; }
  strong { color: var(--admin-text); }
}

.delivery {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  padding: 1rem;

  h2 { align-items: center; display: flex; flex-wrap: wrap; font-size: 0.98rem; gap: 0.45rem; margin: 0; }
  p { color: var(--admin-muted); font-size: 0.8rem; line-height: 1.5; margin: 0.3rem 0 0; }
}

.cui-switch:disabled { cursor: not-allowed; opacity: 0.55; }

.save-bar {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line-strong);
  border-radius: 18px;
  bottom: 1rem;
  box-shadow: var(--admin-shadow-lg);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  justify-content: space-between;
  left: 50%;
  max-width: calc(100vw - 1.5rem);
  padding: 0.7rem 0.75rem 0.7rem 1rem;
  position: fixed;
  transform: translateX(-50%);
  width: 640px;
  z-index: 60;

  > span { align-items: center; color: var(--admin-text); display: flex; font-size: 0.86rem; font-weight: 700; gap: 0.45rem; }
  > span i { color: var(--admin-warning); }
  > div { display: flex; gap: 0.45rem; margin-left: auto; }
}

.save-bar-enter-active, .save-bar-leave-active { transition: opacity 0.25s ease, transform 0.3s var(--admin-ease, ease); }
.save-bar-enter-from, .save-bar-leave-to { opacity: 0; transform: translate(-50%, 16px); }

@media (prefers-reduced-motion: reduce) { .save-bar-enter-active, .save-bar-leave-active { transition: opacity 0.15s ease; } .save-bar-enter-from, .save-bar-leave-to { transform: translateX(-50%); } }
</style>
