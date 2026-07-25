import { computed, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useBranchStore } from '@/stores/branch'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import DeliveryService from '@/services/DeliveryService'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'

export function useCheckout() {
  const cart = useCartStore()
  const branchStore = useBranchStore()
  cart.hydrate()
  branchStore.hydrate()

  const customerFirstName = ref('')
  const customerLastName = ref('')
  const customerEmail = ref('')
  const customerPhone = ref('')
  const phoneCountryCode = ref('+593')
  const notes = ref('')
  const deliveryAddress = ref('')
  const deliveryGoogleMapsUrl = ref('')
  const deliveryType = ref<'delivery' | 'pickup'>('delivery')
  const paymentMethod = ref<'card' | 'cash'>('card')
  const scheduleOrder = ref(false)
  const scheduledDate = ref('')
  const scheduledTime = ref('07:00')
  const scheduleSlots = Array.from({ length: 12 }, (_, index) => `${String(7 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`)
  const order = ref<OrderDTO | null>(null)
  const loading = ref(false)
  const ready = ref(false)
  const branch = ref<BranchDTO | null>(null)
  const branchLoading = ref(false)
  const publicBranches = ref<BranchDTO[]>([])
  const deliveryCost = ref(0)
  const deliveryDistance = ref(0)
  const mapsError = ref('')
  const locating = ref(false)
  const locationDetected = ref(false)
  const detectedLat = ref(0)
  const detectedLng = ref(0)
  const manualMapsLink = ref('')
  const manualLat = ref(0)
  const manualLng = ref(0)
  const { error } = useToast()
  const displayLat = computed(() => locationDetected.value ? detectedLat.value : manualLat.value)
  const displayLng = computed(() => locationDetected.value ? detectedLng.value : manualLng.value)

  const showBilling = ref(false)
  const billingDocType = ref<'cedula' | 'ruc'>('cedula')
  const billingName = ref('')
  const billingDocNumber = ref('')
  const billingEmail = ref('')
  const billingAddress = ref('')

  const countries = [
    { code: '+593', label: 'EC (+593)' },
    { code: '+57', label: 'CO (+57)' },
    { code: '+51', label: 'PE (+51)' },
    { code: '+54', label: 'AR (+54)' },
    { code: '+52', label: 'MX (+52)' },
    { code: '+1', label: 'US (+1)' },
  ]

  const total = computed(() => cart.subtotal + (deliveryType.value === 'delivery' ? deliveryCost.value : 0))

  const effectiveBranchId = computed(() => {
    if (deliveryType.value === 'pickup') return branchStore.selectedBranchId || branch.value?._id || null
    return branch.value?._id || null
  })

  const isFormValid = computed(() => {
    const hasItems = cart.items.length > 0
    const hasName = customerFirstName.value.trim().length > 0 && customerLastName.value.trim().length > 0
    const hasEmail = customerEmail.value.trim().length > 0
    if (deliveryType.value === 'delivery') {
      const hasAddress = deliveryAddress.value.trim().length > 0
      const hasLocation = deliveryGoogleMapsUrl.value.trim().length > 0 || locationDetected.value
      return hasItems && hasName && hasEmail && hasAddress && hasLocation && !mapsError.value
    }
    return hasItems && hasName && hasEmail && effectiveBranchId.value !== null && (!scheduleOrder.value || Boolean(scheduledDate.value && scheduledTime.value))
  })

  function onPayPhoneReady() { ready.value = true }
  function closePayment() { order.value = null; ready.value = false }
  function toggleDeliveryType(type: 'delivery' | 'pickup') {
    deliveryType.value = type
    if (type === 'pickup') detectBranch()
  }

  async function callPreCheckout(lat: number, lng: number) {
    const res = await DeliveryService.preCheckout(lat, lng)
    branch.value = res.data.branch
    branchStore.setSelectedBranch(branch.value?._id || null)
    deliveryDistance.value = res.data.distance
    deliveryCost.value = res.data.deliveryFee
  }

  async function detectLocation() {
    if (!navigator.geolocation) { mapsError.value = 'Tu navegador no soporta geolocalización'; return }
    locating.value = true; mapsError.value = ''
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        detectedLat.value = position.coords.latitude
        detectedLng.value = position.coords.longitude
        locationDetected.value = true
        deliveryGoogleMapsUrl.value = `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`
        try {
          await callPreCheckout(detectedLat.value, detectedLng.value)
        } catch {
          branch.value = null
          mapsError.value = 'No pudimos calcular el costo de envío con tu ubicación.'
        }
        locating.value = false
      },
      (err) => {
        if (err.code === 1) mapsError.value = 'Permiso denegado. Comparte tu enlace de Google Maps manualmente.'
        else mapsError.value = 'No pudimos detectar tu ubicación. Comparte tu enlace de Google Maps manualmente.'
        locating.value = false
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  async function useManualLink() {
    const url = manualMapsLink.value.trim()
    if (!url) return
    const match =
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/)
    deliveryGoogleMapsUrl.value = url
    if (!match) {
      mapsError.value = 'El enlace de Google Maps no tiene coordenadas válidas.'
      deliveryCost.value = 0; deliveryDistance.value = 0
      return
    }
    manualLat.value = Number(match[1]); manualLng.value = Number(match[2])
    try {
      await callPreCheckout(manualLat.value, manualLng.value)
      mapsError.value = ''
    } catch {
      branch.value = null
      mapsError.value = 'No pudimos calcular el costo de envío. Verifica que el enlace tenga coordenadas válidas.'
      deliveryCost.value = 0; deliveryDistance.value = 0
    }
  }

  function clearLocation() {
    locationDetected.value = false; detectedLat.value = 0; detectedLng.value = 0
    deliveryGoogleMapsUrl.value = ''; manualMapsLink.value = ''
    deliveryCost.value = 0; deliveryDistance.value = 0; mapsError.value = ''
    branch.value = null
  }

  async function detectBranch() {
    branchLoading.value = true
    try {
      if (branchStore.selectedBranchId) { branchLoading.value = false; branch.value = null; return }
      if (!navigator.geolocation) { branchLoading.value = false; return }
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await BranchService.nearest(position.coords.latitude, position.coords.longitude)
          branch.value = res.data.branch
          branchStore.setSelectedBranch(branch.value?._id || null)
        } finally { branchLoading.value = false }
      }, async () => {
        const res = await BranchService.getPublic()
        publicBranches.value = res.data; branchLoading.value = false
      })
    } catch { branchLoading.value = false }
  }

  function getDeliveryCoords(): { lat?: number; lng?: number } {
    if (locationDetected.value && detectedLat.value && detectedLng.value) return { lat: detectedLat.value, lng: detectedLng.value }
    const url = deliveryGoogleMapsUrl.value.trim()
    if (!url) return {}
    const match =
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (!match) return {}
    return { lat: Number(match[1]), lng: Number(match[2]) }
  }

  async function createOrder() {
    try {
      loading.value = true
      const coords = deliveryType.value === 'delivery' ? getDeliveryCoords() : {}
      const billing = showBilling.value ? {
        billingDocType: billingDocType.value, billingName: billingName.value.trim(),
        billingDocNumber: billingDocNumber.value.trim(), billingEmail: billingEmail.value.trim(),
        billingAddress: billingAddress.value.trim(),
      } : {}
      const response = await OrderService.create({
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        customerName: `${customerFirstName.value.trim()} ${customerLastName.value.trim()}`,
        customerEmail: customerEmail.value,
        customerPhone: `${phoneCountryCode.value} ${customerPhone.value.trim()}`,
        notes: notes.value, deliveryType: deliveryType.value, branchId: effectiveBranchId.value,
        paymentMethod: paymentMethod.value,
        deliveryAddress: deliveryType.value === 'delivery' ? deliveryAddress.value.trim() : '',
        deliveryGoogleMapsUrl: deliveryType.value === 'delivery' ? deliveryGoogleMapsUrl.value.trim() : '',
        deliveryCost: deliveryType.value === 'delivery' ? deliveryCost.value : undefined,
        scheduledFor: scheduleOrder.value ? `${scheduledDate.value}T${scheduledTime.value}:00-05:00` : undefined,
        ...billing, ...coords,
      })
      order.value = response.data
      if (paymentMethod.value === 'cash') cart.clear()
    } catch { error('No se pudo iniciar el pago') }
    finally { loading.value = false }
  }

  function selectBranch(item: BranchDTO) { branch.value = item; branchStore.setSelectedBranch(item._id) }

  const payphoneToken = import.meta.env.VITE_PAYPHONE_TOKEN as string
  const payphoneStoreId = import.meta.env.VITE_PAYPHONE_STORE_ID as string

  return {
    branchStore, countries,
    customerFirstName, customerLastName, customerEmail, customerPhone, phoneCountryCode,
    notes, deliveryAddress, deliveryGoogleMapsUrl, deliveryType, paymentMethod, scheduleOrder, scheduledDate, scheduledTime, scheduleSlots, order,
    loading, ready, branch, branchLoading, publicBranches,
    deliveryCost, deliveryDistance, mapsError, locating, locationDetected,
    detectedLat, detectedLng, manualMapsLink, displayLat, displayLng,
    showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
    total, effectiveBranchId, isFormValid,
    payphoneToken, payphoneStoreId,
    onPayPhoneReady, closePayment, toggleDeliveryType,
    detectLocation, useManualLink, clearLocation,
    detectBranch, createOrder, selectBranch,
  }
}
