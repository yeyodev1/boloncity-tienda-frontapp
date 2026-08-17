<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import logoImg from '@/assets/logos/logo.png'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const user = useUserStore()
const { success, error } = useToast()

async function submit() {
  loading.value = true
  try {
    const response = await AuthService.login(email.value, password.value)
    const { token, user: currentUser } = response.data
    user.setSessionToken(token)
    user.setUser({
      id: currentUser._id,
      email: currentUser.email,
      name: currentUser.name,
      phone: currentUser.phone,
      photo: currentUser.photo,
      accountType: currentUser.accountType as 'customer' | 'branch_admin' | 'admin',
      branches: currentUser.branches?.map((branch: { _id: string }) => branch._id) || [],
      allBranches: currentUser.allBranches || false,
    })
    success('Sesión iniciada')
    // El personal aterriza directo en su panel; los clientes, en la tienda.
    if (currentUser.accountType === 'branch_admin') router.push('/admin/operacion')
    else if (currentUser.accountType === 'admin') router.push('/admin')
    else router.push('/')
  } catch {
    error('No se pudo iniciar sesión')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth">
    <div class="auth__bg">
      <span class="auth__orb auth__orb--1" />
      <span class="auth__orb auth__orb--2" />
      <span class="auth__orb auth__orb--3" />
    </div>

    <div class="auth__inner">
      <RouterLink class="auth__brand" to="/">
        <img :src="logoImg" alt="Boloncity" class="auth__logo" />
      </RouterLink>

      <p class="auth__tagline">El sabor que te enamora, ahora en tus manos.</p>

      <ul class="auth__benefits">
        <li><i class="fa-regular fa-circle-check" /> <span>Compra más rápido</span></li>
        <li><i class="fa-regular fa-circle-check" /> <span>Revisa tus pedidos</span></li>
      </ul>

      <div class="auth__card">
        <div class="auth__card-head">
          <h2 class="auth__card-title">Bienvenido de vuelta</h2>
          <p class="auth__card-sub">Ingresa a tu cuenta para ver tus pedidos</p>
        </div>

        <form class="auth__form" @submit.prevent="submit">
          <label class="auth__field">
            <span class="auth__field-label">Correo electrónico</span>
            <div class="auth__field-input">
              <i class="fa-regular fa-envelope" />
              <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
            </div>
          </label>

          <label class="auth__field">
            <span class="auth__field-label">Contraseña</span>
            <div class="auth__field-input">
              <i class="fa-solid fa-lock" />
              <input v-model="password" type="password" placeholder="Tu contraseña" autocomplete="current-password" />
            </div>
          </label>

            <button class="auth__btn" type="submit" :disabled="loading || !email || !password">
              <template v-if="loading">
                <i class="fa-solid fa-circle-notch fa-spin" /> Ingresando
              </template>
              <template v-else>
                <i class="fa-solid fa-arrow-right-to-bracket" /> Iniciar Sesión
              </template>
            </button>

            <RouterLink class="auth__forgot" to="/forgot-password">¿Olvidaste tu contraseña?</RouterLink>
          </form>

          <p class="auth__switch">
            ¿No tienes cuenta?
            <RouterLink to="/registro">Crear cuenta</RouterLink>
          </p>

          <p class="auth__footnote">¿No tienes cuenta? Cuando realices tu primer pedido te crearemos una automáticamente y te enviaremos tu contraseña por correo.</p>
        </div>
      </div>
  </section>
</template>

<style scoped lang="scss">
.auth {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 100dvh;
  overflow: hidden;
  padding: 1.25rem;
  position: relative;
}

.auth__bg {
  height: 100%;
  inset: 0;
  overflow: hidden;
  position: absolute;
  width: 100%;
}

.auth__orb {
  border-radius: 50%;
  position: absolute;
}

.auth__orb--1 {
  background: radial-gradient(circle, rgba(239, 213, 55, 0.2), transparent 70%);
  height: 500px;
  right: -150px;
  top: -100px;
  width: 500px;
}

.auth__orb--2 {
  background: radial-gradient(circle, rgba(0, 165, 35, 0.1), transparent 70%);
  bottom: -80px;
  height: 350px;
  left: -80px;
  width: 350px;
}

.auth__orb--3 {
  background: radial-gradient(circle, rgba(35, 89, 49, 0.08), transparent 70%);
  bottom: 30%;
  height: 400px;
  right: -100px;
  width: 400px;
}

.auth__inner {
  align-items: center;
  display: flex;
  flex-direction: column;
  max-width: 420px;
  position: relative;
  text-align: center;
  width: 100%;
  z-index: 1;
}

.auth__brand {
  display: inline-flex;
  margin-bottom: 1.5rem;
}

.auth__logo {
  height: auto;
  max-height: 38px;
  object-fit: contain;
  width: 130px;
}

.auth__tagline {
  color: rgba(26, 26, 26, 0.55);
  font-size: 0.95rem;
  margin-bottom: 1.25rem;
}

.auth__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  list-style: none;
  margin-bottom: 1.5rem;
}

.auth__benefits li {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  display: inline-flex;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
}

.auth__benefits li i {
  color: #00a523;
  font-size: 0.7rem;
}

.auth__benefits li span {
  color: rgba(26, 26, 26, 0.75);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.auth__card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(26, 26, 26, 0.04);
  border-radius: 24px;
  box-shadow:
    0 20px 60px rgba(8, 17, 13, 0.06),
    0 2px 8px rgba(8, 17, 13, 0.02);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  width: 100%;
  backdrop-filter: blur(16px);
}

.auth__card-head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
}

.auth__card-title {
  color: #08110d;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.auth__card-sub {
  color: rgba(26, 26, 26, 0.55);
  font-size: 0.88rem;
  line-height: 1.5;
}

.auth__form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.auth__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: left;
}

.auth__field-label {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding-left: 0.15rem;
  text-transform: uppercase;
}

.auth__field-input {
  align-items: center;
  background: #fff;
  border: 1.5px solid rgba(8, 17, 13, 0.07);
  border-radius: 14px;
  display: flex;
  gap: 0.6rem;
  padding: 0 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.auth__field-input:focus-within {
  background: #fff;
  border-color: #235931;
  box-shadow: 0 0 0 3px rgba(35, 89, 49, 0.08);
}

.auth__field-input i {
  color: rgba(8, 17, 13, 0.2);
  font-size: 0.85rem;
  flex: 0 0 auto;
  transition: color 0.2s ease;
}

.auth__field-input:focus-within i {
  color: #235931;
}

.auth__field-input input {
  background: transparent;
  border: 0;
  box-shadow: none;
  color: #08110d;
  font-size: 0.92rem;
  min-height: 48px;
  padding: 0;
}

.auth__field-input input:focus {
  box-shadow: none;
}

.auth__field-input input::placeholder {
  color: rgba(8, 17, 13, 0.2);
}

.auth__btn {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 0.9rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.04em;
  margin-top: 0.15rem;
  min-height: 50px;
  padding: 0.8rem 1.2rem;
  text-transform: uppercase;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.auth__btn:hover:not(:disabled) {
  background: #00a523;
  box-shadow: 0 12px 28px rgba(35, 89, 49, 0.22);
  transform: translateY(-3px);
}

.auth__btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.auth__btn:disabled {
  opacity: 0.4;
}

.auth__forgot {
  color: rgba(26, 26, 26, 0.4);
  font-size: 0.82rem;
  margin-top: -0.3rem;
  text-align: center;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.auth__forgot:hover {
  color: #235931;
}

.auth__switch {
  color: rgba(26, 26, 26, 0.5);
  font-size: 0.82rem;
  text-align: center;
}

.auth__switch a {
  color: #235931;
  font-weight: 700;
  text-decoration: underline;
}

.auth__footnote {
  color: rgba(26, 26, 26, 0.35);
  font-size: 0.75rem;
  margin-top: 1rem;
  max-width: 30ch;
}

@media (min-width: 640px) {
  .auth__inner {
    max-width: 440px;
  }

  .auth__card {
    padding: 1.75rem;
    gap: 1.5rem;
  }

  .auth__card-title {
    font-size: 1.5rem;
  }

  .auth__logo {
    max-height: 44px;
    width: 150px;
  }
}
</style>
