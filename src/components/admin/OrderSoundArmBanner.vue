<script setup lang="ts">
import { computed } from 'vue'
import { useOrderSounds } from '@/composables/useOrderSounds'

/**
 * El navegador bloquea el audio hasta que alguien toca la página, y ese permiso se
 * pierde con cada recarga. Sin este aviso el tablero se queda mudo en silencio: la
 * sucursal cree que tiene sonido activado y nunca escucha un pedido entrar.
 */
const { muted, armed, volume, armSound, setMuted, setVolume, playTest } = useOrderSounds()

const visible = computed(() => !armed.value || muted.value)

function activate() {
  if (muted.value) setMuted(false)
  armSound()
}

function test() {
  playTest()
}

function onVolume(event: Event) {
  setVolume(Number((event.target as HTMLInputElement).value) / 100)
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
    <label class="sound-arm__volume">
      <i class="fa-solid fa-volume-low" aria-hidden="true" />
      <input type="range" min="20" max="100" step="5" :value="Math.round(volume * 100)" aria-label="Volumen del aviso" @change="onVolume" @input="onVolume" />
      <span>{{ Math.round(volume * 100) }}%</span>
    </label>
    <button type="button" class="sound-arm__btn sound-arm__btn--ghost" @click="test">
      <i class="fa-solid fa-play" /> Probar
    </button>
  </section>
</template>

<style scoped lang="scss">
.sound-arm {
  align-items: center;
  background: var(--admin-warning-soft, #fff3cd);
  border: 1px solid color-mix(in srgb, var(--admin-warning, #a86b00) 45%, transparent);
  border-radius: 16px;
  color: var(--admin-text, #5c4500);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
}

.sound-arm--ok {
  background: var(--admin-success-soft, rgba(0, 165, 35, 0.08));
  border-color: color-mix(in srgb, var(--admin-success, #12823a) 40%, transparent);
}

.sound-arm__icon { color: var(--admin-warning, #a86b00); font-size: 1.15rem; }
.sound-arm--ok .sound-arm__icon { color: var(--admin-success, #12823a); }

.sound-arm__text {
  display: flex;
  flex: 1 1 16rem;
  flex-direction: column;
  gap: 0.15rem;

  strong { font-size: 0.9rem; }
  span { color: var(--admin-muted, inherit); font-size: 0.78rem; }
}

.sound-arm__volume {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;

  i { color: var(--admin-muted); font-size: 0.8rem; }
  span { color: var(--admin-muted); font-size: 0.74rem; font-variant-numeric: tabular-nums; font-weight: 800; min-width: 2.6rem; }

  input {
    accent-color: var(--admin-accent, #235931);
    background: transparent !important;
    border: 0 !important;
    min-height: 0 !important;
    padding: 0 !important;
    width: 110px;
  }
}

.sound-arm__btn {
  align-items: center;
  background: var(--admin-accent, #235931);
  border: 0;
  border-radius: 999px;
  color: var(--admin-on-accent, #fff);
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
  border: 1.5px solid color-mix(in srgb, var(--admin-success, #12823a) 45%, transparent);
  color: var(--admin-success, #0a5c1d);
}
</style>
