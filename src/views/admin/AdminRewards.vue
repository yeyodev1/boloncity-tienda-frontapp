<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'

const router = useRouter()
const products = ref<ProductDTO[]>([])
const loading = ref(true)
const rewardProducts = computed(() => products.value.filter((product) => (product.pointsValue || 0) > 0))
const configuredPoints = computed(() => rewardProducts.value.reduce((total, product) => total + (product.pointsValue || 0), 0))

async function load() {
  try { products.value = (await ProductService.getAll({ admin: true })).data }
  finally { loading.value = false }
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <main class="rewards admin-page">
      <section class="rewards__hero panel"><div><p>Programa de fidelidad</p><h1>Rewards y puntos</h1><span>Configura cuántos puntos recibe un cliente al comprar cada producto.</span></div><button type="button" @click="router.push('/admin/productos')"><i class="fa-solid fa-gift" /> Configurar productos</button></section>
      <section class="rewards__guide"><article class="panel"><i class="fa-solid fa-cart-shopping" /><strong>1. Configura el producto</strong><p>Define los puntos por compra desde Productos. Déjalo vacío si no entrega puntos.</p></article><article class="panel"><i class="fa-solid fa-receipt" /><strong>2. Cliente compra</strong><p>Los puntos se multiplican por la cantidad de unidades compradas.</p></article><article class="panel"><i class="fa-solid fa-star" /><strong>3. Se acreditan</strong><p>Al confirmarse el pago, los puntos se guardan en el perfil del cliente.</p></article></section>
      <section class="rewards__summary"><article class="panel"><span>Productos con rewards</span><strong>{{ rewardProducts.length }}</strong></article><article class="panel"><span>Puntos configurados</span><strong>{{ configuredPoints }}</strong><small>Suma por una unidad de cada producto</small></article></section>
      <section class="rewards__products panel"><header><div><h2>Productos que entregan puntos</h2><p>La cantidad se aplica por cada unidad comprada.</p></div><button type="button" @click="router.push('/admin/productos')">Editar puntos</button></header><div v-if="loading" class="empty">Cargando rewards...</div><div v-else-if="rewardProducts.length" class="rewards__list"><article v-for="product in rewardProducts" :key="product._id"><img v-if="product.images[0]?.url" :src="product.images[0].url" :alt="product.name" /><i v-else class="fa-solid fa-box" /><div><strong>{{ product.name }}</strong><small>{{ product.code || 'Sin código interno' }}</small></div><b>+{{ product.pointsValue }} pts</b></article></div><div v-else class="empty"><i class="fa-solid fa-gift" /> Aún no hay productos que entreguen puntos.</div></section>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.rewards { display:flex; flex-direction:column; gap:1rem; padding:clamp(.75rem,2vw,1.5rem); }.rewards__hero { align-items:flex-start; background:linear-gradient(135deg,#235931,#173e22); color:#fff; display:flex; flex-direction:column; gap:1rem; justify-content:space-between; padding:1.25rem; }.rewards__hero p { color:#efd537; font-size:.72rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }.rewards h1 { font-size:clamp(1.7rem,4vw,2.5rem); margin:.35rem 0; }.rewards__hero span { color:rgba(255,255,255,.75); }.rewards button { align-items:center; background:#efd537; border:0; border-radius:999px; color:#152019; display:inline-flex; font-weight:900; gap:.5rem; min-height:42px; padding:.7rem 1rem; }.rewards__guide,.rewards__summary { display:flex; flex-wrap:wrap; gap:.8rem; }.rewards__guide > * { flex:1 1 190px; padding:1rem; }.rewards__guide i { color:#00a523; font-size:1.25rem; }.rewards__guide strong,.rewards__guide p { display:block; }.rewards__guide strong { margin:.65rem 0 .25rem; }.rewards__guide p,.rewards__products p,.rewards__summary small { color:var(--admin-muted); font-size:.82rem; line-height:1.4; }.rewards__summary > * { display:flex; flex:1 1 180px; flex-direction:column; padding:1rem; }.rewards__summary span { color:var(--admin-muted); font-size:.75rem; font-weight:800; text-transform:uppercase; }.rewards__summary strong { color:#235931; font-size:2rem; margin:.3rem 0; }.rewards__products { padding:1rem; }.rewards__products header { align-items:center; display:flex; gap:1rem; justify-content:space-between; margin-bottom:1rem; }.rewards__products h2 { font-size:1.05rem; }.rewards__products header button { background:#235931; color:#fff; }.rewards__list { display:flex; flex-direction:column; }.rewards__list article { align-items:center; border-top:1px solid var(--admin-line); display:flex; gap:.75rem; padding:.8rem 0; }.rewards__list img,.rewards__list article > i { align-items:center; background:rgba(35,89,49,.1); border-radius:10px; display:flex; flex:0 0 42px; height:42px; justify-content:center; object-fit:cover; width:42px; }.rewards__list div { display:flex; flex:1; flex-direction:column; min-width:0; }.rewards__list small { color:var(--admin-muted); font-size:.72rem; margin-top:.15rem; }.rewards__list b { background:rgba(0,165,35,.1); border-radius:999px; color:#235931; font-size:.8rem; padding:.4rem .55rem; white-space:nowrap; }.empty { color:var(--admin-muted); padding:1.5rem 0; text-align:center; }.empty i { color:#00a523; margin-right:.35rem; } @media (min-width:641px) { .rewards__hero { align-items:center; flex-direction:row; padding:1.5rem; } }
</style>
