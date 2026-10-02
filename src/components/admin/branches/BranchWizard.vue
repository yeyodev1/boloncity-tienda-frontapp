<script setup lang="ts">
import { ref, watch } from 'vue'
import ModalShell from '@/components/global/ModalShell.vue'
import BranchHoursEditor from '@/components/admin/BranchHoursEditor.vue'
import type { BranchForm } from './types'
const props = defineProps<{ open: boolean; editing: boolean; saving: boolean; form: BranchForm }>()
const emit = defineEmits<{ close: []; submit: [] }>()
const step = ref(3)
const steps = [{ n: 1, label: 'Datos', icon: 'fa-store' }, { n: 2, label: 'Ubicación', icon: 'fa-location-dot' }, { n: 3, label: 'Operación', icon: 'fa-clock' }]
watch(() => props.open, (open) => { if (open) step.value = 3 })
function imageChange(event: Event) { const file = (event.target as HTMLInputElement).files?.[0] || null; props.form.imageFile = file; if (file) props.form.imagePreview = URL.createObjectURL(file) }
</script>

<template>
  <ModalShell :open="open" :title="editing ? 'Editar sucursal' : 'Nueva sucursal'" subtitle="Datos del local, ubicación, cobro y horarios." size="lg" @close="emit('close')">
    <form class="wizard" @submit.prevent="emit('submit')">
      <aside class="preview">
        <div class="preview__image">
          <img v-if="form.imagePreview" :src="form.imagePreview" :alt="form.name || 'Sucursal'" />
          <i v-else class="fa-solid fa-store" aria-hidden="true" />
        </div>
        <strong>{{ form.name || 'Nueva sucursal' }}</strong>
        <small>{{ form.city || 'Ciudad por definir' }}</small>
        <span class="cui-chip" :class="form.isActive ? 'cui-chip--good' : 'cui-chip--bad'">{{ form.isActive ? 'Activa' : 'Inactiva' }}</span>
        <label class="cui-btn cui-btn--ghost preview__upload"><input type="file" accept="image/*" @change="imageChange" /><i class="fa-solid fa-image" /> {{ form.imagePreview ? 'Cambiar foto' : 'Subir foto' }}</label>
      </aside>

      <section class="form">
        <nav class="cui-segments" aria-label="Pasos">
          <button v-for="s in steps" :key="s.n" type="button" :class="{ 'is-active': step === s.n }" :aria-current="step === s.n ? 'step' : undefined" @click="step = s.n">
            <i :class="['fa-solid', s.icon]" aria-hidden="true" />{{ s.label }}
          </button>
        </nav>

        <Transition name="wizard-step" mode="out-in">
          <div :key="step" class="fields">
            <template v-if="step === 1">
              <label class="cui-field cui-half"><span>Nombre</span><input v-model="form.name" required placeholder="Boloncity Garzota" /></label>
              <label class="cui-field cui-half"><span>Ciudad</span><input v-model="form.city" required placeholder="Guayaquil" /></label>
              <label class="cui-field cui-half"><span>Teléfono</span><input v-model="form.phone" required placeholder="+593 96 000 0000" /></label>
              <label class="cui-field cui-half"><span>Correo</span><input v-model="form.email" required type="email" placeholder="local@boloncity.com" /></label>
            </template>
            <template v-else-if="step === 2">
              <label class="cui-field"><span>Dirección</span><input v-model="form.address" required placeholder="Dirección completa del local" /></label>
              <label class="cui-field"><span>Link de Google Maps <em>recomendado</em></span><input v-model="form.googleMapsUrl" placeholder="https://maps.app.goo.gl/…" /><small>Con esto se calcula qué local le queda más cerca a cada cliente.</small></label>
            </template>
            <template v-else>
              <button type="button" class="cui-switch" :class="{ 'is-on': form.isActive }" role="switch" :aria-checked="form.isActive" @click="form.isActive = !form.isActive">
                <i class="fa-solid fa-power-off" aria-hidden="true" /><span><strong>Sucursal activa</strong><small>{{ form.isActive ? 'Recibe pedidos' : 'No recibe pedidos' }}</small></span><span class="cui-switch__knob" />
              </button>
              <label class="cui-field"><span>Store ID de PayPhone <em>necesario para cobrar con tarjeta</em></span><input v-model.trim="form.payphoneStoreId" placeholder="00000000-0000-0000-0000-000000000000" /><small>Sin este dato, el cobro cae en la tienda principal y no en este local.</small></label>
              <label class="cui-field"><span>Tiempo de cocina <em>minutos</em></span><input v-model.number="form.cookTimeMinutes" type="number" min="0" max="240" step="1" placeholder="0" /><small>Picker espera este tiempo antes de buscar motorizado. 0 = de inmediato.</small></label>
              <BranchHoursEditor v-model="form.openingHours" />
            </template>
          </div>
        </Transition>

        <footer class="cui-footer form__footer">
          <button v-if="step > 1" type="button" class="cui-btn" @click="step--"><i class="fa-solid fa-arrow-left" /> Atrás</button>
          <button v-if="step < 3" type="button" class="cui-btn cui-btn--primary" @click="step++">Siguiente <i class="fa-solid fa-arrow-right" /></button>
          <button v-else type="submit" class="cui-btn cui-btn--primary" :disabled="saving"><i class="fa-solid fa-floppy-disk" /> {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sucursal' }}</button>
        </footer>
      </section>
    </form>
  </ModalShell>
</template>

<style scoped lang="scss">
.wizard { display: flex; flex-direction: column; gap: 0.9rem; }

.preview {
  align-items: flex-start;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;

  strong { color: var(--admin-text); font-size: 1rem; margin-top: 0.4rem; }
  small { color: var(--admin-muted); font-size: 0.78rem; }
}

.preview__image {
  align-items: center;
  aspect-ratio: 4 / 3;
  background: var(--admin-accent-soft);
  border-radius: 14px;
  color: var(--admin-accent);
  display: flex;
  font-size: 2.5rem;
  justify-content: center;
  overflow: hidden;
  width: 100%;

  img { height: 100%; object-fit: cover; width: 100%; }
}

.preview__upload { margin-top: 0.5rem; position: relative; width: 100%; }
.preview__upload input { cursor: pointer; inset: 0; opacity: 0; position: absolute; }

.form {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 18px;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  padding: 0.9rem;
}

.fields { display: flex; flex-flow: row wrap; gap: 0.85rem; }
.fields > * { flex: 1 1 100%; }
.fields > .cui-half { flex: 1 1 220px; }

.form__footer { border-top: 1px solid var(--admin-line); margin-top: auto; padding-top: 0.85rem; }

.wizard-step-enter-active, .wizard-step-leave-active { transition: opacity 0.2s ease, transform 0.25s ease; }
.wizard-step-enter-from { opacity: 0; transform: translateX(12px); }
.wizard-step-leave-to { opacity: 0; transform: translateX(-12px); }

@media (min-width: 769px) {
  .wizard { align-items: flex-start; flex-direction: row; }
  .preview { flex: 0 0 230px; position: sticky; top: 0; }
}

@media (prefers-reduced-motion: reduce) { .wizard-step-enter-active, .wizard-step-leave-active { transition: none; } }
</style>
