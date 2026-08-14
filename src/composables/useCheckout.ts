import { computed, ref, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useBranchStore } from '@/stores/branch'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import DeliveryService from '@/services/DeliveryService'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SettingsService from '@/services/SettingsService'
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
  const scheduledTime = ref('')
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

  // ─── Programar pedido ───────────────────────────────────────────────────────
  // Los horarios salen de openingHours de la sucursal, no de un rango fijo: cada
  // local abre distinto y el backend rechaza un scheduledFor fuera de atención.
  const ECUADOR_TZ = 'America/Guayaquil'
  const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const SCHEDULE_DAYS_AHEAD = 7
  /** Colchón para que la sucursal alcance a preparar el pedido. */
  const SCHEDULE_LEAD_MINUTES = 45
  const SLOT_STEP_MINUTES = 30

  interface ScheduleDay {
    date: string
    weekdayLabel: string
    dayNumber: string
    isToday: boolean
    isOpen: boolean
    slots: string[]
  }

  function ecuadorDate(instant: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ECUADOR_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant)
  }

  function ecuadorMinutesNow(instant: Date) {
    const [hour, minute] = new Intl.DateTimeFormat('en-GB', { timeZone: ECUADOR_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .format(instant)
      .split(':')
    return Number(hour) * 60 + Number(minute)
  }

  function toMinutes(time: string) {
    const [hour, minute] = time.split(':')
    return Number(hour) * 60 + Number(minute)
  }

  function toTime(minutes: number) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }

  const scheduleDays = computed<ScheduleDay[]>(() => {
    const hours = branch.value?.openingHours?.length
      ? branch.value.openingHours
      : WEEKDAYS.map((day) => ({ day, opensAt: '07:00', closesAt: '13:00', isOpen: true }))
    const now = new Date()
    const today = ecuadorDate(now)
    const minutesNow = ecuadorMinutesNow(now)

    return Array.from({ length: SCHEDULE_DAYS_AHEAD }, (_, offset) => {
      const instant = new Date(now.getTime() + offset * 86_400_000)
      const date = ecuadorDate(instant)
      const parts = date.split('-')
      // Mediodía UTC evita que el desfase de zona corra el día del calendario.
      const local = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12))
      const dayHours = hours.find((item) => item.day === WEEKDAYS[local.getUTCDay()])
      const isToday = date === today

      let slots: string[] = []
      if (dayHours?.isOpen) {
        const opensAt = toMinutes(dayHours.opensAt)
        const closesAt = toMinutes(dayHours.closesAt)
        const earliest = isToday ? Math.max(opensAt, minutesNow + SCHEDULE_LEAD_MINUTES) : opensAt
        // Se redondea hacia arriba al siguiente bloque de media hora.
        const first = Math.ceil(earliest / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES
        for (let minutes = first; minutes < closesAt; minutes += SLOT_STEP_MINUTES) slots.push(toTime(minutes))
      }

      return {
        date,
        weekdayLabel: isToday ? 'Hoy' : offset === 1 ? 'Mañana' : new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', weekday: 'short' }).format(local).replace('.', ''),
        dayNumber: String(local.getUTCDate()),
        isToday,
        isOpen: Boolean(dayHours?.isOpen),
        slots,
      }
    })
  })

  const availableScheduleDays = computed(() => scheduleDays.value.filter((day) => day.slots.length > 0))
  const selectedScheduleDay = computed(() => scheduleDays.value.find((day) => day.date === scheduledDate.value) || null)
  const scheduleSlots = computed(() => selectedScheduleDay.value?.slots || [])
  const isScheduleValid = computed(() => Boolean(scheduledDate.value && scheduledTime.value && scheduleSlots.value.includes(scheduledTime.value)))

  function selectScheduleDay(date: string) {
    scheduledDate.value = date
    const slots = scheduleDays.value.find((day) => day.date === date)?.slots || []
    if (!slots.includes(scheduledTime.value)) scheduledTime.value = slots[0] || ''
  }

  /** Al activar la programación se preselecciona el primer turno disponible. */
  function toggleScheduleOrder(value: boolean) {
    scheduleOrder.value = value
    if (!value) return
    const firstDay = availableScheduleDays.value[0]
    if (!firstDay) { scheduledDate.value = ''; scheduledTime.value = ''; return }
    if (!selectedScheduleDay.value?.slots.length) selectScheduleDay(firstDay.date)
  }

  // Cambiar de sucursal cambia los horarios: el turno elegido puede dejar de existir.
  watch(
    () => branch.value?._id,
    () => {
      if (!scheduleOrder.value) return
      if (isScheduleValid.value) return
      const firstDay = availableScheduleDays.value[0]
      if (firstDay) selectScheduleDay(firstDay.date)
      else { scheduledDate.value = ''; scheduledTime.value = '' }
    }
  )

  const effectiveBranchId = computed(() => {
    if (deliveryType.value === 'pickup') return branchStore.selectedBranchId || branch.value?._id || null
    return branch.value?._id || null
  })

  const isFormValid = computed(() => {
    const hasItems = cart.items.length > 0
    const hasName = customerFirstName.value.trim().length > 0 && customerLastName.value.trim().length > 0
    const hasEmail = customerEmail.value.trim().length > 0
    const scheduleOk = !scheduleOrder.value || isScheduleValid.value
    if (deliveryType.value === 'delivery') {
      const hasAddress = deliveryAddress.value.trim().length > 0
      const hasLocation = deliveryGoogleMapsUrl.value.trim().length > 0 || locationDetected.value
      return hasItems && hasName && hasEmail && hasAddress && hasLocation && !mapsError.value && scheduleOk
    }
    return hasItems && hasName && hasEmail && effectiveBranchId.value !== null && scheduleOk
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
      // Con una sucursal ya elegida hay que traer su ficha igual: de ahí salen los
      // horarios para programar y el storeId de PayPhone que cobra el pedido.
      if (branchStore.selectedBranchId) {
        try {
          const res = await BranchService.getPublic()
          publicBranches.value = res.data
          branch.value = res.data.find((item) => item._id === branchStore.selectedBranchId) || null
          if (!branch.value) branchStore.setSelectedBranch(null)
        } finally { branchLoading.value = false }
        return
      }
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

  // ─── IVA ────────────────────────────────────────────────────────────────────
  // Los precios ya lo incluyen; el backend devuelve `order.tax` con el impuesto
  // desglosado. PayPhone exige el desglose por separado y que la suma cuadre con
  // el total, si no rechaza la transacción.
  const ivaRate = ref(15)
  const pricesIncludeIva = ref(true)

  void SettingsService.fetch()
    .then((response) => {
      ivaRate.value = response.data.ivaRate ?? 15
      pricesIncludeIva.value = response.data.pricesIncludeIva ?? true
    })
    .catch(() => undefined)

  const payphoneAmounts = computed(() => {
    const current = order.value
    if (!current) return { amount: 0, amountWithTax: 0, amountWithoutTax: 0, tax: 0 }

    const tax = current.tax || 0
    if (!tax || ivaRate.value <= 0) {
      return { amount: current.total, amountWithTax: 0, amountWithoutTax: current.total, tax: 0 }
    }

    // Base gravada que generó ese impuesto; el resto del total no paga IVA.
    const taxedBase = Math.round(tax / (ivaRate.value / 100))
    const untaxed = current.total - taxedBase - tax
    return {
      amount: current.total,
      amountWithTax: taxedBase,
      amountWithoutTax: Math.max(0, untaxed),
      tax,
    }
  })

  const payphoneToken = import.meta.env.VITE_PAYPHONE_TOKEN as string
  // Cada sucursal cobra en su propia tienda de PayPhone; la global solo cubre el caso
  // en que la sucursal todavía no tenga storeId cargado.
  const payphoneStoreId = computed(
    () => branch.value?.payphone?.storeId || (import.meta.env.VITE_PAYPHONE_STORE_ID as string) || ''
  )

  return {
    branchStore, countries,
    customerFirstName, customerLastName, customerEmail, customerPhone, phoneCountryCode,
    notes, deliveryAddress, deliveryGoogleMapsUrl, deliveryType, paymentMethod, order,
    scheduleOrder, scheduledDate, scheduledTime, scheduleSlots, scheduleDays, availableScheduleDays,
    selectedScheduleDay, isScheduleValid, selectScheduleDay, toggleScheduleOrder,
    loading, ready, branch, branchLoading, publicBranches,
    deliveryCost, deliveryDistance, mapsError, locating, locationDetected,
    detectedLat, detectedLng, manualMapsLink, displayLat, displayLng,
    showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
    total, effectiveBranchId, isFormValid,
    ivaRate, pricesIncludeIva, payphoneAmounts,
    payphoneToken, payphoneStoreId,
    onPayPhoneReady, closePayment, toggleDeliveryType,
    detectLocation, useManualLink, clearLocation,
    detectBranch, createOrder, selectBranch,
  }
}
