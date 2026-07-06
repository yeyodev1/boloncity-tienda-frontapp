<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const isOpen = ref(false)
const router = useRouter()
const user = useUserStore()

function openModal() {
  if (isOpen.value) return
  user.clear()
  isOpen.value = true
}

function goToLogin() {
  isOpen.value = false
  router.push('/login')
}

onMounted(() => {
  window.addEventListener('auth:token-expired', openModal)
})

onUnmounted(() => {
  window.removeEventListener('auth:token-expired', openModal)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="session-modal">
      <div v-if="isOpen" class="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-modal-title">
        <section class="session-modal__panel">
          <p class="session-modal__eyebrow">Sesión no reconocida</p>
          <h2 id="session-modal-title">No podemos reconocer quién eres</h2>
          <p>
            Por seguridad necesitamos que vuelvas a iniciar sesión. Si tu sesión no coincide o el token ya no es válido,
            cerramos el acceso para proteger tu cuenta.
          </p>
          <button type="button" @click="goToLogin">Volver a iniciar sesión</button>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.session-modal {
  align-items: center;
  background: rgba(8, 17, 13, 0.72);
  backdrop-filter: blur(12px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 99999;
}

.session-modal__panel {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 28px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  color: #08110d;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 520px;
  padding: clamp(1.4rem, 4vw, 2rem);
  width: 100%;
}

.session-modal__eyebrow {
  color: #00a523;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.session-modal__panel h2 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin: 0;
  text-transform: uppercase;
}

.session-modal__panel p:not(.session-modal__eyebrow) {
  color: rgba(8, 17, 13, 0.68);
  line-height: 1.6;
  margin: 0;
}

.session-modal__panel button {
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font-weight: 900;
  min-height: 50px;
  padding: 0.9rem 1.2rem;
}

.session-modal-enter-active,
.session-modal-leave-active {
  transition: opacity 0.22s ease;
}

.session-modal-enter-from,
.session-modal-leave-to {
  opacity: 0;
}
</style>
