<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
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
const loading = ref(true)
const saving = ref(false)
const applying = ref(false)
const { confirm } = useConfirm()
const { success, error } = useToast()

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
}

async function load() {
  try { hydrate((await SettingsService.fetch()).data) }
  catch { error('No se pudo cargar la configuración') }
  finally { loading.value = false }
}

async function save() {
  if (ivaRate.value < 0 || ivaRate.value > 100) { error('El IVA debe estar entre 0 y 100'); return }
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
  <AdminLayout>
    <main class="settings">
      <section class="hero panel">
        <div>
          <p>Configuración</p>
          <h1>Operación de entrega</h1>
          <span>Define cómo se gestiona el delivery de Boloncity.</span>
        </div>
        <div class="provider"><i class="fa-solid fa-bolt" /><span>Integración principal</span><strong>Picker</strong></div>
      </section>

      <section class="notice">
        <i class="fa-solid fa-circle-info" />
        <p><strong>Picker administra la mayor parte de la operación.</strong> La cotización, asignación de conductor, seguimiento y disponibilidad se resuelven desde Picker para cada sucursal conectada.</p>
      </section>

      <article class="panel iva-card">
        <header>
          <div class="icon"><i class="fa-solid fa-percent" /></div>
          <div><p>Impuestos</p><h2>IVA del catálogo</h2></div>
        </header>

        <p class="iva-card__lead">
          Los precios que ves en la tienda <strong>ya incluyen IVA</strong>. Cambiar la tasa no
          sube ni baja lo que paga el cliente: ajusta cuánto de ese precio se declara como
          impuesto en la factura y en el desglose que recibe PayPhone.
        </p>

        <div class="iva-card__fields">
          <label>
            <span>IVA vigente (%)</span>
            <input v-model.number="ivaRate" type="number" min="0" max="100" step="0.5" :disabled="loading || saving" />
          </label>
          <label>
            <span>Costo de envío por km (USD)</span>
            <input v-model.number="deliveryPricePerKm" type="number" min="0" step="0.05" :disabled="loading || saving" />
            <small>Solo se usa cuando Picker no devuelve una cotización.</small>
          </label>
        </div>

        <label class="iva-card__toggle" :class="{ active: pricesIncludeIva }">
          <input v-model="pricesIncludeIva" type="checkbox" :disabled="loading || saving" />
          <span>
            <strong>Los precios incluyen IVA</strong>
            <small>Desactívalo solo si el catálogo pasa a manejar precios sin impuesto.</small>
          </span>
        </label>

        <div class="iva-card__actions">
          <button type="button" class="primary" :disabled="loading || saving" @click="save">
            <i class="fa-solid fa-floppy-disk" /> {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
          </button>
          <button type="button" class="ghost" :disabled="loading || applying" @click="applyIva">
            <i class="fa-solid fa-wand-magic-sparkles" /> {{ applying ? 'APLICANDO...' : `APLICAR ${ivaRate}% A TODO EL CATÁLOGO` }}
          </button>
        </div>
        <small class="iva-card__hint">
          Guardar cambia la tasa por defecto de los productos nuevos. Para reescribir los
          productos que ya existen, usa el botón de aplicar a todo el catálogo.
        </small>
      </article>

      <article class="panel iva-card">
        <header>
          <div class="icon"><i class="fa-solid fa-star" /></div>
          <div><p>Fidelidad</p><h2>Programa de puntos</h2></div>
        </header>

        <p class="iva-card__lead">
          El cliente <strong>gana puntos por cada compra</strong> y puede canjearlos como descuento
          escribiendo su correo en el checkout. Con los valores de abajo:
          cada <strong>${{ pointsEarnDollars }}</strong> de compra entrega
          <strong>{{ pointsEarnAmount }} punto(s)</strong>, y
          <strong>{{ pointsRedeemPerDollar }} puntos valen $1</strong> de descuento.
        </p>

        <div class="iva-card__fields">
          <label>
            <span>Cada cuántos dólares se dan puntos</span>
            <input v-model.number="pointsEarnDollars" type="number" min="0.01" step="0.5" :disabled="loading || saving" />
          </label>
          <label>
            <span>Puntos que entrega ese bloque</span>
            <input v-model.number="pointsEarnAmount" type="number" min="0" step="1" :disabled="loading || saving" />
          </label>
          <label>
            <span>Puntos que valen $1 al canjear</span>
            <input v-model.number="pointsRedeemPerDollar" type="number" min="1" step="10" :disabled="loading || saving" />
          </label>
        </div>

        <label class="iva-card__toggle" :class="{ active: pointsEnabled }">
          <input v-model="pointsEnabled" type="checkbox" :disabled="loading || saving" />
          <span>
            <strong>Programa de puntos activo</strong>
            <small>Al desactivarlo no se ganan ni canjean puntos; los saldos se conservan.</small>
          </span>
        </label>

        <div class="iva-card__actions">
          <button type="button" class="primary" :disabled="loading || saving" @click="save">
            <i class="fa-solid fa-floppy-disk" /> {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
          </button>
        </div>
        <small class="iva-card__hint">
          Los puntos extra por producto (Rewards) se suman a la tarifa por dólar. Los puntos se
          acreditan al confirmarse el pago y aparecen en el ticket de cada pedido.
        </small>
      </article>

      <section class="settings-grid">
        <article class="panel picker-card">
          <header><div class="icon"><i class="fa-solid fa-truck-fast" /></div><div><p>Modelo activo</p><h2>Delivery gestionado por Picker</h2></div><span class="status"><i class="fa-solid fa-circle-check" /> Activo</span></header>
          <div class="capabilities">
            <div><i class="fa-solid fa-tag" /><span><strong>Cotización automática</strong><small>El valor se calcula según origen, destino y disponibilidad.</small></span></div>
            <div><i class="fa-solid fa-motorcycle" /><span><strong>Asignación de conductor</strong><small>Picker busca y asigna el repartidor para cada pedido.</small></span></div>
            <div><i class="fa-solid fa-location-dot" /><span><strong>Seguimiento del pedido</strong><small>El estado de la entrega se actualiza desde la operación de Picker.</small></span></div>
          </div>
          <footer><i class="fa-solid fa-shield-heart" /> Las sucursales deben tener su cuenta de Picker configurada para operar.</footer>
        </article>

        <article class="panel internal-card">
          <div class="internal-card__top"><div class="icon"><i class="fa-solid fa-wallet" /></div><span>Próximamente</span></div>
          <h2>Cobro y entrega interna</h2>
          <p>Si Boloncity decide cobrar el delivery directamente o manejar repartidores propios, necesitaremos separar esta operación de la administración general.</p>
          <div class="requirement"><i class="fa-solid fa-user-gear" /><p><strong>Requiere un perfil adicional de logística.</strong><br />Este perfil podrá definir tarifas, asignar conductores, revisar liquidaciones y gestionar incidencias de entrega.</p></div>
          <button type="button" disabled><i class="fa-solid fa-lock" /> Requiere perfil de logística</button>
        </article>
      </section>

      <section class="next panel"><div><p>Antes de activar entrega interna</p><h2>Crear un perfil de logística y sus permisos.</h2></div><span>Evita que usuarios administrativos modifiquen cobros, repartidores o liquidaciones sin autorización.</span></section>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.settings { display:flex; flex-direction:column; gap:1rem; padding:clamp(.75rem,2vw,1.5rem); }
.hero { align-items:flex-start; background:linear-gradient(135deg,#173e22,#235931); color:#fff; display:flex; flex-direction:column; gap:1rem; justify-content:space-between; padding:1.25rem; }
.hero p,.next p { color:#efd537; font-size:.7rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }.hero h1 { font-size:clamp(1.7rem,4vw,2.5rem); margin:.35rem 0; }.hero > div > span { color:rgba(255,255,255,.75); }
.provider { align-items:center; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); border-radius:14px; display:flex; flex-wrap:wrap; gap:.45rem; padding:.7rem .85rem; }.provider > i { color:#efd537; }.provider span { color:rgba(255,255,255,.68); font-size:.72rem; }.provider strong { flex-basis:100%; font-size:1rem; }
.notice { align-items:flex-start; background:#fff9d7; border:1px solid rgba(239,213,55,.7); border-radius:14px; color:#453e0b; display:flex; gap:.7rem; padding:.9rem 1rem; }.notice > i { color:#b59a00; margin-top:.15rem; }.notice p { font-size:.84rem; line-height:1.5; }
.iva-card { display:flex; flex-direction:column; gap:.9rem; padding:1rem; }
.iva-card header { align-items:flex-start; display:flex; gap:.7rem; }
.iva-card__lead { color:var(--admin-muted); font-size:.84rem; line-height:1.5; }
.iva-card__fields { display:flex; flex-direction:column; gap:.7rem; }
.iva-card__fields label { display:flex; flex-direction:column; gap:.3rem; flex:1 1 180px; }
.iva-card__fields label > span { color:#235931; font-size:.7rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }
.iva-card__fields input { background:#fff; border:1px solid rgba(8,17,13,.14); border-radius:12px; color:#152019; font-size:1rem; font-weight:800; min-height:46px; padding:.55rem .7rem; }
.iva-card__fields small { color:var(--admin-muted); font-size:.72rem; }
.iva-card__toggle { align-items:flex-start; background:#f8fbf8; border:1px solid rgba(35,89,49,.14); border-radius:14px; cursor:pointer; display:flex; gap:.6rem; padding:.75rem; }
.iva-card__toggle.active { background:rgba(35,89,49,.08); border-color:rgba(35,89,49,.3); }
.iva-card__toggle input { accent-color:#235931; margin-top:.2rem; }
.iva-card__toggle span { display:flex; flex-direction:column; gap:.15rem; }
.iva-card__toggle strong { font-size:.86rem; }
.iva-card__toggle small { color:var(--admin-muted); font-size:.74rem; line-height:1.4; }
.iva-card__actions { display:flex; flex-direction:column; gap:.5rem; }
.iva-card__actions button { align-items:center; border-radius:12px; display:flex; font-size:.74rem; font-weight:900; gap:.45rem; justify-content:center; letter-spacing:.05em; min-height:46px; padding:.7rem 1rem; }
.iva-card__actions .primary { background:#235931; border:0; color:#fff; }
.iva-card__actions .ghost { background:#fff; border:1px solid rgba(35,89,49,.3); color:#235931; }
.iva-card__actions button:disabled { opacity:.55; }
.iva-card__hint { color:var(--admin-muted); font-size:.73rem; line-height:1.45; }
@media (min-width:640px) { .iva-card__fields { flex-direction:row; }.iva-card__actions { flex-direction:row; }.iva-card__actions button { flex:0 0 auto; min-width:180px; } }
.settings-grid { display:flex; flex-direction:column; gap:1rem; }.settings-grid > article { padding:1rem; }.picker-card header { align-items:flex-start; display:flex; flex-wrap:wrap; gap:.7rem; }.icon { align-items:center; background:rgba(35,89,49,.1); border-radius:12px; color:#235931; display:flex; flex:0 0 42px; height:42px; justify-content:center; width:42px; }.picker-card header > div:nth-child(2) { flex:1; }.picker-card header p,.next span { color:var(--admin-muted); font-size:.72rem; }.picker-card h2,.internal-card h2,.next h2 { font-size:1.1rem; margin-top:.15rem; }.status { background:rgba(0,165,35,.1); border-radius:999px; color:#087c25; font-size:.7rem; font-weight:900; padding:.35rem .5rem; }.capabilities { display:flex; flex-direction:column; gap:.7rem; margin:1rem 0; }.capabilities > div { align-items:flex-start; background:#f8fbf8; border-radius:12px; display:flex; gap:.65rem; padding:.7rem; }.capabilities i { color:#235931; margin-top:.15rem; }.capabilities span { display:flex; flex-direction:column; gap:.15rem; }.capabilities strong { font-size:.82rem; }.capabilities small { color:var(--admin-muted); font-size:.74rem; line-height:1.35; }.picker-card footer { border-top:1px solid rgba(35,89,49,.1); color:rgba(8,17,13,.58); font-size:.73rem; padding-top:.8rem; }.picker-card footer i { color:#235931; margin-right:.35rem; }
.internal-card { background:linear-gradient(160deg,#fff,#f8f7f1); border:1px solid rgba(8,17,13,.1); }.internal-card__top { align-items:center; display:flex; justify-content:space-between; }.internal-card__top span { background:rgba(8,17,13,.08); border-radius:999px; color:rgba(8,17,13,.55); font-size:.67rem; font-weight:900; padding:.35rem .55rem; text-transform:uppercase; }.internal-card > p { color:var(--admin-muted); font-size:.83rem; line-height:1.5; margin:.65rem 0 1rem; }.requirement { align-items:flex-start; background:#fff; border:1px solid rgba(8,17,13,.1); border-radius:12px; display:flex; gap:.65rem; padding:.75rem; }.requirement > i { color:#235931; margin-top:.1rem; }.requirement p { color:rgba(8,17,13,.62); font-size:.74rem; line-height:1.45; }.requirement strong { color:#152019; }.internal-card button { background:rgba(8,17,13,.08); border:0; border-radius:999px; color:rgba(8,17,13,.45); font-weight:800; margin-top:1rem; min-height:40px; padding:.55rem .8rem; }.next { align-items:flex-start; background:#152019; color:#fff; display:flex; flex-direction:column; gap:.5rem; padding:1rem; }.next span { color:rgba(255,255,255,.65); line-height:1.45; max-width:34rem; }
@media (min-width:720px) { .hero { align-items:center; flex-direction:row; }.provider { max-width:220px; }.settings-grid { flex-direction:row; }.settings-grid > article { flex:1; }.next { align-items:center; flex-direction:row; justify-content:space-between; } }
</style>
