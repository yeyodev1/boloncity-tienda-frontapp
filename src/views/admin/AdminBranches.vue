<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ModalShell from '@/components/global/ModalShell.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const branches = ref<BranchDTO[]>([])
const loading = ref(true)
const modalOpen = ref(false)
const saving = ref(false)
const editingId = ref('')
const name = ref('')
const address = ref('')
const city = ref('')
const phone = ref('')
const email = ref('')
const googleMapsUrl = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const isActive = ref(true)
const { success, error } = useToast()
const { confirm } = useConfirm()

const activeCount = computed(() => branches.value.filter((branch) => branch.isActive).length)
const inactiveCount = computed(() => branches.value.length - activeCount.value)
const selectedImageName = computed(() => imageFile.value?.name || (imagePreview.value ? 'Imagen actual de la sucursal' : 'Sin imagen'))

function getErrorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return 'No se pudo guardar la sucursal'
}

async function load() {
  loading.value = true
  const response = await BranchService.getAll()
  branches.value = response.data
  loading.value = false
}

function reset() {
  editingId.value = ''
  name.value = ''
  address.value = ''
  city.value = ''
  phone.value = ''
  email.value = ''
  googleMapsUrl.value = ''
  imageFile.value = null
  imagePreview.value = ''
  isActive.value = true
}

function openCreateModal() {
  reset()
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  setTimeout(reset, 150)
}

function fill(branch: BranchDTO) {
  editingId.value = branch._id
  name.value = branch.name
  address.value = branch.address || ''
  city.value = branch.city || ''
  phone.value = branch.phone || ''
  email.value = branch.email || ''
  googleMapsUrl.value = branch.googleMapsUrl || ''
  imageFile.value = null
  imagePreview.value = branch.imageUrl || ''
  isActive.value = branch.isActive
  modalOpen.value = true
}

function onImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  imageFile.value = file
  if (file) {
    imagePreview.value = URL.createObjectURL(file)
  }
}

function clearImageSelection() {
  imageFile.value = null
  imagePreview.value = ''
}

async function submit() {
  try {
    saving.value = true
    const payload = { name: name.value, address: address.value, city: city.value, phone: phone.value, email: email.value, googleMapsUrl: googleMapsUrl.value, isActive: isActive.value }
    const response = editingId.value ? await BranchService.update(editingId.value, payload) : await BranchService.create(payload)
    if (imageFile.value && response.data._id) {
      await BranchService.uploadImage(response.data._id, imageFile.value)
    }
    success(editingId.value ? 'Sucursal actualizada' : 'Sucursal creada')
    closeModal()
    await load()
  } catch (err) {
    error(getErrorMessage(err))
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  const ok = await confirm({ title: 'Eliminar sucursal', message: 'Las ordenes asociadas no se eliminaran, pero no podra borrarse si existen ordenes.', type: 'danger' })
  if (!ok) return
  await BranchService.remove(id)
  success('Sucursal eliminada')
  await load()
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="branches-hero panel">
        <div>
          <p class="eyebrow">Operación</p>
          <h1>Sucursales</h1>
          <p>Administra puntos de atención con información clara para pedidos, clientes y equipo interno.</p>
        </div>
        <button class="hero-action" type="button" @click="openCreateModal">Agregar sucursal</button>
      </header>

      <section class="stats-row">
        <article class="panel stat-card">
          <span>Total</span>
          <strong>{{ branches.length }}</strong>
        </article>
        <article class="panel stat-card">
          <span>Activas</span>
          <strong>{{ activeCount }}</strong>
        </article>
        <article class="panel stat-card">
          <span>Inactivas</span>
          <strong>{{ inactiveCount }}</strong>
        </article>
      </section>

      <section class="branches-layout">
        <div class="branches-list-wrap">
          <div class="section-head">
            <div>
              <p class="eyebrow">Listado</p>
              <h2>Sucursales registradas</h2>
            </div>
          </div>

          <SkeletonLoader v-if="loading" type="list" :count="4" />

          <div v-else class="list">
            <article v-for="branch in branches" :key="branch._id" class="branch-card">
              <div class="branch-card__image">
                <img v-if="branch.imageUrl" :src="branch.imageUrl" :alt="branch.name" />
                <span v-else>{{ branch.name.slice(0, 1) }}</span>
              </div>
              <div class="branch-card__main">
                <span class="branch-card__badge" :class="{ inactive: !branch.isActive }">{{ branch.isActive ? 'Activa' : 'Inactiva' }}</span>
                <strong>{{ branch.name }}</strong>
                <p>{{ branch.address || 'Sin dirección' }}</p>
                <small>{{ branch.city || 'Sin ciudad' }}</small>
              </div>

              <div class="branch-card__meta">
                <span>{{ branch.phone || 'Sin teléfono' }}</span>
                <span>{{ branch.email || 'Sin email' }}</span>
                <a v-if="branch.googleMapsUrl" :href="branch.googleMapsUrl" target="_blank" rel="noreferrer">Ver mapa</a>
              </div>

              <div class="item-actions">
                <button type="button" @click="fill(branch)">Editar</button>
                <button type="button" class="danger" @click="remove(branch._id)">Eliminar</button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </section>

    <ModalShell
      :open="modalOpen"
      :title="editingId ? 'Editar sucursal' : 'Nueva sucursal'"
      subtitle="Agrega datos operativos, link de Google Maps e imagen de referencia."
      size="lg"
      @close="closeModal"
    >
      <form class="branch-modal" @submit.prevent="submit">
        <aside class="branch-modal__media">
          <div class="branch-preview">
            <img v-if="imagePreview" :src="imagePreview" :alt="name || 'Vista previa'" />
            <span v-else>{{ (name || 'S').slice(0, 1) }}</span>
          </div>

          <label class="image-dropzone">
            <input type="file" accept="image/*" @change="onImageChange" />
            <small>Imagen de sucursal</small>
            <strong>{{ selectedImageName }}</strong>
            <span>Toca para cargar PNG, JPG o WEBP.</span>
          </label>

          <button v-if="imagePreview" type="button" class="secondary image-clear" @click="clearImageSelection">Quitar imagen</button>
        </aside>

        <section class="branch-modal__form">
          <div class="form-fields">
            <label>
              <span>Nombre</span>
              <input v-model="name" placeholder="Ej: Boloncity Samborondón" required />
            </label>

            <label>
              <span>Ciudad</span>
              <input v-model="city" placeholder="Guayaquil" />
            </label>

            <label class="full">
              <span>Dirección</span>
              <input v-model="address" placeholder="Av. principal, local 1" />
            </label>

            <label>
              <span>Teléfono</span>
              <input v-model="phone" placeholder="0999999999" />
            </label>

            <label>
              <span>Email</span>
              <input v-model="email" type="email" placeholder="sucursal@boloncity.com" />
            </label>

            <label class="full">
              <span>Link de Google Maps</span>
              <input v-model="googleMapsUrl" placeholder="https://maps.google.com/..." />
            </label>

            <label class="status-toggle full">
              <input v-model="isActive" type="checkbox" />
              <span>Sucursal activa</span>
              <small>Disponible para asignación y operación.</small>
            </label>
          </div>

          <div class="actions">
            <button type="button" class="secondary" @click="closeModal">Cancelar</button>
            <button type="submit" :disabled="saving">{{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear sucursal' }}</button>
          </div>
        </section>
      </form>
    </ModalShell>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-page {
  color: $text-dark;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(0.75rem, 2vw, 1.5rem);
}

.branches-hero,
.branches-list-wrap {
  padding: 1.25rem;
}

.branches-hero {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.hero-action {
  background: $primary-dark;
  color: $white;
  flex: 0 0 auto;
}

.eyebrow {
  color: $primary-dark;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1,
h2 {
  color: $text-dark;
  letter-spacing: -0.04em;
  line-height: 1;
}

h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  margin-top: 0.35rem;
}

h2 {
  font-size: clamp(1.25rem, 2vw, 1.65rem);
}

.branches-hero p:not(.eyebrow) {
  color: rgba($text-dark, 0.62);
  margin-top: 0.75rem;
  max-width: 44rem;
}

.stats-row,
.branches-layout,
.form-fields,
.list,
.branch-card,
.branch-modal,
.branch-card__meta,
.item-actions,
.actions {
  display: flex;
}

.stats-row {
  flex-wrap: wrap;
  gap: 0.85rem;
}

.stat-card {
  flex: 1 1 180px;
  padding: 1rem;
}

.stat-card span {
  color: rgba($text-dark, 0.55);
  display: block;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  font-size: 2rem;
  margin-top: 0.25rem;
}

.branches-layout {
  align-items: flex-start;
  gap: 1rem;
}

.branches-list-wrap {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.section-head {
  margin-bottom: 1rem;
}

.form-fields {
  flex-wrap: wrap;
  gap: 0.85rem;
}

.branch-modal {
  align-items: flex-start;
  gap: 1rem;
}

.branch-modal__media {
  flex: 0 0 min(300px, 100%);
}

.branch-modal__form {
  flex: 1 1 auto;
  min-width: 0;
}

.branch-preview {
  align-items: center;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, rgba($primary-dark, 0.12), rgba($secondary, 0.22));
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 22px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.branch-preview img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.branch-preview span {
  color: $primary-dark;
  font-size: 4rem;
  font-weight: 900;
}

.image-dropzone {
  background: $white;
  border: 1px dashed rgba($primary-dark, 0.32);
  border-radius: 18px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding: 1rem;
  position: relative;
}

.image-dropzone input {
  inset: 0;
  opacity: 0;
  position: absolute;
}

.image-dropzone small,
.image-dropzone span {
  color: rgba($text-dark, 0.62);
}

.image-dropzone strong {
  color: $text-dark;
  overflow-wrap: anywhere;
}

.image-clear {
  margin-top: 0.75rem;
  width: 100%;
}

label {
  display: flex;
  flex: 1 1 180px;
  flex-direction: column;
  gap: 0.45rem;
}

label span {
  color: $primary-dark;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

input {
  background: $white;
  border: 1px solid rgba($text-dark, 0.12);
  border-radius: 14px;
  color: $text-dark;
  min-height: 48px;
  padding: 0.85rem 0.95rem;
}

.full {
  flex-basis: 100%;
}

.status-toggle {
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding: 0.9rem 1rem;
}

.status-toggle input {
  min-height: auto;
}

.status-toggle small {
  color: rgba($text-dark, 0.58);
  flex-basis: 100%;
}

.actions {
  border-top: 1px solid rgba($text-dark, 0.08);
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
}

.list {
  flex-direction: column;
  gap: 0.8rem;
}

.branch-card {
  align-items: flex-start;
  background: $white;
  border: 1px solid rgba($text-dark, 0.1);
  border-radius: 20px;
  box-shadow: 0 14px 28px rgba($text-dark, 0.06);
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  min-width: 0;
  padding: 1rem;
  width: 100%;
}

.branch-card__image {
  align-items: center;
  background: linear-gradient(135deg, rgba($primary-dark, 0.1), rgba($secondary, 0.18));
  border-radius: 18px;
  display: flex;
  flex: 0 0 96px;
  height: 96px;
  justify-content: center;
  overflow: hidden;
}

.branch-card__image img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.branch-card__image span {
  color: $primary-dark;
  font-size: 2rem;
  font-weight: 900;
}

.branch-card__main {
  flex: 1 1 240px;
  min-width: 0;
}

.branch-card__badge {
  background: rgba($primary-dark, 0.1);
  border-radius: 999px;
  color: $primary-dark;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 900;
  margin-bottom: 0.55rem;
  padding: 0.32rem 0.6rem;
  text-transform: uppercase;
}

.branch-card__badge.inactive {
  background: rgba(126, 33, 33, 0.1);
  color: #7e2121;
}

.branch-card strong {
  display: block;
  font-size: 1.1rem;
}

.branch-card p,
.branch-card small {
  color: rgba($text-dark, 0.62);
  display: block;
  margin-top: 0.25rem;
  overflow-wrap: anywhere;
}

.branch-card__meta {
  align-items: flex-start;
  flex: 1 1 260px;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
}

.branch-card__meta span,
.branch-card__meta a {
  background: $bg-light;
  border-radius: 999px;
  color: rgba($text-dark, 0.72);
  font-size: 0.82rem;
  max-width: 100%;
  overflow: hidden;
  padding: 0.45rem 0.65rem;
  text-overflow: ellipsis;
  text-decoration: none;
  white-space: nowrap;
}

.item-actions {
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  min-width: 0;
}

button {
  background: $primary-dark;
  border: 0;
  border-radius: 999px;
  color: $white;
  font-weight: 800;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

button.secondary,
button[type='button'] {
  background: rgba($secondary, 0.16);
  color: $text-dark;
}

button.danger {
  background: rgba(126, 33, 33, 0.1);
  color: #7e2121;
}

@media (max-width: 1080px) {
  .branches-layout,
  .branch-card,
  .branch-modal {
    flex-direction: column;
    align-items: stretch;
  }

  .branch-card__main,
  .branch-card__meta,
  .item-actions {
    flex-basis: auto;
    width: 100%;
  }

  .item-actions {
    justify-content: flex-start;
  }

  .branch-modal__media {
    flex-basis: auto;
  }
}

@media (max-width: 640px) {
  .admin-page {
    padding: 0.75rem;
  }

  label,
  .item-actions button {
    flex-basis: 100%;
  }

  .actions,
  .item-actions,
  .branches-hero {
    flex-direction: column;
  }

  .hero-action,
  .branch-card__image {
    width: 100%;
  }

  .branch-card__image {
    flex-basis: auto;
    height: 150px;
  }
}
</style>
