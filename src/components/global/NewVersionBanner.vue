<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

// Detecta un despliegue nuevo comparando el hash del bundle de entrada (assets/index-XXXX.js)
// que cargó esta pestaña contra el que sirve el servidor. Si cambió, hay versión nueva:
// avisa y recarga. En pantallas sensibles (checkout/pago) NO recarga solo para no
// perder el pedido en curso — ahí el cliente decide con el botón.
const route = useRoute()
const available = ref(false)
let baseline = ''
let pollTimer: ReturnType<typeof setInterval> | null = null
let autoTimer: ReturnType<typeof setTimeout> | null = null

function entryFrom(text: string) {
  const match = text.match(/assets\/index-[\w-]+\.js/)
  return match ? match[0] : ''
}

function isSensitive() {
  return /^\/(checkout|pago|pay)/.test(route.path)
}

function reload() {
  window.location.reload()
}

async function check() {
  if (available.value || document.visibilityState !== 'visible' || !baseline) return
  try {
    const res = await fetch(`/?_v=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const entry = entryFrom(await res.text())
    if (entry && entry !== baseline) {
      available.value = true
      // Recarga automática salvo en checkout/pago, donde el cliente perdería el pedido.
      if (!isSensitive()) autoTimer = setTimeout(reload, 6000)
    }
  } catch {
    // red intermitente: se reintenta en el próximo ciclo
  }
}

onMounted(() => {
  const el = document.querySelector('script[type="module"][src*="/assets/index-"]') as HTMLScriptElement | null
  baseline = el ? entryFrom(el.src) : ''
  pollTimer = setInterval(check, 60_000)
  document.addEventListener('visibilitychange', check)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (autoTimer) clearTimeout(autoTimer)
  document.removeEventListener('visibilitychange', check)
})
</script>

<template>
  <transition name="nv-fade">
    <div v-if="available" class="new-version" role="status" aria-live="polite">
      <i class="fa-solid fa-rotate" />
      <span>Hay una nueva versión de Boloncity.</span>
      <button type="button" @click="reload">Actualizar</button>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.new-version {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  bottom: 1rem;
  box-shadow: 0 12px 30px rgba(8, 17, 13, 0.28);
  color: #fff;
  display: flex;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.65rem;
  left: 50%;
  padding: 0.7rem 0.85rem 0.7rem 1.1rem;
  position: fixed;
  transform: translateX(-50%);
  z-index: 4000;

  i { color: #efd537; }

  button {
    background: #efd537;
    border: 0;
    border-radius: 999px;
    color: #23300f;
    cursor: pointer;
    font-weight: 800;
    padding: 0.45rem 1rem;
  }
}

.nv-fade-enter-active,
.nv-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.nv-fade-enter-from,
.nv-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
