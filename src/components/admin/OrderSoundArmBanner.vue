<script setup lang="ts">
import { computed } from 'vue'
import { useOrderSounds } from '@/composables/useOrderSounds'

/**
 * El navegador bloquea el audio hasta que alguien toca la página, y ese permiso se
 * pierde con cada recarga. Sin este aviso el tablero se queda mudo en silencio: la
 * sucursal cree que tiene sonido activado y nunca escucha un pedido entrar.
 */
const { muted, armed, armSound, setMuted, playNewOrder } = useOrderSounds()

const visible = computed(() => !armed.value || muted.value)

function activate() {
  if (muted.value) setMuted(false)
  armSound()
}

function test() {
  playNewOrder()
}
</script>

<template>
  <section v-if="visible" class="sound-arm" role="status">
    <i class="fa-solid fa-bell-slash sound-arm__icon" />
    <div class="sound-arm__text">
      <strong>{{ muted ? 'Los avisos están silenciados' : 'Activa el aviso de pedidos nuevos' }}</strong>
      <span v-if="muted">Alguien silenció el sonido en este equipo. Actívalo para escuchar cuando entre un pedido.</span>
      <span v-else>El navegador no deja sonar nada hasta que toques la pantalla, y hay que hacerlo cada vez que se recarga la página.</span>
    </div>
    <button type="button" class="sound-arm__btn" @click="activate">
      <i class="fa-solid fa-volume-high" /> Activar sonido
    </button>
  </section>
  <section v-else class="sound-arm sound-arm--ok" role="status">
    <i class="fa-solid fa-bell sound-arm__icon" />
    <div class="sound-arm__text">
      <strong>Aviso de pedidos activado</strong>
      <span>Sonará cuando entre un pedido nuevo. Si recargas la página, hay que activarlo otra vez.</span>
    </div>
    <button type="button" class="sound-arm__btn sound-arm__btn--ghost" @click="test">
      <i class="fa-solid fa-play" /> Probar
    </button>
  </section>
</template>

<style scoped lang="scss">
.sound-arm {
  align-items: center;
  background: #fff3cd;
  border: 1px solid rgba(200, 150, 0, 0.45);
  border-radius: 14px;
  color: #5c4500;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
}

.sound-arm--ok {
  background: rgba(0, 165, 35, 0.08);
  border-color: rgba(0, 165, 35, 0.3);
  color: #0a5c1d;
}

.sound-arm__icon {
  font-size: 1.1rem;
}

.sound-arm__text {
  display: flex;
  flex: 1 1 16rem;
  flex-direction: column;
  gap: 0.15rem;
}

.sound-arm__text strong {
  font-size: 0.9rem;
}

.sound-arm__text span {
  font-size: 0.78rem;
  opacity: 0.85;
}

.sound-arm__btn {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 0.45rem;
  min-height: 44px;
  padding: 0.6rem 1.1rem;
}

.sound-arm__btn--ghost {
  background: transparent;
  border: 1.5px solid rgba(10, 92, 29, 0.4);
  color: #0a5c1d;
}
</style>
