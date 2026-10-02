<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import PageHead from '@/components/admin/catalog-ui/PageHead.vue'
import '@/components/admin/catalog-ui/ui.scss'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import { displayProductName } from '@/utils/productName'

const router = useRouter()
const products = ref<ProductDTO[]>([])
const loading = ref(true)
const rewardProducts = computed(() =>
  products.value.filter((product) => (product.pointsValue || 0) > 0).sort((a, b) => (b.pointsValue || 0) - (a.pointsValue || 0)),
)
const facts = computed(() => loading.value ? [] : [
  { label: 'productos dan puntos', value: rewardProducts.value.length, tone: 'good' as const },
  { label: 'no dan puntos', value: products.value.length - rewardProducts.value.length },
])

async function load() {
  try { products.value = (await ProductService.getAll({ admin: true })).data }
  finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <!-- Envoltorio: así el reset del SCSS con scope de esta vista no le quita el padding a AdminLayout. -->
  <div class="cui-root">
    <AdminLayout>
      <main class="cui-page">
        <PageHead eyebrow="Fidelidad" title="Rewards" description="Cuántos puntos gana el cliente por cada producto que compra." :facts="facts">
          <template #actions>
            <button type="button" class="cui-btn cui-btn--primary" @click="router.push('/admin/productos')"><i class="fa-solid fa-pen" /> Cambiar puntos</button>
          </template>
        </PageHead>

        <ol class="how" aria-label="Cómo funcionan los puntos">
          <li><span>1</span><p><strong>Defines los puntos</strong> en cada producto (Productos → Editar).</p></li>
          <li><span>2</span><p><strong>El cliente compra</strong>: suma puntos por cada unidad.</p></li>
          <li><span>3</span><p><strong>Se acreditan</strong> al confirmarse el pago.</p></li>
        </ol>

        <section class="list cui-panel">
          <header class="list__head"><h2>Productos que dan puntos</h2><p>De más a menos puntos.</p></header>

          <ul v-if="loading" class="list__items" aria-hidden="true">
            <li v-for="n in 4" :key="n" class="item"><span class="sk sk--thumb" /><span class="sk sk--line" /></li>
          </ul>
          <ul v-else-if="rewardProducts.length" class="list__items">
            <li v-for="product in rewardProducts" :key="product._id" class="item">
              <span class="item__thumb">
                <img v-if="product.images[0]?.url" :src="product.images[0].url" :alt="displayProductName(product.name)" loading="lazy" />
                <i v-else class="fa-solid fa-utensils" aria-hidden="true" />
              </span>
              <div class="item__body">
                <strong>{{ displayProductName(product.name) }}</strong>
                <small>${{ product.price.toFixed(2) }}<template v-if="product.code"> · {{ product.code }}</template></small>
              </div>
              <span class="item__points">+{{ product.pointsValue }}<small>pts</small></span>
            </li>
          </ul>
          <div v-else class="cui-empty">
            <i class="fa-solid fa-gift" aria-hidden="true" />
            <strong>Ningún producto da puntos todavía</strong>
            <p>Edita un producto y ponle puntos por unidad.</p>
            <button type="button" class="cui-btn cui-btn--primary" @click="router.push('/admin/productos')">Ir a productos</button>
          </div>
        </section>
      </main>
    </AdminLayout>
  </div>
</template>

<style scoped lang="scss">
.how {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    align-items: center;
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 14px;
    display: flex;
    flex: 1 1 220px;
    gap: 0.65rem;
    padding: 0.7rem 0.85rem;
  }

  span {
    align-items: center;
    background: var(--admin-yellow);
    border-radius: 50%;
    color: var(--admin-on-yellow);
    display: flex;
    flex: 0 0 26px;
    font-size: 0.78rem;
    font-weight: 800;
    height: 26px;
    justify-content: center;
  }

  p { color: var(--admin-muted); font-size: 0.82rem; line-height: 1.35; margin: 0; }
  strong { color: var(--admin-text); }
}

.list { overflow: hidden; }
.list__head { border-bottom: 1px solid var(--admin-line); padding: 1rem; }
.list__head h2 { font-size: 1rem; margin: 0; }
.list__head p { color: var(--admin-muted); font-size: 0.8rem; margin: 0.15rem 0 0; }
.list__items { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.item {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  transition: background-color 0.2s ease;

  &:first-child { border-top: 0; }
  &:hover { background: var(--admin-hover); }
}

.item__thumb {
  align-items: center;
  background: var(--admin-surface-2);
  border-radius: 12px;
  color: var(--admin-subtle);
  display: flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
  overflow: hidden;

  img { height: 100%; object-fit: cover; width: 100%; }
}

.item__body { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; }
.item__body strong { font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item__body small { color: var(--admin-muted); font-size: 0.74rem; }

.item__points {
  align-items: baseline;
  background: var(--admin-accent-soft);
  border-radius: 999px;
  color: var(--admin-accent);
  display: inline-flex;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  gap: 0.2rem;
  padding: 0.3rem 0.7rem;

  small { font-size: 0.68rem; font-weight: 700; }
}

.sk { animation: sk 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 8px; display: block; }
.sk--thumb { border-radius: 12px; flex: 0 0 48px; height: 48px; }
.sk--line { flex: 0 1 45%; height: 14px; }
@keyframes sk { 50% { opacity: 0.45; } }

@media (prefers-reduced-motion: reduce) { .sk { animation: none; } }
</style>
