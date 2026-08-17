<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import PhoneInput from '@/components/global/PhoneInput.vue'
import AuthService from '@/services/AuthService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'

const user = useUserStore()
const cart = useCartStore()
const router = useRouter()
const { success: toastSuccess, error: toastError } = useToast()
const { confirm } = useConfirm()

const name = ref('')
const email = ref('')
const phone = ref('')
const photo = ref('')
const pendingPhoto = ref<File | null>(null)
const pendingPhotoPreview = ref('')
const deletingPhoto = ref(false)
const editing = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const changingPassword = ref(false)
const activeSection = ref<'profile' | 'security'>('profile')
const passwordVisible = ref({ current: false, new: false, confirm: false })

const passwordStrength = computed(() => {
  const pw = newPassword.value
  if (!pw) return { level: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = ['', 'Débil', 'Regular', 'Aceptable', 'Fuerte', 'Muy fuerte']
  const colors = ['', '#a02828', '#b45309', '#ca8a04', '#00a523', '#235931']
  return { level: score, label: map[score] || '', color: colors[score] || '' }
})

const hasSavedPhoto = computed(() => !!photo.value && !pendingPhotoPreview)

function syncFromUser() {
  name.value = user.name || ''
  email.value = user.email || ''
  phone.value = user.phone || ''
  photo.value = user.photo || ''
  pendingPhoto.value = null
  pendingPhotoPreview.value = ''
}

onMounted(syncFromUser)

function startEdit() {
  syncFromUser()
  editing.value = true
}

function cancelEdit() {
  syncFromUser()
  editing.value = false
}

function handlePhotoSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  pendingPhoto.value = file
  const reader = new FileReader()
  reader.onload = (ev) => {
    pendingPhotoPreview.value = ev.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function clearPendingPhoto() {
  pendingPhoto.value = null
  pendingPhotoPreview.value = ''
}

async function deletePhoto() {
  const ok = await confirm({
    title: 'Eliminar foto',
    message: '¿Estás seguro de que quieres eliminar tu foto de perfil?',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
  })
  if (!ok) return
  deletingPhoto.value = true
  try {
    await AuthService.deleteProfilePhoto()
    photo.value = ''
    pendingPhoto.value = null
    pendingPhotoPreview.value = ''
    user.setUser({ photo: '' })
    toastSuccess('Foto eliminada')
  } catch {
    toastError('No pudimos eliminar la foto')
  } finally {
    deletingPhoto.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    let photoUrl = photo.value

    if (pendingPhoto.value) {
      const uploadRes = await AuthService.uploadProfilePhoto(pendingPhoto.value)
      photoUrl = uploadRes.data.photo
      pendingPhoto.value = null
      pendingPhotoPreview.value = ''
    }

    const res = await AuthService.updateProfile({
      name: name.value,
      email: email.value,
      phone: phone.value,
      photo: photoUrl,
    })
    user.setUser({ name: res.data.name, email: res.data.email, phone: res.data.phone, photo: res.data.photo })
    toastSuccess('Perfil actualizado')
    editing.value = false
  } catch {
    toastError('No pudimos actualizar el perfil')
  } finally {
    saving.value = false
  }
}

async function changePasswordAction() {
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    toastError('Completa todos los campos')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toastError('Las contraseñas nuevas no coinciden')
    return
  }
  if (newPassword.value.length < 6) {
    toastError('La contraseña debe tener al menos 6 caracteres')
    return
  }
  changingPassword.value = true
  try {
    await AuthService.changePassword(currentPassword.value, newPassword.value)
    toastSuccess('Contraseña actualizada')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Error al cambiar la contraseña'
    toastError(msg)
  } finally {
    changingPassword.value = false
  }
}

async function confirmLogout() {
  const ok = await confirm({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que quieres cerrar sesión?',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
    type: 'danger',
  })
  if (ok) {
    user.clear()
    cart.persist()
    router.push('/')
  }
}
</script>

<template>
  <div class="pwrap">
    <StoreHeader />

    <main class="pwrap__main">
      <div class="pwrap__back">
        <router-link to="/mis-ordenes" class="pwrap__back-link">
          <i class="fa-solid fa-arrow-left" />
          <span>Mis pedidos</span>
        </router-link>
      </div>

      <div class="pwrap__hero">
        <div class="pwrap__hero-bg">
          <div class="pwrap__hero-glow pwrap__hero-glow--1" />
          <div class="pwrap__hero-glow pwrap__hero-glow--2" />
        </div>
        <div class="pwrap__avatar-wrap">
          <label class="pwrap__avatar-label" :class="{ 'has-photo': !!(pendingPhotoPreview || photo), 'is-pending': !!pendingPhotoPreview }">
            <div v-if="pendingPhotoPreview || photo" class="pwrap__avatar-img">
              <img :src="pendingPhotoPreview || photo" alt="" />
            </div>
            <div v-else class="pwrap__avatar-placeholder">
              <span>{{ (user.name?.[0] || user.email?.[0] || 'U').toUpperCase() }}</span>
            </div>
            <div class="pwrap__avatar-ring" />
            <div class="pwrap__avatar-badge">
              <i class="fa-solid fa-camera" />
            </div>
            <input type="file" accept="image/*" hidden @change="handlePhotoSelect" />
            <transition name="fade">
              <div v-if="pendingPhotoPreview" class="pwrap__avatar-pending">
                <i class="fa-solid fa-clock" /> Sin guardar
              </div>
            </transition>
          </label>
          <transition name="fade">
            <button
              v-if="hasSavedPhoto && !pendingPhotoPreview"
              class="pwrap__avatar-delete"
              :disabled="deletingPhoto"
              @click="deletePhoto"
            >
              <i v-if="deletingPhoto" class="fa-solid fa-circle-notch fa-spin" />
              <i v-else class="fa-solid fa-trash-can" />
            </button>
          </transition>
          <transition name="fade">
            <button
              v-if="pendingPhotoPreview"
              class="pwrap__avatar-clear"
              @click="clearPendingPhoto"
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </transition>
        </div>
        <div class="pwrap__hero-info">
          <h1 class="pwrap__hero-name">{{ user.name || 'Sin nombre' }}</h1>
          <p class="pwrap__hero-email">{{ user.email }}</p>
          <div class="pwrap__hero-meta">
            <span class="pwrap__hero-badge">
              <i class="fa-regular fa-calendar" /> Miembro
            </span>
            <span class="pwrap__hero-badge">
              <i class="fa-regular fa-circle-check" /> Verificado
            </span>
          </div>
        </div>
      </div>

      <div class="pwrap__tabs">
        <button class="pwrap__tab" :class="{ active: activeSection === 'profile' }" @click="activeSection = 'profile'; editing = false">
          <i class="fa-solid fa-user" /> Perfil
        </button>
        <button class="pwrap__tab" :class="{ active: activeSection === 'security' }" @click="activeSection = 'security'">
          <i class="fa-solid fa-lock" /> Seguridad
        </button>
      </div>

      <Transition name="section-fade" mode="out-in">
        <div v-if="activeSection === 'profile'" key="profile">
          <Transition name="edit-fade" mode="out-in">
            <div v-if="!editing" key="view" class="pwrap__card">
              <div class="pwrap__card-head">
                <i class="fa-solid fa-circle-user" />
                <span>Información personal</span>
                <button class="pwrap__card-edit" @click="startEdit">
                  <i class="fa-solid fa-pen" /> Editar
                </button>
              </div>
              <div class="pwrap__card-body">
                <div class="pwrap__info-row">
                  <div class="pwrap__info-label">
                    <i class="fa-regular fa-user" /> Nombre
                  </div>
                  <div class="pwrap__info-value">{{ user.name || '—' }}</div>
                </div>
                <div class="pwrap__info-row">
                  <div class="pwrap__info-label">
                    <i class="fa-regular fa-envelope" /> Correo
                  </div>
                  <div class="pwrap__info-value">{{ user.email || '—' }}</div>
                </div>
                <div class="pwrap__info-row">
                  <div class="pwrap__info-label">
                    <i class="fa-regular fa-phone" /> Teléfono
                  </div>
                  <div class="pwrap__info-value">{{ user.phone || '—' }}</div>
                </div>
              </div>
            </div>

            <div v-else key="edit" class="pwrap__card">
              <div class="pwrap__card-head">
                <i class="fa-solid fa-pen" />
                <span>Editar información</span>
              </div>
              <div class="pwrap__card-body">
                <div class="pwrap__field">
                  <label>Nombre completo</label>
                  <div class="pwrap__input-wrap">
                    <i class="fa-regular fa-user" />
                    <input v-model="name" type="text" placeholder="Tu nombre" maxlength="80" />
                  </div>
                </div>
                <div class="pwrap__field">
                  <label>Teléfono</label>
                  <PhoneInput v-model="phone" country-code="+593" />
                </div>
                <div class="pwrap__field">
                  <label>Correo electrónico</label>
                  <div class="pwrap__input-wrap">
                    <i class="fa-regular fa-envelope" />
                    <input v-model="email" type="email" placeholder="tu@email.com" />
                  </div>
                </div>
                <div class="pwrap__actions">
                  <button class="pwrap__btn pwrap__btn--ghost" @click="cancelEdit">
                    Cancelar
                  </button>
                  <button class="pwrap__btn pwrap__btn--primary" :class="{ loading: saving }" :disabled="saving" @click="saveProfile()">
                    <span v-if="saving" class="pwrap__btn-spinner" />
                    <i v-else class="fa-solid fa-check" />
                    {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <div v-else key="security" class="pwrap__card">
          <div class="pwrap__card-head">
            <i class="fa-solid fa-lock" />
            <span>Cambiar contraseña</span>
          </div>
          <div class="pwrap__card-body">
            <div class="pwrap__field">
              <label>Contraseña actual</label>
              <div class="pwrap__input-wrap">
                <i class="fa-solid fa-lock" />
                <input
                  v-model="currentPassword"
                  :type="passwordVisible.current ? 'text' : 'password'"
                  placeholder="Ingresa tu contraseña actual"
                />
                <button class="pwrap__input-toggle" @click="passwordVisible.current = !passwordVisible.current">
                  <i :class="passwordVisible.current ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                </button>
              </div>
            </div>
            <div class="pwrap__field">
              <label>Nueva contraseña</label>
              <div class="pwrap__input-wrap">
                <i class="fa-solid fa-lock" />
                <input
                  v-model="newPassword"
                  :type="passwordVisible.new ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres"
                />
                <button class="pwrap__input-toggle" @click="passwordVisible.new = !passwordVisible.new">
                  <i :class="passwordVisible.new ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                </button>
              </div>
              <div v-if="newPassword" class="pwrap__strength">
                <div class="pwrap__strength-bar">
                  <div
                    class="pwrap__strength-fill"
                    :style="{ width: (passwordStrength.level / 5) * 100 + '%', background: passwordStrength.color }"
                  />
                </div>
                <span class="pwrap__strength-label" :style="{ color: passwordStrength.color }">
                  {{ passwordStrength.label }}
                </span>
              </div>
            </div>
            <div class="pwrap__field">
              <label>Confirmar nueva contraseña</label>
              <div class="pwrap__input-wrap">
                <i class="fa-solid fa-lock" />
                <input
                  v-model="confirmPassword"
                  :type="passwordVisible.confirm ? 'text' : 'password'"
                  placeholder="Repite la nueva contraseña"
                />
                <button class="pwrap__input-toggle" @click="passwordVisible.confirm = !passwordVisible.confirm">
                  <i :class="passwordVisible.confirm ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" />
                </button>
              </div>
              <div v-if="confirmPassword && newPassword" class="pwrap__match">
                <span v-if="newPassword === confirmPassword" class="pwrap__match-ok">
                  <i class="fa-solid fa-check" /> Coinciden
                </span>
                <span v-else class="pwrap__match-err">
                  <i class="fa-solid fa-xmark" /> No coinciden
                </span>
              </div>
            </div>
            <button class="pwrap__btn pwrap__btn--primary" :class="{ loading: changingPassword }" :disabled="changingPassword" @click="changePasswordAction">
              <span v-if="changingPassword" class="pwrap__btn-spinner" />
              <i v-else class="fa-solid fa-check" />
              {{ changingPassword ? 'Cambiando...' : 'Actualizar contraseña' }}
            </button>
          </div>
        </div>
      </Transition>

      <div class="pwrap__card pwrap__card--danger">
        <div class="pwrap__card-head">
          <i class="fa-solid fa-arrow-right-from-bracket" />
          <span>Sesión</span>
        </div>
        <div class="pwrap__card-body">
          <p class="pwrap__card-desc">Al cerrar sesión saldrás de tu cuenta en este dispositivo.</p>
          <button class="pwrap__btn pwrap__btn--danger" @click="confirmLogout">
            <i class="fa-solid fa-arrow-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </div>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.pwrap {
  background: #f4f4f0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.pwrap__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(0.85rem, 2.5vw, 1.25rem);
  margin: 0 auto;
  max-width: 560px;
  padding: calc(72px + clamp(1.25rem, 4vw, 2rem)) 1.25rem clamp(4rem, 8vw, 7rem);
  width: 100%;
}

.pwrap__back { margin-bottom: 0.15rem; }

.pwrap__back-link {
  align-items: center;
  color: rgba(8, 17, 13, 0.4);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0.15rem 0;
}

.pwrap__back-link:hover { color: #235931; }

.pwrap__hero {
  background: linear-gradient(135deg, #235931 0%, #1a4728 50%, #102719 100%);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  overflow: hidden;
  padding: clamp(2.5rem, 7vw, 3.5rem) 1.5rem 2rem;
  position: relative;
  text-align: center;
}

.pwrap__hero-bg {
  inset: 0;
  overflow: hidden;
  position: absolute;
}

.pwrap__hero-glow {
  border-radius: 50%;
  position: absolute;
}

.pwrap__hero-glow--1 {
  background: radial-gradient(circle, rgba(239, 213, 55, 0.15), transparent 70%);
  height: 300px;
  right: -80px;
  top: -100px;
  width: 300px;
}

.pwrap__hero-glow--2 {
  background: radial-gradient(circle, rgba(0, 165, 35, 0.1), transparent 70%);
  bottom: -80px;
  height: 200px;
  left: -60px;
  width: 200px;
}

.pwrap__avatar-label {
  cursor: pointer;
  display: block;
  height: 100px;
  position: relative;
  width: 100px;
}

.pwrap__avatar-label.has-photo:hover .pwrap__avatar-img img { transform: scale(1.05); }

.pwrap__avatar-img,
.pwrap__avatar-placeholder {
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 100%;
  z-index: 2;
}

.pwrap__avatar-img img {
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 100%;
}

.pwrap__avatar-placeholder {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);
  font-size: 2.25rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
}

.pwrap__avatar-ring {
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  height: 110px;
  left: -5px;
  pointer-events: none;
  position: absolute;
  top: -5px;
  transition: border-color 0.3s ease;
  width: 110px;
  z-index: 1;
}

.pwrap__avatar-label:hover .pwrap__avatar-ring { border-color: rgba(239, 213, 55, 0.5); }

.pwrap__avatar-badge {
  align-items: center;
  background: #efd537;
  border: 2px solid #235931;
  border-radius: 50%;
  bottom: 2px;
  color: #235931;
  display: flex;
  font-size: 0.8rem;
  height: 30px;
  justify-content: center;
  position: absolute;
  right: 2px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
  width: 30px;
  z-index: 3;
}

.pwrap__avatar-label:hover .pwrap__avatar-badge { transform: scale(1.1); }

.pwrap__avatar-wrap {
  position: relative;
  z-index: 1;
}

.pwrap__avatar-pending {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: rgba(239, 213, 55, 0.9);
  color: #235931;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  z-index: 4;
  backdrop-filter: blur(4px);
}

.pwrap__avatar-pending i { font-size: 0.5rem; }

.pwrap__avatar-delete,
.pwrap__avatar-clear {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #235931;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.72rem;
  z-index: 5;
  transition: all 0.25s ease;
}

.pwrap__avatar-delete {
  background: rgba(160, 40, 40, 0.9);
  border-color: rgba(160, 40, 40, 0.9);
  color: #fff;
}

.pwrap__avatar-delete:hover {
  background: #a02828;
  transform: scale(1.1);
}

.pwrap__avatar-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pwrap__avatar-clear {
  background: rgba(8, 17, 13, 0.6);
  border-color: rgba(8, 17, 13, 0.6);
  color: #fff;
}

.pwrap__avatar-clear:hover {
  background: rgba(8, 17, 13, 0.8);
  transform: scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.pwrap__hero-info { position: relative; z-index: 1; }

.pwrap__hero-name {
  color: #fff;
  font-size: clamp(1.3rem, 3vw, 1.7rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1.15;
}

.pwrap__hero-email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0.2rem 0 0;
}

.pwrap__hero-meta {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 0.6rem;
}

.pwrap__hero-badge {
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.5);
  display: inline-flex;
  font-size: 0.68rem;
  font-weight: 700;
  gap: 0.3rem;
  letter-spacing: 0.02em;
  padding: 0.3rem 0.6rem;
}

.pwrap__tabs {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(35, 89, 49, 0.06);
  border-radius: 14px;
  display: flex;
  gap: 0.25rem;
  padding: 0.3rem;
}

.pwrap__tab {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: rgba(8, 17, 13, 0.4);
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  justify-content: center;
  min-height: 40px;
  padding: 0.35rem 0.5rem;
  transition: all 0.25s ease;
}

.pwrap__tab.active {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  color: #235931;
}

.pwrap__tab i { font-size: 0.8rem; }

.pwrap__card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(35, 89, 49, 0.06);
  border-radius: 24px;
  overflow: hidden;
}

.pwrap__card--danger {
  border-color: rgba(160, 40, 40, 0.08);
  background: rgba(255, 255, 255, 0.7);
}

.pwrap__card-head {
  align-items: center;
  border-bottom: 1px solid rgba(35, 89, 49, 0.04);
  color: rgba(8, 17, 13, 0.4);
  display: flex;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.08em;
  padding: 1rem 1.35rem;
  text-transform: uppercase;
}

.pwrap__card-head i { font-size: 0.7rem; color: #235931; }

.pwrap__card--danger .pwrap__card-head i { color: #a02828; }

.pwrap__card-edit {
  margin-left: auto;
  background: transparent;
  border: 0;
  color: #235931;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.35rem;
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  transition: background 0.2s ease;
  text-transform: none;
  letter-spacing: 0;
}

.pwrap__card-edit:hover { background: rgba(35, 89, 49, 0.06); }

.pwrap__card-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 0 1.35rem 1.35rem;
}

.pwrap__card-desc {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.82rem;
  line-height: 1.5;
  margin: 0;
}

.pwrap__info-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.25rem 0;
}

.pwrap__info-label {
  color: rgba(8, 17, 13, 0.35);
  font-size: 0.75rem;
  font-weight: 700;
  gap: 0.35rem;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.pwrap__info-label i { font-size: 0.7rem; }

.pwrap__info-value {
  color: #08110d;
  font-size: 1rem;
  font-weight: 600;
  padding-left: 0.1rem;
}

.pwrap__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pwrap__field label {
  color: rgba(8, 17, 13, 0.5);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 0.1rem;
  text-transform: uppercase;
}

.pwrap__input-wrap {
  align-items: center;
  background: rgba(8, 17, 13, 0.02);
  border: 1px solid rgba(35, 89, 49, 0.07);
  border-radius: 12px;
  display: flex;
  gap: 0.55rem;
  padding: 0 0.85rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.pwrap__input-wrap:focus-within {
  background: #fff;
  border-color: #235931;
  box-shadow: 0 0 0 4px rgba(35, 89, 49, 0.06);
}

.pwrap__input-wrap i:first-child {
  color: rgba(8, 17, 13, 0.25);
  font-size: 0.82rem;
  flex: 0 0 auto;
}

.pwrap__input-wrap:focus-within i:first-child { color: #235931; }

.pwrap__input-wrap input {
  background: transparent;
  border: 0;
  flex: 1;
  font-size: 0.92rem;
  min-height: 44px;
  outline: none;
  padding: 0;
  min-width: 0;
  color: var(--text);
}

.pwrap__input-wrap input::placeholder { color: rgba(8, 17, 13, 0.2); }

.pwrap__input-toggle {
  align-items: center;
  background: transparent;
  border: 0;
  color: rgba(8, 17, 13, 0.25);
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  font-size: 0.85rem;
  min-height: 44px;
  padding: 0;
  transition: color 0.2s ease;
}

.pwrap__input-toggle:hover { color: rgba(8, 17, 13, 0.5); }

.pwrap__strength {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.pwrap__strength-bar {
  background: rgba(8, 17, 13, 0.04);
  border-radius: 999px;
  flex: 1;
  height: 4px;
  overflow: hidden;
}

.pwrap__strength-fill {
  border-radius: 999px;
  height: 100%;
  transition: all 0.3s ease;
}

.pwrap__strength-label {
  flex: 0 0 auto;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.pwrap__match {
  margin-top: 0.05rem;
}

.pwrap__match-ok,
.pwrap__match-err {
  align-items: center;
  display: flex;
  font-size: 0.72rem;
  font-weight: 600;
  gap: 0.3rem;
}

.pwrap__match-ok { color: #00a523; }
.pwrap__match-err { color: #a02828; }

.pwrap__actions {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.pwrap__actions .pwrap__btn { flex: 1; }

.pwrap__btn {
  align-items: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.4rem;
  justify-content: center;
  min-height: 50px;
  padding: 0.75rem 1.25rem;
  transition: all 0.25s ease;
}

.pwrap__btn i { font-size: 0.82rem; }

.pwrap__btn--primary {
  background: #235931;
  color: #fff;
}

.pwrap__btn--primary:hover:not(:disabled) {
  background: #00a523;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 165, 35, 0.3);
}

.pwrap__btn--primary:disabled { opacity: 0.6; cursor: not-allowed; }

.pwrap__btn--ghost {
  background: rgba(8, 17, 13, 0.04);
  color: rgba(8, 17, 13, 0.5);
}

.pwrap__btn--ghost:hover {
  background: rgba(8, 17, 13, 0.08);
  color: #08110d;
}

.pwrap__btn.loading {
  gap: 0.5rem;
  pointer-events: none;
}

.pwrap__btn-spinner {
  animation: pwrap-spin 0.7s linear infinite;
  border: 2px solid rgba(255,255,255,0.3);
  border-left-color: #fff;
  border-radius: 50%;
  display: inline-block;
  height: 14px;
  width: 14px;
}

@keyframes pwrap-spin {
  to { transform: rotate(360deg); }
}

.pwrap__btn--danger {
  background: rgba(160, 40, 40, 0.04);
  border: 1px solid rgba(160, 40, 40, 0.08);
  color: #a02828;
}

.pwrap__btn--danger:hover {
  background: #a02828;
  border-color: #a02828;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(160, 40, 40, 0.25);
}

.section-fade-enter-active,
.section-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.section-fade-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.section-fade-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

.edit-fade-enter-active,
.edit-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.edit-fade-enter-from { opacity: 0; transform: translateY(16px) scale(0.96); }
.edit-fade-leave-to { opacity: 0; transform: translateY(-10px) scale(0.96); }

@media (min-width: 600px) {
  .pwrap__main { max-width: 600px; padding-left: 2rem; padding-right: 2rem; }
  .pwrap__hero { padding: 3.5rem 2.5rem 2.25rem; border-radius: 32px; }
  .pwrap__avatar-label { height: 120px; width: 120px; }
  .pwrap__avatar-ring { height: 130px; width: 130px; top: -5px; left: -5px; }
  .pwrap__avatar-badge { height: 32px; width: 32px; }
  .pwrap__avatar-badge i { font-size: 0.82rem; }
  .pwrap__hero-name { font-size: 1.65rem; }
  .pwrap__card { border-radius: 28px; }
  .pwrap__card-body { padding: 0 1.5rem 1.5rem; }
  .pwrap__card-head { padding: 1rem 1.5rem; }
  .pwrap__info-value { font-size: 1.05rem; }
}

@media (min-width: 900px) {
  .pwrap__main { gap: 1.25rem; max-width: 640px; }
  .pwrap__card { border-radius: 28px; }
}
</style>
