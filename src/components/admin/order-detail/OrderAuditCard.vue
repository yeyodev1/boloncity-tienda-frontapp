<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { buildStory, clockTime, dayLabel, duration, relativeTime } from './orderStory'

const props = defineProps<{ order: OrderDTO }>()

const story = computed(() => buildStory(props.order))
const first = computed(() => story.value[0])
const last = computed(() => story.value[story.value.length - 1])

const isClosed = computed(() => props.order.status === 'delivered' || props.order.status === 'cancelled')
/** Cuánto tomó todo (cerrado) o cuánto lleva abierto. */
const elapsed = computed(() => {
  const start = props.order.createdAt || first.value?.at
  if (!start) return ''
  return isClosed.value ? duration(start, last.value?.at) : duration(start, new Date().toISOString())
})

/** Se agrupa por día solo si la historia cruza más de un día (pedidos programados, devoluciones al día siguiente). */
const groups = computed(() => {
  const result: Array<{ day: string; events: Array<(typeof story.value)[number] & { gap: string }> }> = []
  let previousAt = ''
  for (const event of story.value) {
    const day = dayLabel(event.at)
    let group = result[result.length - 1]
    if (!group || group.day !== day) {
      group = { day, events: [] }
      result.push(group)
    }
    const gap = previousAt ? duration(previousAt, event.at) : ''
    group.events.push({ ...event, gap: gap && gap !== '0 min' ? `+${gap}` : '' })
    previousAt = event.at
  }
  return result
})
</script>

<template>
  <article class="od-card story">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--green" aria-hidden="true"><i class="fa-solid fa-timeline" /></span>
      <div>
        <p class="card-head__eyebrow">Qué pasó</p>
        <h2>Historia del pedido</h2>
      </div>
      <span v-if="elapsed" class="card-head__pill" :class="isClosed ? 'card-head__pill--green' : 'card-head__pill--yellow'">
        <i class="fa-regular fa-clock" aria-hidden="true" /> {{ isClosed ? `Duró ${elapsed}` : `Abierto hace ${elapsed}` }}
      </span>
    </div>

    <p v-if="!story.length" class="od-note od-note--muted"><i class="fa-solid fa-circle-info" /> Este pedido no tiene movimientos registrados.</p>

    <div v-for="group in groups" :key="group.day" class="story__day">
      <p v-if="groups.length > 1" class="story__day-label">{{ group.day }}</p>
      <ol class="story__list">
        <li v-for="event in group.events" :key="event.key" class="story__item" :data-tone="event.tone">
          <span class="story__dot" aria-hidden="true"><i :class="['fa-solid', event.icon]" /></span>
          <div class="story__body">
            <div class="story__top">
              <strong>{{ event.title }}</strong>
              <time :datetime="event.at" :title="relativeTime(event.at)">{{ clockTime(event.at) }}</time>
            </div>
            <p v-if="event.detail" class="story__detail">{{ event.detail }}</p>
            <p class="story__meta">
              <span v-if="event.who"><i class="fa-regular fa-user" aria-hidden="true" /> {{ event.who }}</span>
              <span v-if="event.gap" class="story__gap">{{ event.gap }}</span>
            </p>
          </div>
        </li>
      </ol>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;

.story__day { display: flex; flex-direction: column; gap: 0.5rem; }

.story__day-label {
  color: var(--admin-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0.25rem 0 0;
  text-transform: capitalize;
}

.story__list { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.story__item {
  --tone: var(--admin-muted);
  --tone-soft: var(--admin-hover);

  display: flex;
  gap: 0.8rem;
  position: relative;

  // Línea que une un evento con el siguiente.
  &:not(:last-child)::before {
    background: var(--admin-line-strong);
    bottom: -2px;
    content: '';
    left: 15px;
    position: absolute;
    top: 34px;
    width: 2px;
  }

  &[data-tone='success'] { --tone: var(--admin-success); --tone-soft: var(--admin-success-soft); }
  &[data-tone='info'] { --tone: var(--admin-info); --tone-soft: var(--admin-info-soft); }
  &[data-tone='warning'] { --tone: var(--admin-warning); --tone-soft: var(--admin-warning-soft); }
  &[data-tone='danger'] { --tone: var(--admin-danger); --tone-soft: var(--admin-danger-soft); }
  &[data-tone='accent'] { --tone: var(--st-awaiting_pickup); --tone-soft: var(--st-awaiting_pickup-soft); }

  &:last-child .story__dot { box-shadow: 0 0 0 4px var(--tone-soft); }
}

.story__dot {
  align-items: center;
  background: var(--tone-soft);
  border: 1.5px solid color-mix(in srgb, var(--tone) 45%, transparent);
  border-radius: 50%;
  color: var(--tone);
  display: flex;
  flex: 0 0 32px;
  font-size: 0.72rem;
  height: 32px;
  justify-content: center;
  margin-top: 0.05rem;
  position: relative;
  z-index: 1;
}

.story__body { display: flex; flex: 1 1 auto; flex-direction: column; gap: 0.2rem; min-width: 0; padding-bottom: 1.05rem; }

.story__top {
  align-items: baseline;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;

  strong { font-size: 0.9rem; font-weight: 800; line-height: 1.3; min-width: 0; overflow-wrap: anywhere; }
  time { color: var(--admin-muted); flex: 0 0 auto; font-size: 0.78rem; font-variant-numeric: tabular-nums; font-weight: 700; }
}

.story__detail {
  color: var(--admin-muted);
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0;
  overflow-wrap: anywhere;
}

.story__meta {
  align-items: center;
  color: var(--admin-subtle);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.72rem;
  gap: 0.35rem 0.8rem;
  margin: 0;

  i { margin-right: 0.15rem; }
}

.story__gap {
  background: var(--admin-hover);
  border-radius: 999px;
  color: var(--admin-muted);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  padding: 0.05rem 0.45rem;
}
</style>
