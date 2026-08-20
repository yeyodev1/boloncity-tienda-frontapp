<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { useOrderSounds } from '@/composables/useOrderSounds'

const { muted, setMuted } = useOrderSounds()
const { confirm } = useConfirm()

async function toggle() {
  if (muted.value) {
    setMuted(false)
    return
  }
  const accepted = await confirm({
    title: '¿Seguro que quieres silenciar los pedidos?',
    message: 'No escucharás cuando entre un pedido nuevo, cuando se entregue ni cuando se cancele. La preferencia se guarda en este dispositivo y puedes reactivar los sonidos con este mismo botón.',
    confirmText: 'Sí, silenciar',
    cancelText: 'Seguir escuchando',
    type: 'danger',
  })
  if (accepted) setMuted(true)
}
</script>

<template>
  <button
    type="button"
    class="sound-toggle"
    :class="{ muted }"
    :title="muted ? 'Activar sonidos de pedidos' : 'Silenciar sonidos de pedidos'"
    @click="toggle"
  >
    <i :class="muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'" />
    <span>{{ muted ? 'Silenciado' : 'Sonido' }}</span>
  </button>
</template>

<style scoped lang="scss">
.sound-toggle {
  align-items: center;
  background: rgba(0, 165, 35, 0.12);
  border: 1px solid rgba(0, 165, 35, 0.3);
  border-radius: 999px;
  color: #087c25;
  cursor: pointer;
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0.55rem 1rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.sound-toggle.muted {
  background: rgba(8, 17, 13, 0.07);
  border-color: rgba(8, 17, 13, 0.15);
  color: rgba(8, 17, 13, 0.55);
}
</style>
