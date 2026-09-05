<script setup lang="ts">
defineProps<{ total: number }>()
</script>

<template>
  <section class="checkout-hero">
    <div class="checkout-hero__copy">
      <h1>Finalizar <span>pedido.</span></h1>
      <p>Tres pasos y listo. Te enviamos la confirmación y el seguimiento por correo.</p>
    </div>
    <div class="checkout-hero__actions">
      <div class="checkout-hero__status">
        <span>Total a pagar</span>
        <strong>${{ total.toFixed(2) }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.checkout-hero {
  background:
    radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%),
    linear-gradient(135deg, #235931, #102719 72%);
  border-radius: 22px;
  box-shadow: 0 26px 60px rgba(35, 89, 49, 0.2);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  padding: clamp(1.1rem, 3vw, 1.6rem) clamp(1.2rem, 4vw, 2rem);
  position: relative;
  margin: 0 1.25rem;
}

.checkout-hero__copy { max-width: 46rem; position: relative; z-index: 1; }

.checkout-hero__eyebrow {
  color: #efd537;
  display: flex;
  font-size: 0.76rem;
  font-weight: 900;
  gap: 0.5rem;
  letter-spacing: 0.14em;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
}

.checkout-hero h1 {
  font-size: clamp(1.7rem, 4vw, 2.6rem);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.88;
  text-transform: uppercase;
}

.checkout-hero h1 span {
  color: transparent;
  display: block;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.82);
}

.checkout-hero__copy > p:last-child {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  line-height: 1.6;
  margin-top: 1rem;
}

.checkout-hero__actions { position: relative; z-index: 1; }

.checkout-hero__status {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1rem;
}

.checkout-hero__status span { color: rgba(255, 255, 255, 0.68); font-size: 0.78rem; }
.checkout-hero__status strong { color: #efd537; font-size: 1.2rem; margin-top: 0.15rem; }

@media (min-width: 761px) {
  .checkout-hero { align-items: flex-end; flex-direction: row; }
  .checkout-hero__status { min-width: 180px; }
}

@media (min-width: 980px) {
  .checkout-hero__actions { flex: 0 0 200px; min-width: 200px; }
}
</style>
