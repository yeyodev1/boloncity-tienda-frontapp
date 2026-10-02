<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BranchService, { type BranchDTO } from '@/services/BranchService'

/** Los locales con su dirección, el horario de HOY y si están abiertos ahora (hora de Ecuador). */
const branches = ref<BranchDTO[]>([])
const loading = ref(true)

function nowInEcuador() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return { day: get('weekday').toLowerCase(), minutes: Number(get('hour')) % 24 * 60 + Number(get('minute')) }
}

const toMinutes = (value: string) => {
  const [hours, minutes] = String(value || '0:0').split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

const rows = computed(() => {
  const now = nowInEcuador()
  return branches.value.map((branch) => {
    const today = (branch.openingHours || []).find((hours) => hours.day === now.day && hours.isOpen !== false)
    const open = Boolean(today && now.minutes >= toMinutes(today.opensAt) && now.minutes < toMinutes(today.closesAt))
    const shortAddress = String(branch.address || '').replace(new RegExp(`^${branch.name},?\\s*`, 'i'), '').replace(/,?\s*Ecuador$/i, '')
    const maps = branch.googleMapsUrl || (branch.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}` : '')
    return { id: branch._id, name: branch.name.replace(/^Boloncity\s+/i, ''), address: shortAddress, hours: today ? `${today.opensAt} a ${today.closesAt}` : 'Cerrado hoy', open, maps }
  })
    // Primero los que atienden ahora.
    .sort((a, b) => Number(b.open) - Number(a.open))
})

const openCount = computed(() => rows.value.filter((row) => row.open).length)

onMounted(async () => {
  try {
    const response = await BranchService.getPublic()
    branches.value = (response.data || []).filter((branch) => (branch as BranchDTO & { isActive?: boolean }).isActive !== false)
  } catch {
    branches.value = []
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <section class="branches" aria-labelledby="branches-title">
    <header class="branches__head">
      <p class="eyebrow">Nuestros locales</p>
      <h2 id="branches-title">Hay un Boloncity cerca de ti</h2>
      <p v-if="rows.length" class="branches__lead">
        {{ rows.length }} locales · <strong>{{ openCount ? `${openCount} abierto${openCount === 1 ? '' : 's'} ahora` : 'todos cerrados ahora' }}</strong>
        <template v-if="!openCount"> · igual puedes programar tu pedido</template>
      </p>
    </header>

    <div v-if="loading" class="branches__list" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="branch branch--skeleton" />
    </div>
    <ul v-else class="branches__list">
      <li v-for="branch in rows" :key="branch.id" class="branch">
        <div class="branch__top">
          <strong>{{ branch.name }}</strong>
          <span class="branch__status" :class="{ 'is-open': branch.open }">{{ branch.open ? 'Abierto' : 'Cerrado' }}</span>
        </div>
        <p class="branch__address"><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ branch.address }}</p>
        <p class="branch__hours"><i class="fa-regular fa-clock" aria-hidden="true" /> Hoy: {{ branch.hours }}</p>
        <div class="branch__actions">
          <a v-if="branch.maps" :href="branch.maps" target="_blank" rel="noopener">Cómo llegar <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></a>
          <RouterLink to="/catalogo">Pedir <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.branches { display: flex; flex-direction: column; gap: 1.2rem; }

.eyebrow { color: #00a523; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; margin: 0 0 0.45rem; text-transform: uppercase; }

.branches__head h2 { color: #102719; font-size: clamp(1.7rem, 5vw, 2.6rem); font-weight: 800; letter-spacing: -0.045em; line-height: 1; margin: 0; }
.branches__lead { color: rgba(16, 39, 25, 0.62); font-size: 0.92rem; margin: 0.6rem 0 0; }
.branches__lead strong { color: #235931; }

/* Celular: carrusel horizontal (8 tarjetas apiladas eran más de una pantalla y media); escritorio: 4 por fila. */
.branches__list {
  display: flex;
  gap: 0.75rem;
  list-style: none;
  margin: 0 -1rem;
  overflow-x: auto;
  padding: 0.25rem 1rem 1rem;
  scroll-padding: 1rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.branch {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.06);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(16, 39, 25, 0.04), 0 12px 26px -18px rgba(16, 39, 25, 0.3);
  display: flex;
  flex: 0 0 78%;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.05rem;
  scroll-snap-align: start;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease;

  &:hover { box-shadow: 0 1px 2px rgba(16, 39, 25, 0.05), 0 20px 36px -20px rgba(35, 89, 49, 0.4); transform: translateY(-2px); }
}

.branch--skeleton { animation: pulse 1.4s ease-in-out infinite; background: #e8ebe2; height: 150px; }

.branch__top { align-items: center; display: flex; gap: 0.6rem; justify-content: space-between; }
.branch__top strong { color: #102719; font-size: 1.05rem; letter-spacing: -0.02em; }

.branch__status {
  align-items: center;
  background: rgba(16, 39, 25, 0.06);
  border-radius: 999px;
  color: rgba(16, 39, 25, 0.55);
  display: inline-flex;
  font-size: 0.7rem;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;

  &::before { background: currentColor; border-radius: 50%; content: ''; height: 7px; width: 7px; }

  &.is-open { background: rgba(0, 165, 35, 0.12); color: #0b7a24; }
}

.branch__address, .branch__hours { color: rgba(16, 39, 25, 0.62); font-size: 0.82rem; line-height: 1.4; margin: 0; }
.branch__address i, .branch__hours i { color: #235931; margin-right: 0.3rem; width: 0.9rem; }

.branch__actions {
  border-top: 1px solid rgba(16, 39, 25, 0.07);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.65rem;

  a { align-items: center; color: #235931; display: inline-flex; font-size: 0.82rem; font-weight: 800; gap: 0.4rem; }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
}

@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .branch { transition: none; }
  .branch:hover { transform: none; }
  .branch--skeleton { animation: none; }
}

@media (min-width: 640px) { .branch { flex-basis: 44%; } }
@media (min-width: 1024px) {
  .branches__list { flex-wrap: wrap; margin: 0; overflow: visible; padding: 0; }
  .branch { flex: 1 1 calc(25% - 0.6rem); max-width: calc(25% - 0.56rem); }
}
</style>
