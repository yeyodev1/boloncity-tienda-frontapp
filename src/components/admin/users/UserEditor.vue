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
  <ModalShell :open="open" :title="editing ? 'Editar usuario' : 'Nuevo usuario'" subtitle="Acceso al panel y locales que puede manejar." size="md" @close="emit('close')">
    <form class="editor" @submit.prevent="emit('submit')">
      <section class="cui-section">
        <div class="cui-section__head"><i class="fa-solid fa-id-card" aria-hidden="true" /><div><h2>Datos de acceso</h2><p>Con esto entra al panel.</p></div></div>
        <label class="cui-field cui-half"><span>Correo</span><input v-model="form.email" type="email" required placeholder="usuario@boloncity.com" autocomplete="off" /></label>
        <label class="cui-field cui-half"><span>{{ editing ? 'Nueva contraseña' : 'Contraseña' }} <em v-if="editing">déjala vacía para no cambiarla</em></span><input v-model="form.password" type="password" :required="!editing" placeholder="••••••••" autocomplete="new-password" /></label>
        <label class="cui-field"><span>Nombre <em>opcional</em></span><input v-model="form.name" placeholder="Nombre y apellido" /></label>
      </section>

      <section class="cui-section">
        <div class="cui-section__head"><i class="fa-solid fa-shield-halved" aria-hidden="true" /><div><h2>Rol y locales</h2><p>Qué puede ver y manejar.</p></div></div>
        <BaseSelect v-model="form.accountType" :options="accountOptions" label="Rol" />
        <button type="button" class="cui-switch" :class="{ 'is-on': form.allBranches }" role="switch" :aria-checked="form.allBranches" @click="form.allBranches = !form.allBranches">
          <i class="fa-solid fa-building" aria-hidden="true" /><span><strong>Acceso a todos los locales</strong><small>Para dueños y administradores generales</small></span><span class="cui-switch__knob" />
        </button>
        <div v-if="!form.allBranches" class="cui-field">
          <span>Locales asignados <em>{{ form.branches.length ? `${form.branches.length} elegido${form.branches.length === 1 ? '' : 's'}` : 'elige uno o más' }}</em></span>
          <BaseSelect v-model="form.branches" :options="branchOptions" placeholder="Elegir locales" multiple searchable inline-panel />
        </div>
      </section>

      <footer class="cui-footer">
        <button type="button" class="cui-btn cui-btn--ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="cui-btn cui-btn--primary" :disabled="saving"><i class="fa-solid fa-floppy-disk" /> {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario' }}</button>
      </footer>
    </form>
  </ModalShell>
</template>

<style scoped lang="scss">
.editor { display: flex; flex-direction: column; gap: 0.85rem; }
</style>
