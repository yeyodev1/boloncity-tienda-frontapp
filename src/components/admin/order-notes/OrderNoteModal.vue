<script setup lang="ts">
import ModalShell from '@/components/global/ModalShell.vue'
import type { OrderDTO } from '@/services/OrderService'
import OrderNoteHistory from './OrderNoteHistory.vue'

defineProps<{ open: boolean; order: OrderDTO | null; text: string; saving: boolean }>()
const emit = defineEmits<{ close: []; submit: []; 'update:text': [value: string] }>()
</script>
<template>
  <ModalShell :open="open" title="Bitácora de la orden" subtitle="Agrega contexto útil para cocina y operación." size="md" @close="emit('close')">
    <div v-if="order" class="notes"><section class="notes__order"><span class="notes__icon"><i class="fa-solid fa-receipt" /></span><div><small>Orden activa</small><strong>{{ order.orderNumber }}</strong><p>{{ order.customerName || order.customerEmail }} · {{ order.branch?.name || 'Sin sucursal' }}</p></div></section><label class="notes__composer"><span><i class="fa-solid fa-pen-to-square" /> Nueva nota</span><textarea :value="text" placeholder="Ej: cliente pidió entregar por la puerta lateral." @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)" /><small>La nota quedará registrada para el equipo.</small></label><div class="notes__actions"><button type="button" class="secondary" @click="emit('close')">Cancelar</button><button type="button" :disabled="saving || !text.trim()" @click="emit('submit')"><i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" /> {{ saving ? 'Guardando...' : 'Guardar nota' }}</button></div><OrderNoteHistory :audit="order.audit" /></div>
  </ModalShell>
</template>
<style scoped lang="scss">
.notes { display:flex; flex-direction:column; gap:1rem; }
.notes__order { align-items:center; background:var(--admin-accent-soft); border:1px solid var(--admin-line); border-radius:16px; display:flex; gap:.7rem; padding:.85rem; }
.notes__icon { align-items:center; background:var(--admin-accent); border-radius:12px; color:var(--admin-on-accent); display:flex; flex:0 0 42px; height:42px; justify-content:center; width:42px; }
.notes__order div { display:flex; flex-direction:column; min-width:0; }
.notes__order small,.notes__composer > span { color:var(--admin-accent); font-size:.68rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
.notes__order strong { color:var(--admin-text); font-size:1rem; }
.notes__order p,.notes__composer > small { color:var(--admin-muted); font-size:.75rem; margin:.15rem 0 0; }
.notes__composer { display:flex; flex-direction:column; gap:.45rem; }
.notes__composer textarea { background:var(--admin-input-bg); border:1px solid var(--admin-line-strong); border-radius:14px; color:var(--admin-text); min-height:110px; padding:.8rem; resize:vertical; }
.notes__composer textarea::placeholder { color:var(--admin-subtle); }
.notes__composer textarea:focus { border-color:var(--admin-accent); box-shadow:0 0 0 3px var(--admin-accent-soft); outline:0; }
.notes__actions { display:flex; flex-wrap:wrap; gap:.6rem; justify-content:flex-end; }
.notes__actions button { align-items:center; background:var(--admin-accent); border:0; border-radius:999px; color:var(--admin-on-accent); display:inline-flex; font-weight:800; gap:.4rem; min-height:42px; padding:.65rem .95rem; }
.notes__actions button:disabled { opacity:.45; }
.notes__actions .secondary { background:var(--admin-hover); color:var(--admin-text); }
</style>
