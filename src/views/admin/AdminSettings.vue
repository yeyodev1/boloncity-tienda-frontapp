<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import SettingsService from '@/services/SettingsService'
import { useToast } from '@/composables/useToast'

const deliveryPricePerKm = ref(0)
const saving = ref(false)
const loading = ref(true)
const { success, error } = useToast()

onMounted(async () => {
  try {
    const res = await SettingsService.fetch()
    deliveryPricePerKm.value = res.data.deliveryPricePerKm / 100
  } catch {
    deliveryPricePerKm.value = 1.5
  } finally {
    loading.value = false
  }
})

async function save() {
  if (deliveryPricePerKm.value < 0) {
    error('El precio debe ser un valor positivo')
    return
  }
  saving.value = true
  try {
    const cents = Math.round(deliveryPricePerKm.value * 100)
    await SettingsService.update(cents)
    success('Tarifa de envío actualizada correctamente')
  } catch {
    error('No se pudo actualizar la tarifa')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-header">
        <div>
          <p class="admin-header__eyebrow">Configuración</p>
          <h1>Tarifa de envío</h1>
          <p class="admin-header__desc">Precio por kilómetro para el cálculo del costo de entrega a domicilio.</p>
        </div>
      </div>

      <div class="card" style="max-width: 520px; padding: 1.5rem">
        <div v-if="loading" class="muted" style="text-align: center; padding: 2rem 0">Cargando configuración...</div>

        <form v-else class="form-grid" @submit.prevent="save">
          <label>
            <span>Precio por kilómetro (USD)</span>
            <div class="input-group">
              <span class="input-group__prefix">$</span>
              <input
                v-model.number="deliveryPricePerKm"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.50"
              />
            </div>
            <small style="color: rgba(26,26,26,0.5); font-size: 0.78rem;">
              Este valor se multiplica por la distancia entre la sucursal y la dirección de entrega.
            </small>
          </label>

          <div class="actions">
            <button type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar tarifa' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped lang="scss">
.input-group {
  align-items: stretch;
  display: flex;
  position: relative;
}

.input-group input {
  padding-left: 2.2rem !important;
}

.input-group__prefix {
  align-items: center;
  color: rgba(26, 26, 26, 0.45);
  display: flex;
  font-weight: 700;
  left: 1rem;
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
}
</style>
