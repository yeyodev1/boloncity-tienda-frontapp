<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import PageHead from '@/components/admin/catalog-ui/PageHead.vue'
import '@/components/admin/catalog-ui/ui.scss'
import BranchWizard from './BranchWizard.vue'
import BranchesList from './BranchesList.vue'
import BranchPickerLinkModal from './BranchPickerLinkModal.vue'
import { defaultHours, type BranchForm } from './types'
const branches = ref<BranchDTO[]>([]); const loading = ref(true); const pickerOpen = ref(false); const pickerBranch = ref<BranchDTO | null>(null); const open = ref(false); const saving = ref(false); const editingId = ref(''); const { confirm } = useConfirm(); const { success, error } = useToast()
const form = reactive<BranchForm>({ name:'', city:'', address:'', phone:'', email:'', googleMapsUrl:'', payphoneStoreId:'', cookTimeMinutes:0, isActive:true, openingHours:defaultHours(), imageFile:null, imagePreview:'' })
const activeCount = computed(() => branches.value.filter((branch) => branch.isActive).length)
// Cuenta la llave del entorno que está corriendo el backend, no `creationStatus`.
const pickerLinkedCount = computed(() => branches.value.filter((branch) => branch.pickerEnv === 'production' ? branch.pickerStore?.hasProdKey : branch.pickerStore?.hasDevKey).length)
const payphoneCount = computed(() => branches.value.filter((branch) => branch.payphone?.storeId).length)
const facts = computed(() => loading.value ? [] : [
  { label: 'locales', value: branches.value.length },
  { label: 'activos', value: activeCount.value, tone: 'good' as const },
  { label: 'con Picker', value: pickerLinkedCount.value, tone: pickerLinkedCount.value < activeCount.value ? 'warn' as const : 'good' as const },
  { label: 'con PayPhone', value: payphoneCount.value, tone: payphoneCount.value < activeCount.value ? 'warn' as const : 'good' as const },
])
function reset() { Object.assign(form, { name:'', city:'', address:'', phone:'', email:'', googleMapsUrl:'', payphoneStoreId:'', cookTimeMinutes:0, isActive:true, openingHours:defaultHours(), imageFile:null, imagePreview:'' }); editingId.value = '' }
async function load() { loading.value = true; try { branches.value = (await BranchService.getAll()).data } catch { error('No se pudieron cargar las sucursales') } finally { loading.value = false } }
function create() { reset(); open.value = true }
function edit(branch: BranchDTO) { Object.assign(form, { name:branch.name, city:branch.city || '', address:branch.address || '', phone:branch.phone || '', email:branch.email || '', googleMapsUrl:branch.googleMapsUrl || '', payphoneStoreId:branch.payphone?.storeId || '', cookTimeMinutes:branch.cookTimeMinutes ?? 0, isActive:branch.isActive, openingHours:branch.openingHours?.map((day) => ({ ...day })) || defaultHours(), imageFile:null, imagePreview:branch.imageUrl || '' }); editingId.value = branch._id; open.value = true }
function close() { open.value = false; setTimeout(reset, 180) }
async function save() { if (!form.name.trim() || !form.city.trim() || !form.phone.trim() || !form.email.trim()) { error('Completa los datos de la sucursal antes de guardarla'); return } if (!form.address.trim()) { error('Completa la ubicación de la sucursal antes de guardarla'); return } try { saving.value = true; const payload = { ...form, payphoneStoreId: undefined, payphone: { storeId: form.payphoneStoreId.trim() }, imageFile: undefined, imagePreview: undefined, timezone:'America/Guayaquil' }; const branch = editingId.value ? (await BranchService.update(editingId.value, payload)).data : (await BranchService.create(payload)).data; if (form.imageFile) await BranchService.uploadImage(branch._id, form.imageFile); success(editingId.value ? 'Sucursal actualizada' : 'Sucursal creada'); close(); await load() } catch { error('No se pudo guardar la sucursal') } finally { saving.value = false } }
async function remove(branch: BranchDTO) { if (!await confirm({ title:'¿Quitar esta sucursal de Boloncity?', message:`${branch.name} dejará de aparecer y no podrá recibir pedidos desde Boloncity. Si tiene órdenes, se archivará aquí para conservar su historial. Su Store y sus datos en Picker Express no se eliminarán ni modificarán.`, confirmText:'Sí, quitar de Boloncity', cancelText:'Conservar sucursal', type:'danger' })) return; try { await BranchService.remove(branch._id); success('Sucursal eliminada o archivada'); await load() } catch { error('No se pudo eliminar la sucursal') } }
// Las tiendas ya existen en Picker: se vincula la sucursal a la suya, no se crea otra.
function picker(branch: BranchDTO) { pickerBranch.value = branch; pickerOpen.value = true }
function closePicker() { pickerOpen.value = false; setTimeout(() => { pickerBranch.value = null }, 180) }
async function onPickerLinked() { await load(); pickerBranch.value = branches.value.find((item) => item._id === pickerBranch.value?._id) || pickerBranch.value }
onMounted(load)
</script>

<template>
  <!-- Envoltorio: así el reset del SCSS con scope de esta vista no le quita el padding a AdminLayout. -->
  <div class="cui-root">
    <AdminLayout>
      <main class="cui-page">
        <PageHead eyebrow="Operación" title="Sucursales" description="Locales, horarios y su conexión con Picker y PayPhone." :facts="facts">
          <template #actions>
            <button type="button" class="cui-btn cui-btn--primary" @click="create"><i class="fa-solid fa-plus" /> Nueva sucursal</button>
          </template>
        </PageHead>
        <BranchesList :branches="branches" :loading="loading" @create="create" @edit="edit" @remove="remove" @picker="picker" />
        <BranchWizard :open="open" :editing="Boolean(editingId)" :saving="saving" :form="form" @close="close" @submit="save" />
        <BranchPickerLinkModal :open="pickerOpen" :branch="pickerBranch" @close="closePicker" @linked="onPickerLinked" />
      </main>
    </AdminLayout>
  </div>
</template>
