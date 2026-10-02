<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import FooterIncredible from '@/components/FooterIncredible.vue'
import HomeFeatured from '@/components/home/HomeFeatured.vue'
import HomeBranches from '@/components/home/HomeBranches.vue'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import { useSettingsStore } from '@/stores/settings'
import { displayProductName, isCustomerCategory } from '@/utils/productName'

/**
 * Portada de la tienda: se vende desde el primer pantallazo. Hero con "Pedir ahora", lo más pedido con precio,
 * accesos por categoría, cómo funciona, los locales y la historia corta de la marca.
 */
const cloud = (url: string, transform: string) => url.replace('/upload/', `/upload/${transform}/`)
const PHOTOS = {
  hero: 'https://res.cloudinary.com/dv9t4acbc/image/upload/v1781805903/boloncity/duylmgbgbfsamiypedff.jpg',
  story: 'https://res.cloudinary.com/dv9t4acbc/image/upload/v1781805887/boloncity/f7fbqfndn60hm2wge3xh.jpg',
  celebrate: 'https://res.cloudinary.com/dv9t4acbc/image/upload/v1781805870/boloncity/ggrggktoin4wbqvxnbzs.jpg',
}

const settings = useSettingsStore()
const promo = computed(() => settings.promo)

const categories = ref<CategoryDTO[]>([])
const CATEGORY_ICONS: Array<[RegExp, string]> = [
  [/torta|postre|dulce/i, 'fa-solid fa-cake-candles'],
  [/bol[oó]n|maduro|pint[oó]n/i, 'fa-solid fa-cookie'],
  [/tigrillo|trigrillo/i, 'fa-solid fa-bowl-food'],
  [/desayun|combo/i, 'fa-solid fa-mug-saucer'],
  [/caf[eé]|bebida|jugo/i, 'fa-solid fa-mug-hot'],
  [/tostada/i, 'fa-solid fa-bread-slice'],
  [/especial/i, 'fa-solid fa-star'],
]
const iconFor = (name: string) => CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1] || 'fa-solid fa-utensils'

const steps = [
  { icon: 'fa-solid fa-hand-pointer', title: 'Elige tu antojo', text: 'Bolones, tigrillos, desayunos y más, hechos al momento.' },
  { icon: 'fa-solid fa-motorcycle', title: 'Delivery o retiro', text: 'Te lo llevamos o lo pasas a retirar en tu local más cercano.' },
  { icon: 'fa-solid fa-face-smile-beam', title: 'Paga y disfruta', text: 'Con tarjeta o en efectivo. Sigues tu pedido en vivo.' },
]

onMounted(async () => {
  try {
    const response = await CategoryService.getAll()
    categories.value = (response.data || []).filter((category) => category.isActive !== false && isCustomerCategory(category)).slice(0, 10)
  } catch {
    categories.value = []
  }
})
</script>

<template>
  <div class="home">
    <StoreHeader />

    <main class="home__main">
      <!-- Hero -->
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__copy">
          <p class="hero__eyebrow"><span aria-hidden="true">🫓</span> Comida costeña · Guayaquil y Quito</p>
          <h1 id="hero-title">Vas a querer <span class="hero__mark">vivir aquí.</span></h1>
          <p class="hero__lead">Bolones, tigrillos y desayunos hechos al momento, con el sabor de siempre. Pídelo a domicilio o retíralo en tu local.</p>

          <div class="hero__actions">
            <RouterLink class="btn btn--primary" to="/catalogo">Pedir ahora <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
            <RouterLink class="btn btn--ghost" to="/pedido"><i class="fa-solid fa-location-crosshairs" aria-hidden="true" /> Seguir mi pedido</RouterLink>
          </div>

          <ul class="hero__trust">
            <li><i class="fa-solid fa-fire-burner" aria-hidden="true" /> Hecho al momento</li>
            <li><i class="fa-solid fa-motorcycle" aria-hidden="true" /> Delivery o retiro</li>
            <li><i class="fa-solid fa-lock" aria-hidden="true" /> Pago seguro</li>
          </ul>
        </div>

        <div class="hero__visual">
          <img
            :src="cloud(PHOTOS.hero, 'f_auto,q_auto,c_fill,w_900,h_1000')"
            :srcset="`${cloud(PHOTOS.hero, 'f_auto,q_auto,c_fill,w_600,h_660')} 600w, ${cloud(PHOTOS.hero, 'f_auto,q_auto,c_fill,w_900,h_1000')} 900w`"
            sizes="(min-width: 1024px) 46vw, 100vw"
            alt="Bolón de verde con queso y chicharrón, servido con café"
            fetchpriority="high"
          />
          <span class="hero__sticker" aria-hidden="true">Hecho al<br />momento 🔥</span>
          <div v-if="promo.active" class="hero__promo">
            <strong>-{{ promo.percent }}%</strong>
            <span>{{ promo.label || 'en todo el menú' }}</span>
          </div>
        </div>
      </section>

      <!-- Categorías -->
      <nav v-if="categories.length" class="cats" aria-label="Categorías del menú">
        <RouterLink v-for="category in categories" :key="category._id" class="cat" :to="`/catalogo/${category.slug}`">
          <i :class="iconFor(category.name)" aria-hidden="true" />
          <span>{{ displayProductName(category.name) }}</span>
        </RouterLink>
      </nav>

      <HomeFeatured />

      <!-- Cómo funciona -->
      <section class="how" aria-labelledby="how-title">
        <p class="eyebrow">Así de fácil</p>
        <h2 id="how-title">Tu pedido en 3 pasos</h2>
        <ol class="how__steps">
          <li v-for="(step, index) in steps" :key="step.title">
            <span class="how__num" aria-hidden="true">{{ index + 1 }}</span>
            <i :class="step.icon" aria-hidden="true" />
            <strong>{{ step.title }}</strong>
            <p>{{ step.text }}</p>
          </li>
        </ol>
      </section>

      <HomeBranches />

      <!-- Historia -->
      <section class="story" aria-labelledby="story-title">
        <div class="story__photo">
          <img :src="cloud(PHOTOS.story, 'f_auto,q_auto,c_fill,w_900,h_700')" alt="Bolón, huevo frito y café en una mesa de Boloncity" loading="lazy" />
        </div>
        <div class="story__copy">
          <p class="eyebrow">La Metrópolis del Sabor</p>
          <h2 id="story-title">Desde 2016, el verde es lo nuestro</h2>
          <p>El bolón de siempre, bien hecho y servido con cariño. Somos la casa de los que madrugan, de los que extrañan la costa y de los que celebran con un buen desayuno.</p>
          <div class="story__celebrate">
            <img :src="cloud(PHOTOS.celebrate, 'f_auto,q_auto,c_fill,w_160,h_160')" alt="" loading="lazy" />
            <div>
              <strong>Para compartir</strong>
              <span>Bandejas y combos para la oficina, la familia o un cumpleaños.</span>
            </div>
            <RouterLink to="/catalogo" aria-label="Ver bandejas y combos"><i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
          </div>
        </div>
      </section>

      <!-- Cierre -->
      <section class="closing" aria-labelledby="closing-title">
        <h2 id="closing-title">Qué se te antoja hoy?</h2>
        <p>Elige, paga y en un ratito lo tienes contigo.</p>
        <RouterLink class="btn btn--dark" to="/catalogo">Ver el menú <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
      </section>
    </main>

    <FooterIncredible />
  </div>
</template>

<style scoped lang="scss">
$green: #235931;
$green-deep: #102719;
$yellow: #efd537;
$cream: #f7f5ec;
$ink: #102719;
$muted: rgba(16, 39, 25, 0.62);

.home { background: $cream; color: $ink; display: flex; flex-direction: column; min-height: 100vh; overflow-x: clip; }

.home__main {
  display: flex;
  flex-direction: column;
  gap: clamp(2.75rem, 7vw, 5rem);
  margin: 0 auto;
  max-width: 1240px;
  padding: 5.5rem 1rem clamp(3rem, 6vw, 5rem);
  width: 100%;
}

.eyebrow { color: #00a523; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; margin: 0 0 0.45rem; text-transform: uppercase; }

h2 { color: $ink; font-size: clamp(1.7rem, 5vw, 2.6rem); font-weight: 800; letter-spacing: -0.045em; line-height: 1; margin: 0; }

/* Botones */
.btn {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-weight: 800;
  gap: 0.55rem;
  justify-content: center;
  min-height: 54px;
  padding: 0.85rem 1.5rem;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:active { transform: scale(0.98); }
  &:focus-visible { outline: 3px solid $yellow; outline-offset: 3px; }
}

.btn--primary { background: $green; box-shadow: 0 14px 28px -14px rgba(35, 89, 49, 0.8); color: #fff; }
.btn--primary:hover { background: #1b4826; }
.btn--ghost { background: #fff; border: 1px solid rgba(16, 39, 25, 0.12); color: $green; }
.btn--ghost:hover { border-color: $green; }
.btn--dark { background: $green-deep; color: #fff; }
.btn--dark:hover { background: #000; }

/* Hero */
.hero { display: flex; flex-direction: column-reverse; gap: 1.5rem; }

.hero__copy { display: flex; flex-direction: column; gap: 1.1rem; }

.hero__eyebrow { color: $green; font-size: 0.82rem; font-weight: 800; margin: 0; }

h1 {
  font-size: clamp(2.6rem, 11vw, 5.2rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.92;
  margin: 0;
}

.hero__mark {
  background: linear-gradient(transparent 58%, $yellow 58%, $yellow 92%, transparent 92%);
  color: $green;
  padding: 0 0.08em;
}

.hero__lead { color: $muted; font-size: clamp(1rem, 2.6vw, 1.15rem); line-height: 1.55; margin: 0; max-width: 34rem; }

.hero__actions { display: flex; flex-direction: column; gap: 0.6rem; }

.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.1rem;
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0;

  li { align-items: center; color: $muted; display: inline-flex; font-size: 0.82rem; font-weight: 700; gap: 0.4rem; }
  i { color: $green; }
}

.hero__visual {
  border-radius: 28px;
  box-shadow: 0 30px 60px -30px rgba(16, 39, 25, 0.55);
  overflow: hidden;
  position: relative;

  img { aspect-ratio: 6 / 6.6; display: block; height: auto; object-fit: cover; width: 100%; }
}

.hero__sticker {
  background: $yellow;
  border-radius: 14px;
  bottom: 1rem;
  box-shadow: 0 10px 20px -8px rgba(16, 39, 25, 0.5);
  color: $ink;
  font-size: 0.85rem;
  font-weight: 800;
  left: 1rem;
  line-height: 1.1;
  padding: 0.6rem 0.8rem;
  position: absolute;
  transform: rotate(-4deg);
}

.hero__promo {
  align-items: center;
  background: $green-deep;
  border-radius: 999px;
  color: #fff;
  display: flex;
  font-size: 0.8rem;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem 0.45rem 0.5rem;
  position: absolute;
  right: 1rem;
  top: 1rem;

  strong { background: $yellow; border-radius: 999px; color: $ink; padding: 0.2rem 0.5rem; }
}

/* Categorías */
.cats {
  display: flex;
  gap: 0.6rem;
  margin: -1.5rem -1rem 0;
  overflow-x: auto;
  padding: 0.25rem 1rem 0.5rem;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.cat {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.08);
  border-radius: 999px;
  color: $ink;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.88rem;
  font-weight: 700;
  gap: 0.55rem;
  padding: 0.6rem 1rem 0.6rem 0.65rem;
  transition: border-color 0.2s ease, transform 0.2s ease;

  i {
    align-items: center;
    background: rgba(239, 213, 55, 0.35);
    border-radius: 50%;
    color: $green;
    display: inline-flex;
    font-size: 0.75rem;
    height: 30px;
    justify-content: center;
    width: 30px;
  }

  &:hover { border-color: $green; transform: translateY(-1px); }
}

/* Cómo funciona */
.how { display: flex; flex-direction: column; }

.how__steps {
  counter-reset: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  margin: 1.4rem 0 0;
  padding: 0;

  li {
    background: #fff;
    border: 1px solid rgba(16, 39, 25, 0.06);
    border-radius: 22px;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 0.45rem;
    overflow: hidden;
    padding: 1.3rem 1.2rem;
    position: relative;
  }

  i { color: $green; font-size: 1.35rem; }
  strong { font-size: 1.1rem; letter-spacing: -0.02em; }
  p { color: $muted; font-size: 0.9rem; line-height: 1.5; margin: 0; }
}

.how__num {
  color: rgba(239, 213, 55, 0.55);
  font-size: 5.5rem;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 1;
  position: absolute;
  right: 0.6rem;
  top: -0.4rem;
}

/* Historia */
.story {
  background: $green-deep;
  border-radius: 30px;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.story__photo img { aspect-ratio: 9 / 7; display: block; height: auto; object-fit: cover; width: 100%; }

.story__copy {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.6rem 1.3rem 1.5rem;

  .eyebrow { color: $yellow; }
  h2 { color: #fff; }
  > p { color: rgba(255, 255, 255, 0.75); line-height: 1.6; margin: 0; }
}

.story__celebrate {
  align-items: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  display: flex;
  gap: 0.8rem;
  margin-top: 0.4rem;
  padding: 0.6rem;

  img { border-radius: 12px; flex: 0 0 56px; height: 56px; object-fit: cover; width: 56px; }
  div { display: flex; flex: 1; flex-direction: column; gap: 0.15rem; min-width: 0; }
  strong { font-size: 0.95rem; }
  span { color: rgba(255, 255, 255, 0.65); font-size: 0.8rem; }

  a {
    align-items: center;
    background: $yellow;
    border-radius: 50%;
    color: $ink;
    display: flex;
    flex: 0 0 40px;
    height: 40px;
    justify-content: center;
  }
}

/* Cierre */
.closing {
  align-items: center;
  background: $yellow;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2.4rem 1.3rem;
  text-align: center;

  p { color: rgba(16, 39, 25, 0.72); margin: 0 0 0.4rem; }
}

@media (prefers-reduced-motion: reduce) {
  .btn, .cat { transition: none; }
  .cat:hover { transform: none; }
}

/* Tablet+ */
@media (min-width: 640px) {
  .hero__actions { flex-direction: row; }
  .how__steps { flex-direction: row; }
  .how__steps li { flex: 1 1 0; }
}

/* Escritorio */
@media (min-width: 1024px) {
  .home__main { padding-top: 7rem; }

  .hero { align-items: center; flex-direction: row; gap: 3rem; }
  .hero__copy { flex: 1 1 52%; }
  .hero__visual { flex: 1 1 48%; transform: rotate(1.5deg); }
  .hero__visual img { aspect-ratio: 9 / 10; }
  .hero__sticker { font-size: 1rem; left: -1px; padding: 0.8rem 1rem; }

  .cats { flex-wrap: wrap; margin: -2.5rem 0 0; overflow: visible; padding: 0; }

  .story { align-items: stretch; flex-direction: row; }
  .story__photo { flex: 1 1 50%; }
  .story__photo img { aspect-ratio: auto; height: 100%; }
  .story__copy { flex: 1 1 50%; justify-content: center; padding: 3rem; }

  .closing { padding: 3.5rem 2rem; }
}
</style>
