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
  <section class="branches-list panel">
    <header>
      <div>
        <p>Red operativa</p>
        <h2>Sucursales registradas</h2>
      </div>
      <span class="entorno"><i class="fa-solid fa-server" /> Entorno: {{ entornoLabel }}</span>
    </header>

    <div v-if="loading" class="empty"><i class="fa-solid fa-spinner fa-spin" /> Cargando sucursales</div>

    <div v-else-if="!branches.length" class="empty">
      <i class="fa-solid fa-store-slash" />
      <strong>Aún no hay sucursales</strong>
      <button type="button" @click="emit('create')"><i class="fa-solid fa-plus" /> Crear la primera</button>
    </div>

    <div v-else class="list">
      <article v-for="branch in branches" :key="branch._id">
        <div class="cabecera">
          <div class="avatar">
            <img v-if="branch.imageUrl" :src="branch.imageUrl" :alt="branch.name" />
            <i v-else class="fa-solid fa-store" />
          </div>
          <div class="titulo">
            <strong>{{ branch.name }}</strong>
            <small>{{ branch.city || 'Ciudad sin definir' }}</small>
          </div>
          <span class="estado" :class="branch.isActive ? 'estado--on' : 'estado--off'">
            {{ branch.isActive ? 'Activa' : 'Inactiva' }}
          </span>
        </div>

        <p class="dato"><i class="fa-solid fa-location-dot" /> {{ branch.address || 'Sin dirección' }}</p>
        <p class="dato"><i class="fa-regular fa-clock" /> {{ horario(branch) }}</p>

        <p v-if="faltantes(branch).length" class="aviso">
          <i class="fa-solid fa-triangle-exclamation" />
          Falta configurar: <strong>{{ faltantes(branch).join(' · ') }}</strong>
        </p>
        <p v-else class="listo">
          <i class="fa-solid fa-circle-check" /> Lista para cobrar y despachar
        </p>

        <ul class="checks">
          <li v-for="c in checks(branch)" :key="c.key" :class="{ off: !c.ok }">
            <i class="fa-solid" :class="c.ok ? 'fa-check' : 'fa-xmark'" />
            <i class="fa-solid" :class="c.icon" />
            <span>{{ c.label }}</span>
          </li>
        </ul>

        <div class="actions">
          <button type="button" class="ghost" @click="emit('edit', branch)">
            <i class="fa-solid fa-pen" /> Editar
          </button>
          <button type="button" class="ghost" @click="emit('picker', branch)">
            <i class="fa-solid fa-plug" /> {{ branch.pickerStore?.hasProdKey || branch.pickerStore?.hasDevKey ? 'Picker' : 'Conectar Picker' }}
          </button>
          <button type="button" class="danger" :aria-label="`Eliminar ${branch.name}`" @click="emit('remove', branch)">
            <i class="fa-solid fa-trash" />
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.branches-list { padding: 1rem; }

.branches-list header {
  align-items: flex-start;
  display: flex;
  gap: .65rem;
  justify-content: space-between;
  margin-bottom: .85rem;
}

.branches-list header p { color: #235931; font-size: .7rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.branches-list h2 { font-size: 1.1rem; margin-top: .2rem; }

.entorno {
  background: rgba(8, 17, 13, .06);
  border-radius: 999px;
  color: var(--admin-muted);
  flex: 0 0 auto;
  font-size: .66rem;
  font-weight: 800;
  padding: .3rem .55rem;
  white-space: nowrap;
}

.list { display: flex; flex-direction: column; }

.list article {
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-direction: column;
  gap: .45rem;
  padding: .9rem 0;
}

.cabecera { align-items: center; display: flex; gap: .65rem; }

.avatar {
  align-items: center;
  background: rgba(35, 89, 49, .1);
  border-radius: 12px;
  color: #235931;
  display: flex;
  flex: 0 0 46px;
  height: 46px;
  justify-content: center;
  overflow: hidden;
  width: 46px;
}

.avatar img { height: 100%; object-fit: cover; width: 100%; }

.titulo { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.titulo strong { font-size: .95rem; overflow-wrap: anywhere; }
.titulo small { color: var(--admin-muted); font-size: .72rem; }

.estado {
  border-radius: 999px;
  flex: 0 0 auto;
  font-size: .6rem;
  font-weight: 900;
  letter-spacing: .04em;
  padding: .28rem .5rem;
  text-transform: uppercase;
}

.estado--on { background: rgba(35, 89, 49, .1); color: #235931; }
.estado--off { background: rgba(180, 35, 24, .1); color: #b42318; }

.dato {
  align-items: flex-start;
  color: var(--admin-muted);
  display: flex;
  font-size: .76rem;
  gap: .4rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.dato i { color: rgba(35, 89, 49, .55); margin-top: .15rem; width: 13px; }

// El estado resumido va primero y en una sola línea: es lo accionable.
.aviso,
.listo {
  align-items: flex-start;
  border-radius: 10px;
  display: flex;
  font-size: .76rem;
  gap: .4rem;
  line-height: 1.4;
  padding: .45rem .55rem;
}

.aviso { background: rgba(180, 35, 24, .08); color: #b42318; }
.aviso strong { font-weight: 900; }
.listo { background: rgba(0, 165, 35, .1); color: #087c25; font-weight: 700; }

// Los cuatro checks siempre visibles, pero como tira discreta: informan sin gritar.
.checks { display: flex; flex-wrap: wrap; gap: .3rem; list-style: none; margin: 0; padding: 0; }

.checks li {
  align-items: center;
  background: rgba(35, 89, 49, .08);
  border-radius: 999px;
  color: #235931;
  display: flex;
  font-size: .64rem;
  font-weight: 800;
  gap: .28rem;
  padding: .26rem .5rem;
}

.checks li.off { background: rgba(180, 35, 24, .08); color: #b42318; }
.checks li i:first-child { font-size: .6rem; }
.checks li i + i { opacity: .65; }

.actions { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .2rem; }

.actions button {
  align-items: center;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  font-size: .76rem;
  font-weight: 800;
  gap: .4rem;
  justify-content: center;
  min-height: 40px;
  padding: .55rem .8rem;
  transition: background-color .2s ease;
}

.actions .ghost { background: rgba(8, 17, 13, .07); color: var(--admin-text); flex: 1; }
.actions .ghost:hover { background: rgba(8, 17, 13, .12); }
.actions .danger { background: rgba(180, 35, 24, .1); color: #b42318; flex: 0 0 auto; }
.actions .danger:hover { background: rgba(180, 35, 24, .16); }

.empty {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-direction: column;
  gap: .55rem;
  padding: 2rem;
  text-align: center;
}

.empty i { color: #235931; font-size: 1.5rem; }

.empty button {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-weight: 800;
  gap: .4rem;
  min-height: 40px;
  padding: .55rem .9rem;
}

@media (min-width: 641px) {
  // En pantalla ancha la ficha se lee en dos columnas: datos a la izquierda, acciones a la derecha.
  .list article { display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; }
  .cabecera { flex: 1 1 260px; }
  .dato { flex: 1 1 100%; }
  .aviso, .listo { flex: 1 1 auto; }
  .checks { flex: 1 1 auto; }
  .actions { flex: 0 0 auto; margin-left: auto; margin-top: 0; }
  .actions .ghost { flex: 0 0 auto; }
}
</style>
