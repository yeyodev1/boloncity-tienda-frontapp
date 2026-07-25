<script setup lang="ts">
import AdminLayout from '@/components/admin/AdminLayout.vue'
</script>

<template>
  <AdminLayout>
    <main class="settings">
      <section class="hero panel">
        <div>
          <p>Configuración</p>
          <h1>Operación de entrega</h1>
          <span>Define cómo se gestiona el delivery de Boloncity.</span>
        </div>
        <div class="provider"><i class="fa-solid fa-bolt" /><span>Integración principal</span><strong>Picker</strong></div>
      </section>

      <section class="notice">
        <i class="fa-solid fa-circle-info" />
        <p><strong>Picker administra la mayor parte de la operación.</strong> La cotización, asignación de conductor, seguimiento y disponibilidad se resuelven desde Picker para cada sucursal conectada.</p>
      </section>

      <section class="settings-grid">
        <article class="panel picker-card">
          <header><div class="icon"><i class="fa-solid fa-truck-fast" /></div><div><p>Modelo activo</p><h2>Delivery gestionado por Picker</h2></div><span class="status"><i class="fa-solid fa-circle-check" /> Activo</span></header>
          <div class="capabilities">
            <div><i class="fa-solid fa-tag" /><span><strong>Cotización automática</strong><small>El valor se calcula según origen, destino y disponibilidad.</small></span></div>
            <div><i class="fa-solid fa-motorcycle" /><span><strong>Asignación de conductor</strong><small>Picker busca y asigna el repartidor para cada pedido.</small></span></div>
            <div><i class="fa-solid fa-location-dot" /><span><strong>Seguimiento del pedido</strong><small>El estado de la entrega se actualiza desde la operación de Picker.</small></span></div>
          </div>
          <footer><i class="fa-solid fa-shield-heart" /> Las sucursales deben tener su cuenta de Picker configurada para operar.</footer>
        </article>

        <article class="panel internal-card">
          <div class="internal-card__top"><div class="icon"><i class="fa-solid fa-wallet" /></div><span>Próximamente</span></div>
          <h2>Cobro y entrega interna</h2>
          <p>Si Boloncity decide cobrar el delivery directamente o manejar repartidores propios, necesitaremos separar esta operación de la administración general.</p>
          <div class="requirement"><i class="fa-solid fa-user-gear" /><p><strong>Requiere un perfil adicional de logística.</strong><br />Este perfil podrá definir tarifas, asignar conductores, revisar liquidaciones y gestionar incidencias de entrega.</p></div>
          <button type="button" disabled><i class="fa-solid fa-lock" /> Requiere perfil de logística</button>
        </article>
      </section>

      <section class="next panel"><div><p>Antes de activar entrega interna</p><h2>Crear un perfil de logística y sus permisos.</h2></div><span>Evita que usuarios administrativos modifiquen cobros, repartidores o liquidaciones sin autorización.</span></section>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.settings { display:flex; flex-direction:column; gap:1rem; padding:clamp(.75rem,2vw,1.5rem); }
.hero { align-items:flex-start; background:linear-gradient(135deg,#173e22,#235931); color:#fff; display:flex; flex-direction:column; gap:1rem; justify-content:space-between; padding:1.25rem; }
.hero p,.next p { color:#efd537; font-size:.7rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }.hero h1 { font-size:clamp(1.7rem,4vw,2.5rem); margin:.35rem 0; }.hero > div > span { color:rgba(255,255,255,.75); }
.provider { align-items:center; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.16); border-radius:14px; display:flex; flex-wrap:wrap; gap:.45rem; padding:.7rem .85rem; }.provider > i { color:#efd537; }.provider span { color:rgba(255,255,255,.68); font-size:.72rem; }.provider strong { flex-basis:100%; font-size:1rem; }
.notice { align-items:flex-start; background:#fff9d7; border:1px solid rgba(239,213,55,.7); border-radius:14px; color:#453e0b; display:flex; gap:.7rem; padding:.9rem 1rem; }.notice > i { color:#b59a00; margin-top:.15rem; }.notice p { font-size:.84rem; line-height:1.5; }
.settings-grid { display:flex; flex-direction:column; gap:1rem; }.settings-grid > article { padding:1rem; }.picker-card header { align-items:flex-start; display:flex; flex-wrap:wrap; gap:.7rem; }.icon { align-items:center; background:rgba(35,89,49,.1); border-radius:12px; color:#235931; display:flex; flex:0 0 42px; height:42px; justify-content:center; width:42px; }.picker-card header > div:nth-child(2) { flex:1; }.picker-card header p,.next span { color:var(--admin-muted); font-size:.72rem; }.picker-card h2,.internal-card h2,.next h2 { font-size:1.1rem; margin-top:.15rem; }.status { background:rgba(0,165,35,.1); border-radius:999px; color:#087c25; font-size:.7rem; font-weight:900; padding:.35rem .5rem; }.capabilities { display:flex; flex-direction:column; gap:.7rem; margin:1rem 0; }.capabilities > div { align-items:flex-start; background:#f8fbf8; border-radius:12px; display:flex; gap:.65rem; padding:.7rem; }.capabilities i { color:#235931; margin-top:.15rem; }.capabilities span { display:flex; flex-direction:column; gap:.15rem; }.capabilities strong { font-size:.82rem; }.capabilities small { color:var(--admin-muted); font-size:.74rem; line-height:1.35; }.picker-card footer { border-top:1px solid rgba(35,89,49,.1); color:rgba(8,17,13,.58); font-size:.73rem; padding-top:.8rem; }.picker-card footer i { color:#235931; margin-right:.35rem; }
.internal-card { background:linear-gradient(160deg,#fff,#f8f7f1); border:1px solid rgba(8,17,13,.1); }.internal-card__top { align-items:center; display:flex; justify-content:space-between; }.internal-card__top span { background:rgba(8,17,13,.08); border-radius:999px; color:rgba(8,17,13,.55); font-size:.67rem; font-weight:900; padding:.35rem .55rem; text-transform:uppercase; }.internal-card > p { color:var(--admin-muted); font-size:.83rem; line-height:1.5; margin:.65rem 0 1rem; }.requirement { align-items:flex-start; background:#fff; border:1px solid rgba(8,17,13,.1); border-radius:12px; display:flex; gap:.65rem; padding:.75rem; }.requirement > i { color:#235931; margin-top:.1rem; }.requirement p { color:rgba(8,17,13,.62); font-size:.74rem; line-height:1.45; }.requirement strong { color:#152019; }.internal-card button { background:rgba(8,17,13,.08); border:0; border-radius:999px; color:rgba(8,17,13,.45); font-weight:800; margin-top:1rem; min-height:40px; padding:.55rem .8rem; }.next { align-items:flex-start; background:#152019; color:#fff; display:flex; flex-direction:column; gap:.5rem; padding:1rem; }.next span { color:rgba(255,255,255,.65); line-height:1.45; max-width:34rem; }
@media (min-width:720px) { .hero { align-items:center; flex-direction:row; }.provider { max-width:220px; }.settings-grid { flex-direction:row; }.settings-grid > article { flex:1; }.next { align-items:center; flex-direction:row; justify-content:space-between; } }
</style>
