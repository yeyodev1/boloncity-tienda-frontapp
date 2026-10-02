<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import ModalShell from '@/components/global/ModalShell.vue'
import AvailabilitySchedule from './AvailabilitySchedule.vue'
import { displayProductName, isCustomerCategory } from '@/utils/productName'
import type { ProductForm, ProductEditorOptions } from './types'
const props = defineProps<{ open: boolean; saving: boolean; editing: boolean; form: ProductForm; options: ProductEditorOptions }>()
const emit = defineEmits<{ close: []; submit: [] }>()
const step = ref(1)
const steps = [{ n: 1, label: 'Datos', icon: 'fa-receipt' }, { n: 2, label: 'Visibilidad', icon: 'fa-eye' }, { n: 3, label: 'Locales', icon: 'fa-store' }]
const stepContent = ref<HTMLElement | null>(null)
const stepHeight = ref<number | null>(null)
const categoryOptions = computed(() => props.options.categories.map(({ _id, name }) => ({ value: _id, label: name })))
const branchOptions = computed(() => props.options.branches.map(({ _id, name }) => ({ value: _id, label: name })))
const categoryNames = computed(() => new Map(props.options.categories.map(({ _id, name }) => [_id, name])))
/** En la vista previa solo las categorías que ve el cliente (no los grupos internos del POS). */
const previewCategories = computed(() => props.form.categories.map((id) => categoryNames.value.get(id) || '').filter((name) => name && isCustomerCategory({ name })))
function fileChange(event: Event) { const file = (event.target as HTMLInputElement).files?.[0] || null; props.form.imageFile = file; if (file) props.form.imagePreview = URL.createObjectURL(file) }
function clearImage() { props.form.imageFile = null; props.form.imagePreview = '' }
function toggle(key: 'isAvailable' | 'isFeatured' | 'sellWithoutStock' | 'isBestSeller') { props.form[key] = !props.form[key] }

// Modo de disponibilidad por sucursal:
//  - 'all'  = disponible en todas (con excepciones opcionales en unavailableBranches)
//  - 'only' = disponible SOLO en las sucursales listadas (whitelist en branches)
const branchMode = computed<'all' | 'only'>(() => (props.form.branches.length ? 'only' : 'all'))
function setBranchMode(mode: 'all' | 'only') {
  if (mode === 'only') {
    props.form.unavailableBranches = [] // las dos reglas no se mezclan
    if (!props.form.branches.length && props.options.branches[0]) props.form.branches = [props.options.branches[0]._id]
  } else {
    props.form.branches = []
  }
  measureStep()
}
function measureStep() { requestAnimationFrame(() => { stepHeight.value = stepContent.value?.offsetHeight || null }) }
onMounted(measureStep)
watch([step, () => props.form.hasIva, () => props.form.sellWithoutStock], () => nextTick(measureStep))
onBeforeUnmount(() => { stepHeight.value = null })
</script>

<template>
  <ModalShell :open="open" :title="editing ? 'Editar producto' : 'Nuevo producto'" subtitle="Datos, visibilidad y locales donde se vende." size="lg" @close="emit('close')">
    <div class="editor">
      <aside class="preview">
        <div class="preview__image">
          <img v-if="form.imagePreview" :src="form.imagePreview" :alt="form.name || 'Vista previa'" />
          <span v-else><i class="fa-solid fa-image" aria-hidden="true" /> Sin foto</span>
          <span class="cui-price preview__price">${{ Number(form.price || 0).toFixed(2) }}</span>
        </div>
        <div class="preview__copy" aria-live="polite">
          <small>{{ form.code || 'Sin código' }}</small>
          <strong>{{ form.name ? displayProductName(form.name) : 'Nombre del producto' }}</strong>
          <div class="preview__tags">
            <span v-for="name in previewCategories" :key="name" class="cui-chip">{{ displayProductName(name) }}</span>
            <span v-if="!previewCategories.length" class="cui-chip">Sin categoría</span>
          </div>
          <p class="preview__state" :class="{ 'is-off': !form.isAvailable }">
            <i :class="form.isAvailable ? 'fa-solid fa-circle-check' : 'fa-solid fa-eye-slash'" aria-hidden="true" />
            {{ !form.isAvailable ? 'Oculto en la tienda' : form.branches.length ? `Solo en ${form.branches.length} local${form.branches.length === 1 ? '' : 'es'}` : form.unavailableBranches.length ? `Todos los locales menos ${form.unavailableBranches.length}` : 'En todos los locales' }}
          </p>
        </div>
        <div class="preview__upload">
          <label class="cui-btn cui-btn--ghost"><input type="file" accept="image/*" @change="fileChange" /><i class="fa-solid fa-upload" /> {{ form.imagePreview ? 'Cambiar foto' : 'Subir foto' }}</label>
          <button v-if="form.imagePreview" class="cui-icon-btn is-danger" type="button" aria-label="Quitar foto" title="Quitar foto" @click="clearImage"><i class="fa-solid fa-trash" /></button>
        </div>
      </aside>

      <form class="form" @submit.prevent="emit('submit')">
        <nav class="cui-segments" aria-label="Pasos">
          <button v-for="s in steps" :key="s.n" type="button" :class="{ 'is-active': step === s.n }" :aria-current="step === s.n ? 'step' : undefined" @click="step = s.n">
            <i :class="['fa-solid', step > s.n ? 'fa-check' : s.icon]" aria-hidden="true" />{{ s.label }}
          </button>
        </nav>

        <div class="step-frame" :style="{ height: stepHeight ? `${stepHeight}px` : undefined }">
          <Transition name="product-step" mode="out-in" @after-enter="measureStep">
            <div ref="stepContent" :key="step" class="step">
              <template v-if="step === 1">
                <label class="cui-field cui-half"><span>Nombre</span><input v-model="form.name" placeholder="Ej. Bolón mixto de verde" /></label>
                <label class="cui-field cui-half"><span>Precio</span><input v-model.number="form.price" type="number" step="0.01" min="0" /></label>
                <label class="cui-field"><span>Descripción <em>opcional</em></span><textarea v-model="form.description" placeholder="Qué lleva, para cuántos alcanza…" /></label>
                <label class="cui-field cui-half"><span>Código interno <em>opcional</em></span><input v-model="form.code" placeholder="Ej. BC-001" /></label>
                <label class="cui-field cui-half"><span>Puntos por unidad <em>opcional</em></span><input v-model.number="form.pointsValue" type="number" min="0" placeholder="Ej. 10" /><small>Vacío = no entrega puntos.</small></label>
                <button type="button" class="cui-switch" :class="{ 'is-on': form.sellWithoutStock }" role="switch" :aria-checked="form.sellWithoutStock" @click="toggle('sellWithoutStock')">
                  <i class="fa-solid fa-infinity" aria-hidden="true" /><span><strong>Vender sin límite de stock</strong><small>Se puede pedir aunque no haya unidades registradas</small></span><span class="cui-switch__knob" />
                </button>
                <label v-if="!form.sellWithoutStock" class="cui-field cui-half"><span>Unidades en stock</span><input v-model.number="form.stock" type="number" min="0" /></label>
                <button type="button" class="cui-switch" :class="{ 'is-on': form.isBestSeller }" role="switch" :aria-checked="form.isBestSeller" @click="toggle('isBestSeller')">
                  <i class="fa-solid fa-fire" aria-hidden="true" /><span><strong>Best seller</strong><small>Sale primero en el catálogo</small></span><span class="cui-switch__knob" />
                </button>
              </template>

              <template v-else-if="step === 2">
                <button type="button" class="cui-switch" :class="{ 'is-on': form.isAvailable }" role="switch" :aria-checked="form.isAvailable" @click="toggle('isAvailable')">
                  <i class="fa-solid fa-eye" aria-hidden="true" /><span><strong>Visible en la tienda</strong><small>{{ form.isAvailable ? 'Los clientes lo ven y lo pueden pedir' : 'Oculto: nadie lo ve en la tienda' }}</small></span><span class="cui-switch__knob" />
                </button>
                <button type="button" class="cui-switch" :class="{ 'is-on': form.isFeatured }" role="switch" :aria-checked="form.isFeatured" @click="toggle('isFeatured')">
                  <i class="fa-solid fa-star" aria-hidden="true" /><span><strong>Destacado</strong><small>Aparece primero en el menú</small></span><span class="cui-switch__knob" />
                </button>
                <AvailabilitySchedule :activation="form.scheduledActivation" :deactivation="form.scheduledDeactivation" @update:activation="form.scheduledActivation = $event" @update:deactivation="form.scheduledDeactivation = $event" />
              </template>

              <template v-else>
                <label class="cui-field"><span>Categorías</span><BaseSelect v-model="form.categories" :options="categoryOptions" multiple /></label>

                <div class="branch-mode" role="radiogroup" aria-label="Dónde se vende">
                  <span class="branch-mode__label">Dónde se vende</span>
                  <button type="button" role="radio" :aria-checked="branchMode === 'all'" :class="{ 'is-active': branchMode === 'all' }" @click="setBranchMode('all')">
                    <i :class="branchMode === 'all' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'" aria-hidden="true" />
                    <span><strong>En todos los locales</strong><small>Puedes excluir algunos</small></span>
                  </button>
                  <button type="button" role="radio" :aria-checked="branchMode === 'only'" :class="{ 'is-active': branchMode === 'only' }" @click="setBranchMode('only')">
                    <i :class="branchMode === 'only' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'" aria-hidden="true" />
                    <span><strong>Solo en algunos</strong><small>Ej. helados solo en Avalon</small></span>
                  </button>
                </div>

                <label v-if="branchMode === 'only'" class="cui-field"><span>Se vende únicamente en <em>{{ form.branches.length ? `${form.branches.length} local${form.branches.length === 1 ? '' : 'es'}` : 'elige al menos uno' }}</em></span><BaseSelect v-model="form.branches" :options="branchOptions" multiple searchable inline-panel placeholder="Elige locales" @toggle="measureStep" /><small>En los demás locales queda oculto.</small></label>
                <label v-else class="cui-field"><span>No se vende en <em>{{ form.unavailableBranches.length ? `${form.unavailableBranches.length} local${form.unavailableBranches.length === 1 ? '' : 'es'}` : 'ninguno' }}</em></span><BaseSelect v-model="form.unavailableBranches" :options="branchOptions" multiple searchable inline-panel placeholder="Elige locales (opcional)" @toggle="measureStep" /><small>Déjalo vacío para venderlo en todos.</small></label>
              </template>
            </div>
          </Transition>
        </div>

        <footer class="cui-footer form__footer">
          <button class="cui-btn cui-btn--ghost" type="button" @click="emit('close')">Cancelar</button>
          <button v-if="step > 1" class="cui-btn" type="button" @click="step--"><i class="fa-solid fa-arrow-left" /> Atrás</button>
          <button v-if="step < 3" class="cui-btn cui-btn--primary" type="button" @click="step++">Siguiente <i class="fa-solid fa-arrow-right" /></button>
          <button v-else class="cui-btn cui-btn--primary" type="submit" :disabled="saving"><i class="fa-solid fa-floppy-disk" /> {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto' }}</button>
        </footer>
      </form>
    </div>
  </ModalShell>
</template>

<style scoped lang="scss">
.editor { display: flex; flex-direction: column; gap: 0.9rem; }

.preview {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
}

.preview__image {
  align-items: center;
  aspect-ratio: 4 / 3;
  background: var(--admin-surface-2);
  border-radius: 14px;
  color: var(--admin-subtle);
  display: flex;
  font-size: 0.8rem;
  font-weight: 700;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img { height: 100%; object-fit: cover; width: 100%; }
  > span:first-child i { margin-right: 0.35rem; }
}

.preview__price { bottom: 0.6rem; left: 0.6rem; position: absolute; }

.preview__copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0 0.2rem;

  small { color: var(--admin-subtle); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.7rem; }
  strong { color: var(--admin-text); font-size: 1.05rem; line-height: 1.2; }
}

.preview__tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.preview__state {
  align-items: center;
  color: var(--admin-success);
  display: flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 0.35rem;
  margin: 0.15rem 0 0;

  &.is-off { color: var(--admin-warning); }
}

.preview__upload {
  display: flex;
  gap: 0.4rem;

  label { flex: 1 1 auto; position: relative; }
  input { cursor: pointer; inset: 0; opacity: 0; position: absolute; }
}

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

.step { align-content: flex-start; display: flex; flex-flow: row wrap; gap: 0.85rem; }
.step > * { flex: 1 1 100%; }
.step > .cui-half { flex: 1 1 220px; }

.branch-mode {
  display: flex;
  flex-flow: row wrap;
  gap: 0.5rem;

  .branch-mode__label { color: var(--admin-text); flex: 1 1 100%; font-size: 0.78rem; font-weight: 800; }

  button {
    align-items: center;
    background: var(--admin-surface-2);
    border: 1px solid var(--admin-line);
    border-radius: 14px;
    color: var(--admin-text);
    cursor: pointer;
    display: flex;
    flex: 1 1 220px;
    gap: 0.6rem;
    min-height: 60px;
    padding: 0.6rem 0.8rem;
    text-align: left;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    > i { color: var(--admin-accent); font-size: 1rem; }
    span { display: flex; flex-direction: column; }
    strong { font-size: 0.86rem; }
    small { color: var(--admin-muted); font-size: 0.74rem; }
    &.is-active { background: var(--admin-accent-soft); border-color: var(--admin-accent); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.form__footer { border-top: 1px solid var(--admin-line); margin-top: auto; padding-top: 0.85rem; }

.step-frame { overflow: visible; transition: height 0.32s var(--admin-ease, ease); }
.product-step-enter-active, .product-step-leave-active { transition: opacity 0.2s ease, transform 0.25s ease; }
.product-step-enter-from { opacity: 0; transform: translateX(12px); }
.product-step-leave-to { opacity: 0; transform: translateX(-10px); }

@media (min-width: 980px) {
  .editor { align-items: flex-start; flex-direction: row; }
  .preview { flex: 0 0 300px; position: sticky; top: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .step-frame, .product-step-enter-active, .product-step-leave-active { transition: none; }
}
</style>
