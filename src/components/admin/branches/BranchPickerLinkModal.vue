<script setup lang="ts">
import { ref, watch } from 'vue'
import ModalShell from '@/components/global/ModalShell.vue'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ open: boolean; branch: BranchDTO | null }>()
const emit = defineEmits<{ close: []; linked: [branch: BranchDTO] }>()

type PickerEnv = 'development' | 'production'
interface PickerStore { companyName: string; token: string; linkedTo: string | null }

const environment = ref<PickerEnv>('production')
const stores = ref<PickerStore[]>([])
const loading = ref(false)
const linkingToken = ref('')
const loadError = ref('')
const { success, error } = useToast()

async function load() {
  if (!props.branch) return
  loading.value = true
  loadError.value = ''
  stores.value = []
  try {
    stores.value = (await BranchService.pickerStores(environment.value)).data.stores
  } catch (requestError: any) {
    loadError.value = requestError?.message || 'No se pudieron listar las tiendas de Picker.'
  } finally {
    loading.value = false
  }
}

async function link(store: PickerStore) {
  if (!props.branch) return
  try {
    linkingToken.value = store.token
    const response = await BranchService.linkPickerStore(props.branch._id, store.token, environment.value)
    success(`${props.branch.name} quedó vinculada a "${store.companyName}"`)
    emit('linked', response.data)
  } catch (requestError: any) {
    error(requestError?.message || 'No se pudo vincular la tienda.')
  } finally {
    linkingToken.value = ''
  }
}

function currentKey(env: PickerEnv) {
  return env === 'production' ? props.branch?.pickerStore?.hasProdKey : props.branch?.pickerStore?.hasDevKey
}

watch(() => [props.open, environment.value], () => { if (props.open) void load() }, { immediate: true })
</script>

<template>
  <ModalShell
    :open="open"
    :title="branch ? `Conectar ${branch.name} con Picker` : 'Conectar con Picker'"
    subtitle="Vincula la sucursal a una tienda que ya existe en Picker. No se crea ninguna nueva."
    size="lg"
    @close="emit('close')"
  >
    <div class="link">
      <div class="link__env">
        <button type="button" :class="{ active: environment === 'production' }" @click="environment = 'production'">
          Producción <i v-if="currentKey('production')" class="fa-solid fa-circle-check" />
        </button>
        <button type="button" :class="{ active: environment === 'development' }" @click="environment = 'development'">
          Desarrollo <i v-if="currentKey('development')" class="fa-solid fa-circle-check" />
        </button>
      </div>

      <p class="link__note">
        <i class="fa-solid fa-circle-info" />
        Cada entorno de Picker tiene sus propias tiendas y llaves. Vincular aquí solo afecta
        al entorno seleccionado.
      </p>

      <p v-if="loading" class="link__state"><i class="fa-solid fa-spinner fa-spin" /> Cargando tiendas de Picker...</p>
      <p v-else-if="loadError" class="link__state link__state--bad"><i class="fa-solid fa-triangle-exclamation" /> {{ loadError }}</p>
      <p v-else-if="!stores.length" class="link__state"><i class="fa-solid fa-store-slash" /> Picker no devolvió tiendas en este entorno.</p>

      <div v-else class="link__list">
        <article v-for="store in stores" :key="store.token" class="store" :class="{ taken: store.linkedTo && store.linkedTo !== branch?.name }">
          <div class="store__info">
            <strong>{{ store.companyName }}</strong>
            <small v-if="store.linkedTo === branch?.name" class="store__mine"><i class="fa-solid fa-link" /> Vinculada a esta sucursal</small>
            <small v-else-if="store.linkedTo"><i class="fa-solid fa-lock" /> Ya usada por {{ store.linkedTo }}</small>
            <small v-else>Disponible</small>
          </div>
          <button
            type="button"
            :disabled="Boolean(linkingToken) || store.linkedTo === branch?.name"
            @click="link(store)"
          >
            <i :class="linkingToken === store.token ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plug'" />
            {{ store.linkedTo === branch?.name ? 'VINCULADA' : linkingToken === store.token ? 'VINCULANDO...' : 'VINCULAR' }}
          </button>
        </article>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped lang="scss">
.link { display:flex; flex-direction:column; gap:.85rem; }
.link__env { background:rgba(35,89,49,.07); border-radius:999px; display:flex; gap:.25rem; padding:.28rem; }
.link__env button { align-items:center; border-radius:999px; color:rgba(8,17,13,.6); display:flex; flex:1 1 0; font-size:.8rem; font-weight:800; gap:.4rem; justify-content:center; min-height:42px; padding:.5rem .8rem; }
.link__env button.active { background:#235931; color:#fff; }
.link__env i { font-size:.72rem; }
.link__note { align-items:flex-start; background:#f8fbf8; border-radius:12px; color:rgba(8,17,13,.6); display:flex; font-size:.78rem; gap:.45rem; line-height:1.45; padding:.65rem .75rem; }
.link__note i { color:#235931; margin-top:.15rem; }
.link__state { align-items:center; color:rgba(8,17,13,.6); display:flex; font-size:.84rem; gap:.45rem; padding:.8rem 0; }
.link__state--bad { color:#a52323; }
.link__list { display:flex; flex-direction:column; gap:.5rem; max-height:52vh; overflow-y:auto; }
.store { align-items:center; border:1px solid rgba(8,17,13,.1); border-radius:14px; display:flex; flex-wrap:wrap; gap:.6rem; justify-content:space-between; padding:.7rem .8rem; }
.store.taken { background:rgba(8,17,13,.03); opacity:.75; }
.store__info { display:flex; flex:1 1 180px; flex-direction:column; gap:.15rem; }
.store__info strong { font-size:.9rem; }
.store__info small { color:rgba(8,17,13,.5); font-size:.72rem; }
.store__mine { color:#235931 !important; font-weight:800; }
.store button { align-items:center; background:#235931; border-radius:999px; color:#fff; display:flex; font-size:.7rem; font-weight:900; gap:.4rem; letter-spacing:.04em; min-height:40px; padding:.5rem .9rem; }
.store button:disabled { background:rgba(8,17,13,.12); color:rgba(8,17,13,.45); }
</style>
