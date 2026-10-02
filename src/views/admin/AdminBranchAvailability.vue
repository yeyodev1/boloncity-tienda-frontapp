<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ProductService, { type BranchAvailabilityItem } from '@/services/ProductService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import { displayProductName, isCustomerCategory } from '@/utils/productName'

const { success, error } = useToast()
const userStore = useUserStore()
// El admin general elige la sucursal; el vendedor opera SIEMPRE la suya (no ve el selector).
const isAdmin = computed(() => userStore.allBranches || userStore.accountType === 'admin')
const branches = ref<BranchDTO[]>([])
const selectedBranch = ref('')

const products = ref<BranchAvailabilityItem[]>([])
const summary = ref({ total: 0, available: 0, unavailable: 0 })
const loading = ref(true)
const search = ref('')
const savingId = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`
// Fotos rotas: se cae al ícono en vez del recuadro de imagen rota.
const broken = ref(new Set<string>())
function markBroken(id: string) { broken.value = new Set(broken.value).add(id) }
// "Cocina", "Caja"… son grupos internos del POS: no le dicen nada al equipo.
function categoryLabel(category?: string) {
  return category && isCustomerCategory({ name: category }) ? displayProductName(category) : ''
}
// Filtro rápido en pantalla: qué está prendido y qué está apagado hoy.
const view = ref<'all' | 'on' | 'off'>('all')
const filtered = computed(() =>
  view.value === 'all' ? products.value : products.value.filter((item) => (view.value === 'on' ? item.available : !item.available)))

async function load() {
  // El admin general debe elegir sucursal primero.
  if (isAdmin.value && !selectedBranch.value) { products.value = []; loading.value = false; return }
  loading.value = true
  try {
    const res = await ProductService.getBranchAvailability({
      search: search.value.trim(),
      ...(isAdmin.value ? { branchId: selectedBranch.value } : {}),
    })
    products.value = res.data.products
    summary.value = res.data.summary
  } catch {
    error('No se pudo cargar la disponibilidad')
  } finally {
    loading.value = false
  }
}

function onBranchChange() {
  products.value = []
  summary.value = { total: 0, available: 0, unavailable: 0 }
  load()
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 300)
}

async function toggle(item: BranchAvailabilityItem) {
  if (item.globallyOff || savingId.value) return
  const next = !item.available
  savingId.value = item._id
  try {
    await ProductService.toggleBranchAvailability(item._id, next, isAdmin.value ? selectedBranch.value : undefined)
    item.available = next
    summary.value.available += next ? 1 : -1
    summary.value.unavailable += next ? -1 : 1
    success(next ? `${displayProductName(item.name)}: disponible` : `${displayProductName(item.name)}: apagado en la sucursal`)
  } catch {
    error('No se pudo actualizar el producto')
  } finally {
    savingId.value = ''
  }
}

onMounted(async () => {
  if (isAdmin.value) {
    try {
      branches.value = (await BranchService.getAll()).data.filter((b) => b.isActive !== false)
    } catch { /* deja el selector vacío */ }
  }
  await load()
})
</script>

<template>
  <AdminLayout>
    <main class="avail">
      <header class="avail__head">
        <p>{{ isAdmin ? 'Por sucursal' : 'Tu local, hoy' }}</p>
        <h1>Disponibilidad</h1>
        <span>Apaga lo que se acabó y préndelo cuando vuelva. No crea ni borra productos.</span>
      </header>

      <label v-if="isAdmin" class="avail__branch">
        <i class="fa-solid fa-store" aria-hidden="true" />
        <span class="sr-only">Sucursal</span>
        <select v-model="selectedBranch" @change="onBranchChange">
          <option value="">Elige una sucursal</option>
          <option v-for="b in branches" :key="b._id" :value="b._id">{{ b.name }}</option>
        </select>
        <i class="fa-solid fa-chevron-down avail__branch-chev" aria-hidden="true" />
      </label>

      <div v-if="isAdmin && !selectedBranch" class="avail__empty is-pick">
        <span aria-hidden="true"><i class="fa-solid fa-store" /></span>
        <strong>Elige una sucursal</strong>
        <p>Vas a ver sus productos y podrás prenderlos o apagarlos.</p>
      </div>

      <template v-if="!isAdmin || selectedBranch">
        <div class="avail__controls">
          <div class="avail__filter" role="group" aria-label="Mostrar">
            <button type="button" :class="{ active: view === 'all' }" @click="view = 'all'">Todos <b>{{ summary.total }}</b></button>
            <button type="button" class="is-on" :class="{ active: view === 'on' }" @click="view = 'on'">Disponibles <b>{{ summary.available }}</b></button>
            <button type="button" class="is-off" :class="{ active: view === 'off' }" @click="view = 'off'">Apagados <b>{{ summary.unavailable }}</b></button>
          </div>
          <label class="avail__search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <span class="sr-only">Buscar producto</span>
            <input v-model="search" type="search" placeholder="Buscar producto…" @input="onSearch" />
          </label>
        </div>

        <section class="avail__list" aria-live="polite">
          <div v-if="loading" class="avail__empty"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Cargando productos…</div>
          <div v-else-if="!filtered.length" class="avail__empty">
            <span aria-hidden="true"><i class="fa-solid fa-box-open" /></span>
            <strong>{{ view === 'off' ? 'Nada apagado' : 'Sin productos' }}</strong>
            <p>{{ view === 'off' ? 'Todo lo del menú está disponible en este local.' : 'Prueba con otra búsqueda.' }}</p>
          </div>
          <template v-else><article v-for="item in filtered" :key="item._id" class="avail__row" :class="{ 'is-off': !item.available, 'is-locked': item.globallyOff }">
            <div class="avail__thumb"><img v-if="item.image && !broken.has(item._id)" :src="item.image" alt="" loading="lazy" @error="markBroken(item._id)" /><i v-else class="fa-solid fa-utensils" aria-hidden="true" /></div>
            <div class="avail__info">
              <strong>{{ displayProductName(item.name) }}</strong>
              <small><template v-if="categoryLabel(item.category)">{{ categoryLabel(item.category) }} · </template>{{ money(item.price) }}</small>
              <span v-if="item.globallyOff" class="avail__locked"><i class="fa-solid fa-lock" aria-hidden="true" /> Apagado por administración</span>
            </div>
            <button
              type="button"
              class="avail__switch"
              role="switch"
              :class="{ active: item.available, busy: savingId === item._id }"
              :disabled="item.globallyOff || savingId === item._id"
              :aria-checked="item.available"
              :aria-label="`${displayProductName(item.name)}: ${item.available ? 'disponible' : 'apagado'}`"
              @click="toggle(item)"
            >
              <span class="avail__track"><span class="avail__knob"><i v-if="savingId === item._id" class="fa-solid fa-spinner fa-spin" aria-hidden="true" /></span></span>
              <em>{{ item.available ? 'Disponible' : 'Apagado' }}</em>
            </button>
          </article></template>
        </section>
      </template>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.avail { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.25rem 0 1.5rem; }

.avail__head {
  display: flex;
  flex-direction: column;

  p { color: var(--admin-muted); font-size: 0.78rem; font-weight: 700; margin: 0; }
  h1 { font-size: clamp(1.5rem, 5vw, 2.1rem); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; margin: 0.15rem 0 0.35rem; }
  span { color: var(--admin-muted); font-size: 0.86rem; max-width: 46ch; }
}

.avail__branch {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line-strong);
  border-radius: 14px;
  display: flex;
  gap: 0.6rem;
  max-width: 420px;
  padding: 0 0.9rem;
  position: relative;

  > i:first-child { color: var(--admin-accent); }

  select {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--admin-text);
    cursor: pointer;
    flex: 1 1 auto;
    font-size: 0.95rem;
    font-weight: 700;
    min-height: 50px;
    outline: none;
    padding: 0;
  }

  &:focus-within { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft); }
}

.avail__branch-chev { color: var(--admin-muted); font-size: 0.75rem; pointer-events: none; }

.avail__controls { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.avail__filter {
  background: var(--admin-hover);
  border-radius: 14px;
  display: flex;
  gap: 0.2rem;
  overflow-x: auto;
  padding: 0.2rem;

  button {
    align-items: center;
    background: transparent;
    border-radius: 11px;
    color: var(--admin-muted);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.82rem;
    font-weight: 800;
    gap: 0.4rem;
    min-height: 42px;
    padding: 0 0.85rem;

    b { font-variant-numeric: tabular-nums; }
    &.is-on b { color: var(--admin-success); }
    &.is-off b { color: var(--admin-danger); }
    &.active { background: var(--admin-surface); box-shadow: var(--admin-shadow); color: var(--admin-text); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.avail__search {
  align-items: center;
  background: var(--admin-input-bg);
  border: 1px solid var(--admin-line-strong);
  border-radius: 14px;
  display: flex;
  flex: 1 1 240px;
  gap: 0.55rem;
  padding: 0 0.85rem;

  &:focus-within { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft); }
  i { color: var(--admin-muted); }

  input {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    flex: 1 1 auto;
    min-height: 46px !important;
    min-width: 0;
    outline: none;
    padding: 0 !important;
  }
}

.avail__list {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.avail__row {
  align-items: center;
  border-bottom: 1px solid var(--admin-line);
  display: flex;
  gap: 0.8rem;
  padding: 0.7rem 0.85rem;
  transition: background 0.2s ease;

  &:last-child { border-bottom: 0; }
  &:hover { background: var(--admin-hover); }

  &.is-off {
    .avail__thumb img { filter: grayscale(1); opacity: 0.55; }
    .avail__info strong { color: var(--admin-muted); text-decoration: line-through; text-decoration-color: var(--admin-danger); text-decoration-thickness: 2px; }
  }
}

.avail__thumb {
  align-items: center;
  background: var(--admin-accent-soft);
  border-radius: 12px;
  color: var(--admin-accent);
  display: flex;
  flex: 0 0 52px;
  height: 52px;
  justify-content: center;
  overflow: hidden;

  img { height: 100%; object-fit: cover; transition: filter 0.3s ease, opacity 0.3s ease; width: 100%; }
}

.avail__info {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  strong { font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: var(--admin-muted); font-size: 0.78rem; }
}

.avail__locked { color: var(--admin-danger); font-size: 0.74rem; font-weight: 700; margin-top: 0.15rem; }

.avail__switch {
  align-items: center;
  background: transparent;
  border-radius: 999px;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 44px;
  padding: 0.2rem;

  em { color: var(--admin-danger); font-size: 0.68rem; font-style: normal; font-weight: 800; }
  &.active em { color: var(--admin-success); }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.avail__track {
  background: var(--admin-line-strong);
  border-radius: 999px;
  display: flex;
  height: 30px;
  padding: 3px;
  transition: background 0.25s var(--admin-ease);
  width: 54px;

  .active & { background: var(--admin-success); }
}

.avail__knob {
  align-items: center;
  background: var(--admin-surface);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  color: var(--admin-accent);
  display: flex;
  font-size: 0.7rem;
  height: 24px;
  justify-content: center;
  transition: transform 0.25s var(--admin-ease);
  width: 24px;

  .active & { transform: translateX(24px); }
}

.avail__empty {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 2.5rem 1rem;
  text-align: center;

  > span {
    align-items: center;
    background: var(--admin-accent-soft);
    border-radius: 50%;
    color: var(--admin-accent);
    display: flex;
    height: 50px;
    justify-content: center;
    margin-bottom: 0.3rem;
    width: 50px;
  }

  strong { color: var(--admin-text); }
  p { font-size: 0.84rem; margin: 0; }

  &.is-pick { background: var(--admin-surface); border: 1px dashed var(--admin-line-strong); border-radius: var(--admin-radius); }
}

.sr-only { clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; position: absolute; width: 1px; }

@media (prefers-reduced-motion: reduce) {
  .avail__track, .avail__knob, .avail__thumb img, .avail__row { transition: none; }
}
</style>
