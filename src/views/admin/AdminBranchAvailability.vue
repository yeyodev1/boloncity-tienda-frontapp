<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ProductService, { type BranchAvailabilityItem } from '@/services/ProductService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

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
const filtered = computed(() => products.value)

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
    success(next ? `“${item.name}” disponible` : `“${item.name}” desactivado en tu sucursal`)
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
      <section class="hero">
        <div>
          <p><i class="fa-solid fa-store" /> {{ isAdmin ? 'Administración' : 'Tu sucursal' }}</p>
          <h1>Disponibilidad de productos</h1>
          <span>{{ isAdmin ? 'Elige una sucursal y activa o desactiva sus productos.' : 'Activa o desactiva lo que hoy vendes en tu local.' }} No crea ni elimina productos.</span>
        </div>
      </section>

      <label v-if="isAdmin" class="branch-picker">
        <span>Sucursal</span>
        <select v-model="selectedBranch" @change="onBranchChange">
          <option value="">— Elige una sucursal —</option>
          <option v-for="b in branches" :key="b._id" :value="b._id">{{ b.name }}</option>
        </select>
      </label>

      <div v-if="isAdmin && !selectedBranch" class="empty pick"><i class="fa-solid fa-store" /> Elige una sucursal para ver y editar su disponibilidad.</div>

      <section v-if="!isAdmin || selectedBranch" class="stats">
        <article><small>Productos</small><strong>{{ summary.total }}</strong></article>
        <article class="on"><small>Disponibles</small><strong>{{ summary.available }}</strong></article>
        <article class="off"><small>Desactivados</small><strong>{{ summary.unavailable }}</strong></article>
      </section>

      <div v-if="!isAdmin || selectedBranch" class="search">
        <i class="fa-solid fa-magnifying-glass" />
        <input v-model="search" type="search" placeholder="Buscar producto…" @input="onSearch" />
      </div>
      <section v-if="!isAdmin || selectedBranch" class="list">
        <div v-if="loading" class="empty">Cargando productos…</div>
        <div v-else-if="!filtered.length" class="empty"><i class="fa-solid fa-box-open" /> Sin productos.</div>
        <article v-for="item in filtered" :key="item._id" class="row" :class="{ off: !item.available }">
          <div class="thumb"><img v-if="item.image" :src="item.image" :alt="item.name" /><i v-else class="fa-solid fa-utensils" /></div>
          <div class="info">
            <strong>{{ item.name }}</strong>
            <small>{{ item.category || 'Sin categoría' }} · {{ money(item.price) }}</small>
            <span v-if="item.globallyOff" class="global-off"><i class="fa-solid fa-lock" /> Desactivado por administración</span>
          </div>
          <button
            type="button"
            class="toggle"
            :class="{ active: item.available, busy: savingId === item._id }"
            :disabled="item.globallyOff || savingId === item._id"
            :aria-pressed="item.available"
            @click="toggle(item)"
          >
            <span class="knob"><i v-if="savingId === item._id" class="fa-solid fa-spinner fa-spin" /></span>
            <em>{{ item.available ? 'Disponible' : 'No disponible' }}</em>
          </button>
        </article>
      </section>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.avail { display: flex; flex-direction: column; gap: 1rem; padding: clamp(.75rem, 2vw, 1.5rem); }
.hero { background: linear-gradient(135deg, #173e22, #235931); border-radius: 20px; color: #fff; padding: 1.25rem; }
.hero p { color: #efd537; font-size: .7rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.hero h1 { font-size: clamp(1.5rem, 4vw, 2.2rem); margin: .35rem 0; }
.hero span { color: rgba(255,255,255,.8); }

.branch-picker { display: flex; flex-direction: column; gap: .4rem; }
.branch-picker span { color: #667; font-size: .68rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.branch-picker select { background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 14px; font-size: .95rem; min-height: 48px; padding: .7rem 1rem; }
.empty.pick { background: #fff; border: 1px dashed rgba(8,17,13,.18); border-radius: 16px; }

.stats { display: flex; flex-wrap: wrap; gap: .65rem; }
.stats article { align-items: center; background: #fff; border: 1px solid rgba(8,17,13,.08); border-radius: 16px; display: flex; flex: 1 1 110px; flex-direction: column; gap: .1rem; padding: .8rem; }
.stats small { color: #667; font-size: .64rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.stats strong { font-size: 1.5rem; }
.stats .on strong { color: #14682a; }
.stats .off strong { color: #a02828; }

.search { align-items: center; background: #fff; border: 1px solid rgba(8,17,13,.08); border-radius: 14px; display: flex; gap: .6rem; padding: .2rem .9rem; }
.search i { color: #9aa894; }
.search input { background: transparent; border: 0; flex: 1; font-size: .95rem; min-height: 46px; outline: none; }

.list { display: flex; flex-direction: column; gap: .6rem; }
.empty { color: #667; padding: 2.5rem 1rem; text-align: center; }
.row { align-items: center; background: #fff; border: 1px solid rgba(8,17,13,.08); border-radius: 16px; display: flex; gap: .85rem; padding: .75rem .9rem; }
.row.off { background: #fbf4f4; }
.thumb { align-items: center; background: rgba(35,89,49,.08); border-radius: 12px; display: flex; flex: none; height: 52px; justify-content: center; overflow: hidden; width: 52px; }
.thumb img { height: 100%; object-fit: cover; width: 100%; }
.thumb i { color: #235931; }
.info { display: flex; flex: 1; flex-direction: column; gap: .1rem; min-width: 0; }
.info strong { font-size: .98rem; }
.info small { color: #667; }
.global-off { color: #a02828; font-size: .75rem; font-weight: 700; margin-top: .15rem; }

.toggle {
  align-items: center;
  background: rgba(8,17,13,.08);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  flex: none;
  gap: .5rem;
  min-height: 44px;
  padding: .35rem .9rem .35rem .4rem;
  transition: background-color .2s ease;
}
.toggle em { color: #6b7a6e; font-size: .82rem; font-style: normal; font-weight: 800; }
.toggle .knob { align-items: center; background: #fff; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,.2); color: #235931; display: flex; height: 26px; justify-content: center; transition: transform .2s ease; width: 26px; }
.toggle.active { background: rgba(0,165,35,.9); }
.toggle.active em { color: #fff; }
.toggle.active .knob { transform: translateX(2px); }
.toggle:disabled { cursor: not-allowed; opacity: .55; }
</style>
