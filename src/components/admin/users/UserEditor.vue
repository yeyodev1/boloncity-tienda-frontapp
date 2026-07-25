<script setup lang="ts">
import ModalShell from '@/components/global/ModalShell.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import type { UserForm } from './types'

defineProps<{
  open: boolean
  editing: boolean
  saving: boolean
  form: UserForm
  accountOptions: Array<{ value: string; label: string }>
  branchOptions: Array<{ value: string; label: string }>
}>()

const emit = defineEmits<{ close: []; submit: [] }>()
</script>

<template>
  <ModalShell :open="open" :title="editing ? 'Editar usuario' : 'Nuevo usuario'" subtitle="Define identidad, rol y alcance de acceso." size="md" @close="emit('close')">
    <form class="editor" @submit.prevent="emit('submit')">
      <section>
        <header><i class="fa-solid fa-id-card" /><div><h2>Identidad</h2><p>Datos de acceso al sistema.</p></div></header>
        <label><span>Correo electrónico</span><input v-model="form.email" type="email" required placeholder="usuario@boloncity.com" /></label>
        <label><span>{{ editing ? 'Nueva contraseña · Opcional' : 'Contraseña' }}</span><input v-model="form.password" type="password" :required="!editing" placeholder="••••••••" /></label>
        <label><span>Nombre <em>Opcional</em></span><input v-model="form.name" placeholder="Nombre completo" /></label>
      </section>
      <section>
        <header><i class="fa-solid fa-shield-halved" /><div><h2>Rol y acceso</h2><p>Controla qué puede administrar cada persona.</p></div></header>
        <BaseSelect v-model="form.accountType" :options="accountOptions" label="Tipo de cuenta" />
        <button type="button" class="scope" :class="{ active: form.allBranches }" @click="form.allBranches = !form.allBranches">
          <i class="fa-solid fa-building" /><span><strong>Acceso a todas las sucursales</strong><small>Úsalo para dueños o administradores globales.</small></span><b><i /></b>
        </button>
        <div class="branch-access">
          <div class="branch-access__heading"><span>Sucursales asignadas</span><small v-if="!form.allBranches">{{ form.branches.length ? `${form.branches.length} seleccionada${form.branches.length === 1 ? '' : 's'}` : 'Selecciona una o más sucursales' }}</small><small v-else>El acceso global está activo</small></div>
          <BaseSelect v-model="form.branches" :options="branchOptions" placeholder="Elegir sucursales" multiple searchable inline-panel :disabled="form.allBranches" />
        </div>
      </section>
      <footer><button type="button" class="secondary" @click="emit('close')">Cancelar</button><button type="submit" :disabled="saving"><i class="fa-solid fa-floppy-disk" /> {{ saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario' }}</button></footer>
    </form>
  </ModalShell>
</template>

<style scoped lang="scss">
.editor { display:flex; flex-direction:column; gap:1rem; }
.editor section { background:#f8fbf8; border:1px solid rgba(35,89,49,.12); border-radius:16px; display:flex; flex-flow:row wrap; gap:.75rem; padding:1rem; }
.editor header { align-items:center; display:flex; flex-basis:100%; gap:.6rem; }
.editor header > i { align-items:center; background:rgba(35,89,49,.1); border-radius:10px; color:#235931; display:flex; height:38px; justify-content:center; width:38px; }
.editor h2 { font-size:1rem; }.editor p,.editor small { color:rgba(8,17,13,.58); font-size:.75rem; }
.editor label { display:flex; flex:1 1 190px; flex-direction:column; gap:.35rem; }
.editor label span,.branch-access__heading > span { color:#235931; font-size:.7rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
.editor em { color:rgba(8,17,13,.45); font-size:.63rem; font-style:normal; text-transform:none; }
.editor input { background:#fff; border:1px solid rgba(8,17,13,.12); border-radius:11px; min-height:42px; padding:.55rem .65rem; }
.scope { align-items:center; background:#fff; border:1px solid rgba(8,17,13,.1); border-radius:13px; color:#152019; cursor:pointer; display:flex; flex:1 1 100%; gap:.6rem; padding:.7rem; text-align:left; }
.scope > i { color:#235931; }.scope span { display:flex; flex:1; flex-direction:column; }.scope strong { font-size:.8rem; }
.scope b { background:rgba(8,17,13,.16); border-radius:999px; height:22px; padding:3px; width:38px; }.scope b i { background:#fff; border-radius:50%; display:block; height:16px; transition:transform .2s; width:16px; }
.scope.active { background:rgba(35,89,49,.08); border-color:rgba(35,89,49,.3); }.scope.active b { background:#235931; }.scope.active b i { transform:translateX(16px); }
.branch-access { display:flex; flex:1 1 100%; flex-direction:column; gap:.45rem; }.branch-access__heading { align-items:baseline; display:flex; flex-wrap:wrap; gap:.45rem; justify-content:space-between; }.branch-access__heading small { color:rgba(8,17,13,.5); }
footer { display:flex; flex-wrap:wrap; gap:.65rem; justify-content:flex-end; }.editor footer button { background:#235931; border:0; border-radius:999px; color:#fff; font-weight:800; min-height:42px; padding:.65rem .9rem; }.editor footer .secondary { background:rgba(8,17,13,.07); color:#152019; }.editor footer button:disabled { opacity:.45; }
</style>
