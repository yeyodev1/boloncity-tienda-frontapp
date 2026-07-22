<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import imagesData from '@/assets/images.json'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const user = useUserStore()
const { success, error } = useToast()
const heroImage = imagesData[8]?.url || imagesData[0]?.url

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
      accountType: currentUser.accountType as 'customer' | 'branch_admin' | 'admin',
      branches: currentUser.branches?.map((branch: { _id: string }) => branch._id) || [],
      allBranches: currentUser.allBranches || false,
    })
    success('Sesión iniciada')
    router.push('/')
  } catch {
    error('No se pudo iniciar sesión')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-layout">
      <div class="auth-visual">
        <img class="auth-visual__bg" :src="heroImage" alt="" aria-hidden="true" />
        <div class="auth-visual__content">
          <RouterLink class="auth-brand" to="/">
            <span class="auth-brand__icon">BC</span>
            <span class="auth-brand__name">Boloncity</span>
          </RouterLink>
          <div class="auth-visual__text">
            <span class="auth-visual__eyebrow">Tu cuenta Boloncity</span>
            <h1 class="auth-visual__title">Vuelve por tu próximo antojo</h1>
            <p class="auth-visual__desc">Entra para pedir más rápido, revisar tus pedidos y seguir disfrutando los sabores que ya conoces.</p>
          </div>
          <ul class="auth-benefits">
            <li>
              <i class="fa-regular fa-circle-check" />
              <span>Pide tus favoritos en menos pasos</span>
            </li>
            <li>
              <i class="fa-regular fa-circle-check" />
              <span>Consulta el estado de tu pedido</span>
            </li>
            <li>
              <i class="fa-regular fa-circle-check" />
              <span>Guarda tus datos para próximas compras</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="auth-card-wrap">
        <div class="auth-card">
          <div class="auth-card__head">
            <span class="auth-card__eyebrow">Bienvenido</span>
            <h2 class="auth-card__title">Ingresar</h2>
            <p class="auth-card__desc">Accede a tu cuenta para comprar y seguir tus pedidos con una experiencia más rápida.</p>
          </div>

          <form class="auth-form" @submit.prevent="submit">
            <label class="auth-field">
              <span class="auth-field__label">Email</span>
              <div class="auth-field__wrap">
                <i class="fa-regular fa-envelope" />
                <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
              </div>
            </label>

            <label class="auth-field">
              <span class="auth-field__label">Contraseña</span>
              <div class="auth-field__wrap">
                <i class="fa-solid fa-lock" />
                <input v-model="password" type="password" placeholder="Tu contraseña" autocomplete="current-password" />
              </div>
            </label>

            <button class="auth-submit" type="submit" :disabled="loading || !email || !password">
              <template v-if="loading">
                <i class="fa-solid fa-circle-notch fa-spin" />
                Ingresando
              </template>
              <template v-else>
                Ingresar
                <i class="fa-solid fa-arrow-right" />
              </template>
            </button>
          </form>

          <p class="auth-switch">
            ¿No tienes cuenta?
            <RouterLink to="/registro">Crear cuenta</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.auth-page {
  background:
    radial-gradient(ellipse at 30% 0%, rgba(239, 213, 55, 0.12), transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(35, 89, 49, 0.08), transparent 40%),
    #f8f6ec;
  display: flex;
  min-height: 100dvh;
}

.auth-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
}

.auth-visual {
  display: flex;
  flex-direction: column;
  min-height: 340px;
  overflow: hidden;
  padding: 1.25rem 1.25rem 1.5rem;
  position: relative;
}

.auth-visual__bg {
  height: 100%;
  inset: 0;
  object-fit: cover;
  opacity: 0.4;
  position: absolute;
  width: 100%;
}

.auth-visual::before {
  background: linear-gradient(180deg, rgba(8, 17, 13, 0.15), rgba(8, 17, 13, 0.78));
  content: '';
  inset: 0;
  position: absolute;
  z-index: 1;
}

.auth-visual__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: flex-end;
  position: relative;
  z-index: 2;
}

.auth-brand {
  align-items: center;
  display: inline-flex;
  gap: 0.7rem;
  left: 0;
  position: absolute;
  top: 0;
}

.auth-brand__icon {
  align-items: center;
  background: #efd537;
  border-radius: 14px;
  color: #08110d;
  display: inline-flex;
  font-size: 0.85rem;
  font-weight: 900;
  height: 42px;
  justify-content: center;
  letter-spacing: -0.08em;
  width: 42px;
}

.auth-brand__name {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.auth-visual__eyebrow {
  color: #efd537;
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
}

.auth-visual__title {
  color: #fff;
  font-size: clamp(2rem, 8vw, 3.4rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
}

.auth-visual__desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.92rem;
  line-height: 1.6;
  margin-top: 0.5rem;
  max-width: 32rem;
}

.auth-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  list-style: none;
}

.auth-benefits li {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  display: inline-flex;
  gap: 0.55rem;
  padding: 0.55rem 1rem;
  width: fit-content;
}

.auth-benefits li i {
  color: #00a523;
  font-size: 0.85rem;
}

.auth-benefits li span {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.auth-card-wrap {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 1.25rem 1.5rem;
}

.auth-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(8, 17, 13, 0.06);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(8, 17, 13, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  width: 100%;
}

.auth-card__head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.auth-card__eyebrow {
  color: #00a523;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth-card__title {
  color: #08110d;
  font-size: clamp(1.8rem, 6vw, 2.8rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 0.92;
  text-transform: uppercase;
}

.auth-card__desc {
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-top: 0.2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.auth-field__label {
  color: rgba(8, 17, 13, 0.55);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding-left: 0.2rem;
  text-transform: uppercase;
}

.auth-field__wrap {
  align-items: center;
  background: #fff;
  border: 1.5px solid rgba(8, 17, 13, 0.08);
  border-radius: 16px;
  display: flex;
  gap: 0.65rem;
  padding: 0 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-field__wrap:focus-within {
  border-color: #235931;
  box-shadow: 0 0 0 3px rgba(35, 89, 49, 0.1);
}

.auth-field__wrap i {
  color: rgba(8, 17, 13, 0.28);
  font-size: 0.9rem;
  flex: 0 0 auto;
}

.auth-field__wrap:focus-within i {
  color: #235931;
}

.auth-field__wrap input {
  background: transparent;
  border: 0;
  box-shadow: none;
  color: #08110d;
  font-size: 0.95rem;
  min-height: 50px;
  padding: 0;
}

.auth-field__wrap input:focus {
  box-shadow: none;
}

.auth-field__wrap input::placeholder {
  color: rgba(8, 17, 13, 0.28);
}

.auth-submit {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 0.95rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.04em;
  margin-top: 0.25rem;
  min-height: 54px;
  padding: 0.8rem 1.4rem;
  text-transform: uppercase;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.auth-submit:hover:not(:disabled) {
  background: #00a523;
  box-shadow: 0 12px 28px rgba(35, 89, 49, 0.25);
  transform: translateY(-2px);
}

.auth-submit:disabled {
  opacity: 0.5;
}

.auth-switch {
  color: rgba(26, 26, 26, 0.55);
  font-size: 0.85rem;
  text-align: center;
}

.auth-switch a {
  color: #235931;
  font-weight: 700;
  margin-left: 0.25rem;
  text-decoration: underline;
}

@media (min-width: 640px) {
  .auth-visual {
    min-height: 400px;
    padding: 1.5rem 2rem 2rem;
  }

  .auth-visual__bg {
    opacity: 0.5;
  }

  .auth-visual__content {
    gap: 2rem;
  }

  .auth-visual__title {
    font-size: clamp(2.6rem, 5vw, 4rem);
  }

  .auth-benefits {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .auth-card-wrap {
    padding: 0 2rem 2rem;
  }

  .auth-card {
    margin: 0 auto;
    max-width: 480px;
    padding: 2rem;
  }
}

@media (min-width: 960px) {
  .auth-page {
    min-height: 100vh;
  }

  .auth-layout {
    flex-direction: row;
    min-height: 100vh;
  }

  .auth-visual {
    flex: 1 1 0;
    min-height: 100vh;
    padding: 2.5rem 3rem;
  }

  .auth-visual__bg {
    opacity: 0.55;
  }

  .auth-visual__content {
    justify-content: center;
    gap: 2.5rem;
  }

  .auth-visual__title {
    font-size: clamp(3rem, 4vw, 5rem);
  }

  .auth-benefits {
    flex-direction: column;
    gap: 0.65rem;
  }

  .auth-benefits li {
    padding: 0.65rem 1.2rem;
  }

  .auth-benefits li span {
    font-size: 0.88rem;
  }

  .auth-card-wrap {
    flex: 0 0 460px;
    padding: 2rem 2.5rem;
  }

  .auth-card {
    max-width: none;
    padding: 2.5rem;
  }

  .auth-card__title {
    font-size: 2.4rem;
  }
}
</style>
