<script setup lang="ts">
import { computed } from 'vue'
import type { BranchDTO } from '@/services/BranchService'

const props = defineProps<{ branches: BranchDTO[]; loading: boolean }>()
const emit = defineEmits<{ create: []; edit: [branch: BranchDTO]; remove: [branch: BranchDTO]; picker: [branch: BranchDTO] }>()

/**
 * El estado sale de la llave que la sucursal tiene guardada en cada entorno, no de
 * `creationStatus`: ese campo quedó con valores distintos según cómo se vinculó cada una
 * (`linked` desde el script, `active`/`imported` desde la API) y marcaba todo como
 * pendiente aunque estuviera conectada.
 */
function checks(branch: BranchDTO) {
  return [
    { key: 'prod', label: 'Picker prod', icon: 'fa-truck-fast', ok: Boolean(branch.pickerStore?.hasProdKey) },
    { key: 'dev', label: 'Picker dev', icon: 'fa-flask', ok: Boolean(branch.pickerStore?.hasDevKey) },
    { key: 'pay', label: 'PayPhone', icon: 'fa-credit-card', ok: Boolean(branch.payphone?.storeId) },
    { key: 'geo', label: 'Ubicación', icon: 'fa-location-crosshairs', ok: branch.coordinates?.lat != null },
  ]
}

/**
 * Lista para operar = tiene lo que hace falta en el entorno que corre el backend.
 * La llave del otro entorno se muestra, pero no bloquea: no afecta a esta operación.
 */
function faltantes(branch: BranchDTO) {
  const entorno = branch.pickerEnv === 'production' ? 'prod' : 'dev'
  return checks(branch)
    .filter((c) => !c.ok && (c.key !== 'prod' || entorno === 'prod') && (c.key !== 'dev' || entorno === 'dev'))
    .map((c) => c.label)
}

const entornoLabel = computed(() => (props.branches[0]?.pickerEnv === 'production' ? 'producción' : 'desarrollo'))

function horario(branch: BranchDTO) {
  const abierto = branch.openingHours?.find((d) => d.isOpen)
  if (!abierto) return 'Sin horario configurado'
  const dias = branch.openingHours?.filter((d) => d.isOpen).length || 0
  return `${abierto.opensAt} - ${abierto.closesAt} · ${dias} ${dias === 1 ? 'día' : 'días'}`
}
</script>

<template>
  <section class="branches cui-panel">
    <header class="branches__head">
      <div><h2>Locales</h2><p>Lo que falta configurar aparece en amarillo.</p></div>
      <span class="cui-chip"><i class="fa-solid fa-server" aria-hidden="true" /> Entorno de {{ entornoLabel }}</span>
    </header>

    <ul v-if="loading" class="branches__list" aria-hidden="true">
      <li v-for="n in 4" :key="n" class="branch"><span class="sk sk--avatar" /><span class="sk sk--line" /></li>
    </ul>

    <div v-else-if="!branches.length" class="cui-empty">
      <i class="fa-solid fa-store" aria-hidden="true" />
      <strong>Aún no hay sucursales</strong>
      <p>Crea el primer local para empezar a recibir pedidos.</p>
      <button type="button" class="cui-btn cui-btn--primary" @click="emit('create')"><i class="fa-solid fa-plus" /> Crear sucursal</button>
    </div>

    <ul v-else class="branches__list">
      <li v-for="branch in branches" :key="branch._id" class="branch" :class="{ 'is-off': !branch.isActive }">
        <span class="branch__avatar">
          <img v-if="branch.imageUrl" :src="branch.imageUrl" :alt="branch.name" loading="lazy" />
          <i v-else class="fa-solid fa-store" aria-hidden="true" />
        </span>

        <div class="branch__body">
          <div class="branch__title">
            <strong>{{ branch.name }}</strong>
            <span class="cui-chip" :class="branch.isActive ? 'cui-chip--good' : 'cui-chip--bad'">{{ branch.isActive ? 'Activa' : 'Inactiva' }}</span>
          </div>
          <p class="branch__meta">
            <span><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ branch.address || branch.city || 'Sin dirección' }}</span>
            <span><i class="fa-regular fa-clock" aria-hidden="true" /> {{ horario(branch) }}</span>
          </p>
          <p v-if="faltantes(branch).length" class="branch__status is-warn">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Falta: {{ faltantes(branch).join(' · ') }}
          </p>
          <p v-else class="branch__status is-ok"><i class="fa-solid fa-circle-check" aria-hidden="true" /> Lista para cobrar y despachar</p>
          <!-- La tira de integraciones solo aparece si falta algo: con todo listo basta la línea verde. -->
          <ul v-if="faltantes(branch).length" class="branch__checks" aria-label="Integraciones">
            <li v-for="c in checks(branch)" :key="c.key" :class="{ off: !c.ok }" :title="c.ok ? `${c.label}: listo` : `${c.label}: falta`">
              <i class="fa-solid" :class="c.ok ? 'fa-check' : 'fa-xmark'" aria-hidden="true" /> {{ c.label }}
            </li>
          </ul>
        </div>

        <div class="branch__actions">
          <button type="button" class="cui-btn cui-btn--ghost" @click="emit('picker', branch)">
            <i class="fa-solid fa-plug" /> {{ branch.pickerStore?.hasProdKey || branch.pickerStore?.hasDevKey ? 'Picker' : 'Conectar Picker' }}
          </button>
          <button type="button" class="cui-icon-btn" :aria-label="`Editar ${branch.name}`" title="Editar" @click="emit('edit', branch)"><i class="fa-solid fa-pen" /></button>
          <button type="button" class="cui-icon-btn is-danger" :aria-label="`Eliminar ${branch.name}`" title="Eliminar" @click="emit('remove', branch)"><i class="fa-solid fa-trash" /></button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.branches { overflow: hidden; }

.branches__head {
  align-items: flex-start;
  border-bottom: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: space-between;
  padding: 1rem;

  h2 { font-size: 1rem; margin: 0; }
  p { color: var(--admin-muted); font-size: 0.8rem; margin: 0.15rem 0 0; }
}

.branches__list { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.branch {
  align-items: flex-start;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 0.9rem;
  padding: 0.9rem 1rem;
  transition: background-color 0.2s ease;

  &:first-child { border-top: 0; }
  &:hover { background: var(--admin-hover); }
  &.is-off .branch__avatar { filter: grayscale(1); opacity: 0.6; }
}

.branch__avatar {
  align-items: center;
  background: var(--admin-accent-soft);
  border-radius: 14px;
  color: var(--admin-accent);
  display: flex;
  flex: 0 0 52px;
  height: 52px;
  justify-content: center;
  overflow: hidden;

  img { height: 100%; object-fit: cover; width: 100%; }
}

.branch__body { display: flex; flex: 1 1 calc(100% - 70px); flex-direction: column; gap: 0.3rem; min-width: 0; }
.branch__title { align-items: center; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.branch__title strong { font-size: 0.98rem; }

.branch__meta {
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.76rem;
  gap: 0.15rem 0.9rem;
  margin: 0;

  i { margin-right: 0.15rem; opacity: 0.7; width: 12px; }
}

.branch__status {
  align-items: center;
  display: flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 0.35rem;
  margin: 0.1rem 0 0;

  &.is-warn { color: var(--admin-warning); }
  &.is-ok { color: var(--admin-success); }
}

.branch__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  list-style: none;
  margin: 0.15rem 0 0;
  padding: 0;

  li {
    align-items: center;
    background: var(--admin-success-soft);
    border-radius: 999px;
    color: var(--admin-success);
    display: inline-flex;
    font-size: 0.68rem;
    font-weight: 700;
    gap: 0.25rem;
    padding: 0.2rem 0.55rem;
  }

  li.off { background: var(--admin-hover); color: var(--admin-muted); }
  i { font-size: 0.6rem; }
}

.branch__actions { align-items: center; display: flex; gap: 0.35rem; margin-left: auto; }

.sk { animation: sk 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 8px; display: block; }
.sk--avatar { border-radius: 14px; flex: 0 0 52px; height: 52px; }
.sk--line { align-self: center; flex: 0 1 45%; height: 14px; }
@keyframes sk { 50% { opacity: 0.45; } }

@media (min-width: 900px) {
  .branch { flex-wrap: nowrap; }
  .branch__body { flex: 1 1 auto; }
  .branch__actions { align-self: center; }
}

@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
</style>
