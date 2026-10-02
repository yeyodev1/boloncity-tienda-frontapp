<script setup lang="ts">
import type { ActivePromoDTO } from '@/services/SettingsService'

defineProps<{
  promo: ActivePromoDTO
}>()

const search = defineModel<string>('search', { required: true })
</script>

<template>
  <section class="catalog-hero">
    <div class="catalog-hero__copy">
      <p class="catalog-hero__eyebrow">Menú Boloncity</p>
      <h1>Qué se te <span>antoja</span> hoy?</h1>
      <p class="catalog-hero__lead">Bolones, tigrillos y desayunos hechos al momento. Elige, ajusta la cantidad y lo pedimos en minutos.</p>
    </div>

    <label class="catalog-hero__search">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
      <span class="visually-hidden">Buscar en el menú</span>
      <input v-model="search" type="search" enterkeyhint="search" autocomplete="off" placeholder="Busca bolón, tigrillo, café…" />
      <button v-if="search" type="button" aria-label="Borrar búsqueda" @click="search = ''"><i class="fa-solid fa-xmark" /></button>
    </label>

    <div v-if="promo.active" class="catalog-hero__promo" role="note">
      <strong>-{{ promo.percent }}%</strong>
      <span>{{ promo.label || `${promo.percent}% de descuento en todo el menú` }} · <small>no incluye el envío</small></span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.catalog-hero {
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(239, 213, 55, 0.28) 0%, transparent 46%),
    linear-gradient(160deg, #235931 0%, #153d22 62%, #102719 100%);
  border-radius: 26px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow: hidden;
  padding: 1.5rem 1.15rem 1.15rem;
  position: relative;
}

/* Un bolón de verde visto desde arriba: la forma de la casa, a medio asomar. */
.catalog-hero::after {
  background:
    radial-gradient(circle at 38% 34%, rgba(255, 255, 255, 0.18) 0 8%, transparent 9%),
    radial-gradient(circle at 62% 58%, rgba(255, 255, 255, 0.12) 0 6%, transparent 7%),
    radial-gradient(circle, #efd537 0 58%, #d9bd1e 59% 64%, transparent 65%);
  border-radius: 50%;
  content: '';
  height: 170px;
  opacity: 0.22;
  position: absolute;
  right: -56px;
  top: -64px;
  width: 170px;
}

.catalog-hero__copy { position: relative; z-index: 1; }

.catalog-hero__eyebrow {
  color: #efd537;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2rem, 8.5vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.98;
  margin: 0;
  max-width: 14ch;
}

h1 span { color: #efd537; }

.catalog-hero__lead {
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0.7rem 0 0;
  max-width: 38ch;
}

.catalog-hero__search {
  align-items: center;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 30px -12px rgba(0, 0, 0, 0.45);
  color: #102719;
  display: flex;
  gap: 0.6rem;
  min-height: 54px;
  padding: 0 0.6rem 0 1rem;
  position: relative;
  z-index: 1;

  > i { color: #235931; }

  input {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    color: #102719;
    flex: 1 1 auto;
    font-size: 1rem;
    min-width: 0;
    padding: 0.9rem 0;

    &::placeholder { color: rgba(16, 39, 25, 0.45); }
    &:focus { box-shadow: none; }
    &::-webkit-search-cancel-button { display: none; }
  }

  button {
    align-items: center;
    background: rgba(16, 39, 25, 0.06);
    border-radius: 50%;
    color: #102719;
    cursor: pointer;
    display: flex;
    flex: 0 0 auto;
    height: 34px;
    justify-content: center;
    width: 34px;
  }

  &:focus-within { box-shadow: 0 0 0 3px #efd537, 0 12px 30px -12px rgba(0, 0, 0, 0.45); }
}

.catalog-hero__promo {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  display: flex;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  position: relative;
  z-index: 1;

  strong {
    background: #a52323;
    border-radius: 8px;
    flex: 0 0 auto;
    font-size: 0.9rem;
    font-weight: 800;
    padding: 0.3rem 0.5rem;
  }

  span { font-size: 0.85rem; font-weight: 600; line-height: 1.35; }
  small { color: rgba(255, 255, 255, 0.65); font-size: 0.78rem; font-weight: 500; }
}

.visually-hidden {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

@media (min-width: 901px) {
  .catalog-hero {
    align-items: end;
    column-gap: 2.5rem;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    padding: 2.6rem 2.6rem 2.4rem;
  }

  .catalog-hero::after { height: 300px; right: -90px; top: -110px; width: 300px; }
  .catalog-hero__search { align-self: end; }
  .catalog-hero__promo { grid-column: 1 / -1; justify-self: start; }
}
</style>
