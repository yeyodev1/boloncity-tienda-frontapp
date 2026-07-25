<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { ACTION_ICONS, ACTION_LABELS } from './constants'

const props = defineProps<{ order: OrderDTO }>()
const audit = computed(() => [...(props.order.audit || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()))

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section v-if="audit.length" class="audit-card">
    <span class="audit-card__title"><i class="fa-solid fa-list-timeline" /> Auditoría</span>
    <div class="audit-card__body">
      <div v-for="entry in audit" :key="entry.timestamp" class="audit-row">
        <span class="audit-row__icon"><i :class="['fa-solid', ACTION_ICONS[entry.action] || 'fa-circle-info']" /></span>
        <div class="audit-row__copy">
          <strong>{{ ACTION_LABELS[entry.action] || entry.action }}</strong>
          <span v-if="entry.details">{{ entry.details }}</span>
          <small>{{ entry.performedByEmail }} {{ formatDate(entry.timestamp) }}</small>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.audit-card { background: rgba(255, 255, 255, 0.85); border: 1px solid rgba(35, 89, 49, 0.08); border-radius: 18px; overflow: hidden; }
.audit-card__title { align-items: center; border-bottom: 1px solid rgba(35, 89, 49, 0.06); color: rgba(8, 17, 13, 0.5); display: flex; font-size: 0.7rem; font-weight: 800; gap: 0.35rem; letter-spacing: 0.08em; padding: 0.75rem 1rem; text-transform: uppercase; }
.audit-card__title i { color: #235931; }
.audit-card__body { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.85rem 1rem; }
.audit-row { display: flex; gap: 0.7rem; padding: 0.45rem 0; position: relative; }
.audit-row:not(:last-child)::before { background: rgba(35, 89, 49, 0.1); content: ''; height: calc(100% + 0.45rem); left: 12px; position: absolute; top: 18px; width: 2px; }
.audit-row__icon { align-items: center; background: #235931; border-radius: 50%; color: #fff; display: flex; flex: 0 0 26px; font-size: 0.62rem; height: 26px; justify-content: center; position: relative; width: 26px; z-index: 1; }
.audit-row__copy { display: flex; flex: 1 1 0; flex-direction: column; gap: 0.1rem; }
.audit-row__copy strong { font-size: 0.85rem; }
.audit-row__copy span { color: rgba(8, 17, 13, 0.55); font-size: 0.8rem; line-height: 1.45; }
.audit-row__copy small { color: rgba(8, 17, 13, 0.4); font-size: 0.72rem; }
</style>
