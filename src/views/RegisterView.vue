<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import imagesData from '@/assets/images.json'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const user = useUserStore()
const { success, error } = useToast()
const heroImage = imagesData[14]?.url || imagesData[1]?.url

async function submit() {
  loading.value = true
  try {
    const response = await AuthService.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    const { token, user: currentUser } = response.data
    user.setSessionToken(token)
    user.setUser({
      id: currentUser._id,
      email: currentUser.email,
      name: currentUser.name,
      accountType: currentUser.accountType as 'customer' | 'branch_admin' | 'admin',
      branches: currentUser.branches?.map((branch) => branch._id) || [],
      allBranches: currentUser.allBranches || false,
    })
    success('Cuenta creada')
    router.push('/')
  } catch {
    error('No se pudo crear la cuenta')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page page">
    <div class="auth-layout auth-layout--reverse">
      <div class="auth-visual panel">
        <img class="auth-visual__image" :src="heroImage" alt="Producto Boloncity servido" />
        <div class="auth-visual__content">
          <RouterLink class="auth-brand" to="/">
            <span>BC</span>
            <strong>Boloncity</strong>
          </RouterLink>
          <p class="auth-visual__eyebrow">Empieza aquí</p>
          <h1>Tu próxima compra más fácil</h1>
          <p>
            Crea tu cuenta para pedir tus bolones, tigrillos, bebidas y combos favoritos con menos pasos.
          </p>
        </div>

        <div class="auth-benefits" aria-label="Beneficios de registrarte">
          <span>Compra más rápido la próxima vez</span>
          <span>Revisa tus pedidos cuando lo necesites</span>
          <span>Disfruta una experiencia hecha para clientes</span>
        </div>
      </div>

      <div class="panel auth-card">
        <div class="auth-card__head">
          <p class="auth-card__eyebrow">Nueva cuenta</p>
          <h2>Registro</h2>
          <p class="muted">Déjanos tus datos principales y empieza a pedir desde la tienda en línea de Boloncity.</p>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <label class="auth-field">
            <span>Nombre</span>
            <input v-model.trim="name" type="text" placeholder="Tu nombre" autocomplete="name" />
          </label>

          <label class="auth-field">
            <span>Email</span>
            <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
          </label>

          <label class="auth-field">
            <span>Contraseña</span>
            <input v-model="password" type="password" placeholder="Crea una contraseña" autocomplete="new-password" />
          </label>

          <button class="btn-primary" type="submit" :disabled="loading || !name || !email || !password">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="auth-card__link muted">
          <span>¿Ya tienes cuenta?</span>
          <RouterLink to="/login">Ingresar</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.auth-page {
  align-items: center;
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.22), transparent 34%),
    radial-gradient(circle at 100% 20%, rgba(35, 89, 49, 0.16), transparent 32%),
    linear-gradient(135deg, #f8f6ec 0%, #f4f4f0 48%, #eef5ef 100%);
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  position: relative;
}

.auth-page::before {
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  content: '';
  height: 360px;
  left: -180px;
  position: absolute;
  top: 18%;
  width: 360px;
}

.auth-layout {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 1180px;
  min-height: 100vh;
  position: relative;
  width: 100%;
  z-index: 1;
}

.auth-layout--reverse {
  direction: rtl;
}

.auth-layout--reverse > * {
  direction: ltr;
}

.auth-visual,
.auth-card {
  border-radius: 0;
  padding: clamp(1.35rem, 5vw, 2.4rem);
}

.auth-visual {
  background:
    linear-gradient(135deg, rgba(239, 213, 55, 0.9), rgba(239, 213, 55, 0.48)),
    linear-gradient(135deg, #fff7c7 0%, #e5d153 100%);
  color: #08110d;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: space-between;
  min-height: 360px;
  overflow: hidden;
  position: relative;
}

.auth-visual__image {
  height: 100%;
  inset: 0;
  object-fit: cover;
  opacity: 0.48;
  position: absolute;
  width: 100%;
}

.auth-visual::before {
  background: linear-gradient(180deg, rgba(239, 213, 55, 0.28), rgba(239, 213, 55, 0.84));
  content: '';
  inset: 0;
  position: absolute;
  z-index: 1;
}

.auth-visual::after {
  border-radius: 50%;
  background: rgba(35, 89, 49, 0.15);
  bottom: -140px;
  content: '';
  filter: blur(18px);
  height: 320px;
  left: -120px;
  position: absolute;
  width: 320px;
}

.auth-visual__content,
.auth-benefits {
  position: relative;
  z-index: 2;
}

.auth-brand {
  align-items: center;
  display: inline-flex;
  gap: 0.75rem;
  margin-bottom: clamp(2.5rem, 12vw, 5rem);
}

.auth-brand span {
  align-items: center;
  background: #235931;
  border-radius: 16px;
  color: #fff;
  display: inline-flex;
  font-weight: 900;
  height: 46px;
  justify-content: center;
  letter-spacing: -0.08em;
  width: 46px;
}

.auth-brand strong {
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-visual__eyebrow,
.auth-card__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.auth-visual__eyebrow {
  color: #235931;
}

.auth-visual h1,
.auth-card h2 {
  font-size: clamp(2.6rem, 8vw, 5.2rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.88;
  text-transform: uppercase;
}

.auth-card h2 {
  color: #08110d;
  font-size: clamp(2.2rem, 7vw, 4rem);
}

.auth-visual p {
  color: rgba(26, 26, 26, 0.78);
  margin-top: 1rem;
  max-width: 34rem;
}

.auth-benefits {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-benefits span {
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 18px;
  color: rgba(8, 17, 13, 0.78);
  font-size: 0.92rem;
  font-weight: 800;
  padding: 0.9rem 1rem;
}

.auth-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(8, 17, 13, 0.08);
  box-shadow: 0 30px 80px rgba(8, 17, 13, 0.12);
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  justify-content: center;
}

.auth-card__head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-card__head .muted {
  line-height: 1.65;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.auth-field {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.1);
  border-radius: 22px;
  box-shadow: 0 14px 34px rgba(8, 17, 13, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem 1.05rem 1.1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.auth-field:focus-within {
  border-color: rgba(35, 89, 49, 0.35);
  box-shadow: 0 18px 40px rgba(35, 89, 49, 0.12);
  transform: translateY(-2px);
}

.auth-field span {
  color: rgba(8, 17, 13, 0.62);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-field input {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  color: #08110d;
  min-height: 34px;
  padding: 0;
}

.auth-field input:focus {
  box-shadow: none;
}

.btn-primary {
  min-height: 56px;
  box-shadow: 0 18px 34px rgba(35, 89, 49, 0.18);
}

.auth-card__link {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: center;
  padding: 0.95rem 1rem;
  text-align: center;
}

.auth-card__link a {
  color: #235931;
  font-weight: 700;
}

@media (min-width: 960px) {
  .auth-layout {
    gap: 0;
    max-width: none;
  }

  .auth-layout {
    align-items: stretch;
    flex-direction: row;
  }

  .auth-card {
    flex: 0 0 min(520px, 42vw);
    padding: clamp(2.5rem, 5vw, 4.5rem);
  }

  .auth-visual {
    flex: 1 1 0;
  }

  .auth-visual {
    min-height: 640px;
    padding: clamp(2rem, 4vw, 3rem);
  }
}
</style>
