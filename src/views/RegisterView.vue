<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const user = useUserStore()
const { success, error } = useToast()

async function submit() {
  loading.value = true
  try {
    const response = await AuthService.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    const { token, user: currentUser } = response.data
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_account_type', currentUser.accountType)
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
        <p class="auth-visual__eyebrow">Boloncity</p>
        <h1>Registro</h1>
        <p>
          Crea tu cuenta para comprar y seguir pedidos con una interfaz sobria y directa.
        </p>
        <div class="auth-visual__badge">SABOR</div>
      </div>

      <div class="panel auth-card">
        <p class="auth-card__eyebrow">Cuenta nueva</p>
        <h2>Registro</h2>
        <p class="muted">Crea tu cuenta para comprar y seguir tus pedidos.</p>

        <form class="auth-form" @submit.prevent="submit">
          <label>
            <span>Nombre</span>
            <input v-model.trim="name" type="text" placeholder="Tu nombre" autocomplete="name" />
          </label>

          <label>
            <span>Email</span>
            <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
          </label>

          <label>
            <span>Contraseña</span>
            <input v-model="password" type="password" placeholder="Crea una contraseña" autocomplete="new-password" />
          </label>

          <button class="btn-primary" type="submit" :disabled="loading || !name || !email || !password">
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="auth-card__link muted">
          ¿Ya tienes cuenta?
          <RouterLink to="/login">Ingresar</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.auth-page {
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, rgba(35, 89, 49, 0.1), transparent 55%),
    linear-gradient(180deg, rgba(239, 213, 55, 0.06), rgba(255, 255, 255, 0));
}

.auth-layout {
  display: grid;
  gap: 1rem;
  max-width: 1120px;
  width: 100%;
}

.auth-layout--reverse {
  direction: rtl;
}

.auth-layout--reverse > * {
  direction: ltr;
}

.auth-visual,
.auth-card {
  padding: 1.5rem;
}

.auth-visual {
  background: linear-gradient(135deg, rgba(239, 213, 55, 0.96), rgba(239, 213, 55, 0.72));
  min-height: 240px;
  position: relative;
  overflow: hidden;
}

.auth-visual::after {
  content: '';
  position: absolute;
  inset: auto auto -22% -12%;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(35, 89, 49, 0.15);
  filter: blur(18px);
}

.auth-visual__eyebrow,
.auth-card__eyebrow {
  @include eyebrow;
  margin-bottom: 0.5rem;
}

.auth-visual h1,
.auth-card h2 {
  font-size: clamp(2.4rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.92;
  text-transform: uppercase;
}

.auth-visual p {
  color: rgba(26, 26, 26, 0.78);
  margin-top: 1rem;
  max-width: 26rem;
}

.auth-visual__badge {
  @include pill-button(rgba(35, 89, 49, 0.08), #235931);
  bottom: 1.5rem;
  position: absolute;
  right: 1.5rem;
}

.auth-card {
  display: grid;
  gap: 1rem;
}

.auth-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.55rem;
}

label span {
  font-size: 0.9rem;
  font-weight: 700;
}

.auth-card__link {
  display: flex;
  gap: 0.35rem;
}

.auth-card__link a {
  color: #235931;
  font-weight: 700;
}

@media (min-width: 960px) {
  .auth-layout {
    grid-template-columns: minmax(360px, 460px) minmax(0, 1fr);
    align-items: stretch;
  }

  .auth-visual {
    min-height: 620px;
  }
}
</style>
