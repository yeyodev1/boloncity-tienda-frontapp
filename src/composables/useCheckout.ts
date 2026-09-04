import { computed, onMounted, ref, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { useBranchStore } from '@/stores/branch'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import DeliveryService from '@/services/DeliveryService'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SettingsService from '@/services/SettingsService'
import { useToast } from '@/composables/useToast'
import { trackMetaEvent, trackMetaPurchase } from '@/services/metaPixel'

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
  /** Se llena cuando el backend rechaza el pedido porque la sucursal está cerrada (409 BRANCH_CLOSED). */
  const branchClosedInfo = ref<null | { message: string; date: string; opensAt: string }>(null)
  /**
   * Se llena cuando la dirección cae fuera de las zonas de reparto. Es distinto de
   * `mapsError` (que es "no pudimos leer el enlace"): acá el enlace se entendió
   * perfecto, simplemente no llegamos hasta allá. Separarlos permite mostrarlo como
   * un aviso grande con salida, y no como un texto de error más.
   */
  const outOfCoverage = ref('')

  // ─── Puntos ─────────────────────────────────────────────────────────────────
  const pointsEnabled = ref(true)
  const pointsEarnDollars = ref(1)
  const pointsEarnAmount = ref(1)
  const pointsRedeemPerDollar = ref(100)
  /** Saldo del correo escrito, consultado al backend. */
  const pointsBalance = ref<{ points: number; discountCents: number } | null>(null)
  const pointsBalanceLoading = ref(false)
  /** Checkbox opcional "usar mis puntos". */
  const useMyPoints = ref(false)
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
  const resolvingLink = ref(false)
  const locationDetected = ref(false)
  const detectedLat = ref(0)
  const detectedLng = ref(0)
  const manualMapsLink = ref('')
  const manualLat = ref(0)
  const manualLng = ref(0)
  const { error, warning } = useToast()
  const displayLat = computed(() => locationDetected.value ? detectedLat.value : manualLat.value)
  const displayLng = computed(() => locationDetected.value ? detectedLng.value : manualLng.value)
  // Un enlace pegado no basta: sin lat/lng reales no hay sucursal cercana ni costo de envio.
  const hasDeliveryCoords = computed(() => Boolean(displayLat.value && displayLng.value))

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

  // Promo global: descuenta SOLO el subtotal de productos, nunca el envío (regla del negocio).
  // El backend recalcula lo mismo al crear la orden; esto es lo que ve el cliente.
  const settingsStore = useSettingsStore()
  const promo = computed(() => settingsStore.promo)
  const promoDiscount = computed(() => settingsStore.promoDiscountOn(cart.subtotal))
  const total = computed(() =>
    Math.max(0, cart.subtotal - promoDiscount.value) + (deliveryType.value === 'delivery' ? deliveryCost.value : 0))

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

  // Los pedidos programados aceptan efectivo además de tarjeta: se cobra al entregar o
  // al retirar, igual que un pedido inmediato. (Restricción levantada a pedido del cliente.)

  /** Un toque desde el aviso de "sucursal cerrada": activa Programar con la próxima apertura. */
  function scheduleForNextOpening() {
    const info = branchClosedInfo.value
    if (!info) return
    scheduleOrder.value = true
    selectScheduleDay(info.date)
    const slots = scheduleDays.value.find((day) => day.date === info.date)?.slots || []
    if (slots.includes(info.opensAt)) scheduledTime.value = info.opensAt
    // branchClosedInfo se mantiene: mientras la sucursal siga cerrada solo se puede programar.
  }

  /** Al activar la programación se preselecciona el primer turno disponible. */
  function toggleScheduleOrder(value: boolean) {
    // Con la sucursal cerrada, la programación es obligatoria: no se puede volver a "Lo antes posible".
    if (!value && branchClosedInfo.value) return
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

  // Con facturación activada, el documento debe estar completo (cédula 10 dígitos, RUC 13)
  // y con nombre: antes se podía enviar cualquier texto como "número" de documento.
  const billingValid = computed(() => {
    if (!showBilling.value) return true
    const digits = billingDocNumber.value.replace(/\D+/g, '')
    const expected = billingDocType.value === 'ruc' ? 13 : 10
    return billingName.value.trim().length > 0 && digits.length === expected
  })

  const isFormValid = computed(() => {
    const hasItems = cart.items.length > 0
    const hasName = customerFirstName.value.trim().length > 0 && customerLastName.value.trim().length > 0
    const hasEmail = customerEmail.value.trim().length > 0
    const scheduleOk = !scheduleOrder.value || isScheduleValid.value
    if (deliveryType.value === 'delivery') {
      const hasAddress = deliveryAddress.value.trim().length > 0
      const hasLocation = hasDeliveryCoords.value
      // Fuera de zona el botón de pagar queda apagado: dejarlo activo solo lleva al
      // cliente a un rechazo del backend después de llenar todo el formulario.
      return hasItems && hasName && hasEmail && hasAddress && hasLocation && !mapsError.value && !outOfCoverage.value && scheduleOk && billingValid.value
    }
    return hasItems && hasName && hasEmail && effectiveBranchId.value !== null && scheduleOk && billingValid.value
  })

  function onPayPhoneReady() { ready.value = true }
  function closePayment() { order.value = null; ready.value = false }
  function toggleDeliveryType(type: 'delivery' | 'pickup') {
    deliveryType.value = type
    // Retiro en tienda no depende de la zona de reparto: el aviso deja de aplicar.
    if (type === 'pickup') { outOfCoverage.value = ''; detectBranch() }
  }

  async function callPreCheckout(lat: number, lng: number) {
    const res = await DeliveryService.preCheckout(lat, lng)
    branch.value = res.data.branch
    branchStore.setSelectedBranch(branch.value?._id || null)
    deliveryDistance.value = res.data.distance
    deliveryCost.value = res.data.deliveryFee
    outOfCoverage.value = ''
  }

  /**
   * Un punto fuera de las zonas de reparto no es un error técnico: es un "no
   * llegamos hasta allá". Decirlo con esas palabras evita que el cliente reintente
   * diez veces creyendo que la página falló.
   */
  function preCheckoutErrorMessage(err: unknown): string {
    const raw = err as { data?: { code?: string; message?: string }; message?: string }
    if (raw?.data?.code === 'DELIVERY_OUT_OF_COVERAGE') {
      outOfCoverage.value =
        raw.data.message || 'Todavía no llegamos a esa dirección con delivery.'
      // El bloque grande ya lo explica; repetirlo abajo en rojo chico solo agrega ruido.
      return ''
    }
    return 'No pudimos calcular el costo de envío con tu ubicación.'
  }

  async function detectLocation() {
    if (!navigator.geolocation) { mapsError.value = 'Tu navegador no soporta geolocalización'; return }
    locating.value = true; mapsError.value = ''; outOfCoverage.value = ''
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        detectedLat.value = position.coords.latitude
        detectedLng.value = position.coords.longitude
        locationDetected.value = true
        deliveryGoogleMapsUrl.value = `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`
        try {
          await callPreCheckout(detectedLat.value, detectedLng.value)
        } catch (err) {
          branch.value = null
          mapsError.value = preCheckoutErrorMessage(err)
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
    mapsError.value = ''; outOfCoverage.value = ''
    let match =
      url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      url.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/)
    // Los links cortos (maps.app.goo.gl) no traen coordenadas: los resuelve el backend
    // siguiendo el redirect (el navegador no puede por CORS).
    if (!match) {
      resolvingLink.value = true
      try {
        const res = await DeliveryService.resolveMaps(url, deliveryAddress.value)
        match = ['', String(res.data.lat), String(res.data.lng)]
      } catch {
        mapsError.value = 'No pudimos leer ese enlace. Abre Google Maps, mantén presionado tu punto exacto y comparte el enlace desde ahí.'
        manualLat.value = 0; manualLng.value = 0; deliveryGoogleMapsUrl.value = ''
        deliveryCost.value = 0; deliveryDistance.value = 0
        resolvingLink.value = false
        return
      }
      resolvingLink.value = false
    }
    const lat = Number(match[1]); const lng = Number(match[2])
    if (!lat || !lng) {
      mapsError.value = 'Ese enlace no trae la ubicación exacta. Abre Google Maps, mantén presionado tu punto y elige "Compartir".'
      manualLat.value = 0; manualLng.value = 0
      deliveryGoogleMapsUrl.value = ''; deliveryCost.value = 0; deliveryDistance.value = 0
      return
    }
    manualLat.value = lat; manualLng.value = lng
    // Solo se marca "Ubicación agregada" cuando ya hay coordenadas reales.
    // Se guarda el link canonico con lat/lng (no el corto): el backend lo parsea para
    // ubicar la entrega y para la reserva de Picker.
    deliveryGoogleMapsUrl.value = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    try {
      await callPreCheckout(manualLat.value, manualLng.value)
      mapsError.value = ''
    } catch (err) {
      branch.value = null
      mapsError.value =
        (err as { data?: { code?: string } })?.data?.code === 'DELIVERY_OUT_OF_COVERAGE'
          ? preCheckoutErrorMessage(err)
          : 'No pudimos calcular el costo de envío. Verifica que el enlace tenga coordenadas válidas.'
      manualLat.value = 0; manualLng.value = 0
      deliveryCost.value = 0; deliveryDistance.value = 0
    }
  }

  function clearLocation() {
    locationDetected.value = false; detectedLat.value = 0; detectedLng.value = 0
    manualLat.value = 0; manualLng.value = 0
    deliveryGoogleMapsUrl.value = ''; manualMapsLink.value = ''
    deliveryCost.value = 0; deliveryDistance.value = 0; mapsError.value = ''
    outOfCoverage.value = ''
    branch.value = null
  }

  /**
   * Recarga la lista de sucursales a mano (botón "Recargar sucursales"). Además limpia
   * cualquier service worker / caché viejo: si el cliente arrastra la PWA anterior, esto
   * lo saca de datos cacheados y lo deja con la data real de la tienda nueva.
   */
  async function reloadBranches() {
    branchLoading.value = true
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations().catch(() => [])
        await Promise.all(regs.map((registration) => registration.unregister().catch(() => undefined)))
        if (typeof caches !== 'undefined') {
          const keys = await caches.keys().catch(() => [] as string[])
          await Promise.all(keys.map((key) => caches.delete(key).catch(() => undefined)))
        }
      }
      const res = await BranchService.getPublic()
      publicBranches.value = res.data
    } catch {
      // se deja la lista como estaba
    } finally {
      branchLoading.value = false
    }
  }

  // Al entrar al checkout, precarga las sucursales (sobre todo para "Retiro").
  void reloadBranches()

  // Llegar al checkout con carrito es la intención de compra que mide Meta. Se
  // dispara una sola vez al montar: recalcularlo en cada cambio del carrito
  // inflaría el evento y arruinaría la tasa de conversión del anuncio.
  onMounted(() => {
    if (cart.items.length === 0) return
    trackMetaEvent('InitiateCheckout', {
      customData: {
        currency: 'USD',
        value: Math.max(0, cart.subtotal - promoDiscount.value),
        content_type: 'product',
        num_items: cart.count,
        content_ids: cart.items.map((item) => item.productId),
        contents: cart.items.map((item) => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
      },
    })
  })

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
    // Los links cortos los resuelve el backend: esas coordenadas viven en manualLat/manualLng
    // y son las unicas que existen para ese caso. Sin esto la orden viajaba sin ubicacion,
    // el backend caia en la sucursal seleccionada por defecto y el envio quedaba en $0.
    if (manualLat.value && manualLng.value) return { lat: manualLat.value, lng: manualLng.value }
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
        billingDocNumber: billingDocNumber.value.replace(/\D+/g, ''), billingEmail: billingEmail.value.trim(),
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
        redeemPoints: useMyPoints.value && Boolean(pointsBalance.value?.points) ? true : undefined,
        ...billing, ...coords,
      })
      order.value = response.data
      branchClosedInfo.value = null
      // En efectivo no hay retorno de PayPhone donde medir la venta: el pedido
      // creado ES la compra. En tarjeta el Purchase sale en CheckoutResponseView,
      // recién cuando el pago se aprueba.
      if (paymentMethod.value === 'cash') {
        trackMetaPurchase(response.data)
        cart.clear()
      }
    } catch (err) {
      // httpBase no relanza el error de axios: lanza { status, message, data }.
      // Leer err.response.data aqui dejaba data en undefined, el BRANCH_CLOSED
      // nunca se detectaba y todo terminaba en el toast generico de pago.
      type ErrorPayload = { code?: string; message?: string; availability?: { nextOpening?: { date?: string; opensAt?: string } } }
      const raw = err as { data?: ErrorPayload; message?: string; response?: { data?: ErrorPayload } }
      const data = raw?.data ?? raw?.response?.data
      if (data?.code === 'DELIVERY_OUT_OF_COVERAGE') {
        outOfCoverage.value = data.message || 'Todavía no llegamos a esa dirección con delivery.'
        error('No llegamos hasta esa dirección 😕')
        window.setTimeout(() => {
          document.querySelector('.coverage')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      } else if (data?.code === 'BRANCH_CLOSED') {
        branchClosedInfo.value = {
          message: data.message || 'La sucursal está cerrada en este momento.',
          date: data.availability?.nextOpening?.date || '',
          opensAt: data.availability?.nextOpening?.opensAt || '',
        }
        // Fuera de horario la programación es el único camino: se activa sola.
        scheduleForNextOpening()
        warning('La sucursal está cerrada por ahora. Te activamos «Programar» para que dejes tu pedido listo 👇')
        // Lleva la vista al aviso amarillo, que explica la próxima apertura.
        window.setTimeout(() => {
          document.querySelector('.checkout-closed')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 150)
      } else {
        error(data?.message || raw?.message || 'No se pudo iniciar el pago')
      }
    }
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
      pointsEnabled.value = response.data.pointsEnabled ?? true
      pointsEarnDollars.value = response.data.pointsEarnDollars || 1
      pointsEarnAmount.value = response.data.pointsEarnAmount ?? 1
      pointsRedeemPerDollar.value = response.data.pointsRedeemPerDollar || 100
      if (response.data.activePromo) settingsStore.promo = response.data.activePromo
    })
    .catch(() => undefined)

  // ─── Puntos: cuánto gana esta compra y saldo canjeable del correo ───────────
  /** Estimado con la tarifa global (los extras por producto los suma el backend). */
  const pointsToEarn = computed(() => {
    if (!pointsEnabled.value) return 0
    const payable = Math.max(0, cart.subtotal - promoDiscount.value)
    return Math.floor(payable / Math.max(0.01, pointsEarnDollars.value)) * Math.max(0, pointsEarnAmount.value)
  })

  /** Descuento aplicable ahora: el saldo, con tope de total - $1 (PayPhone no cobra menos de $1). */
  const pointsDiscount = computed(() => {
    if (!useMyPoints.value || !pointsBalance.value) return 0
    const totalCents = Math.round(total.value * 100)
    return Math.max(0, Math.min(pointsBalance.value.discountCents, totalCents - 100)) / 100
  })

  let balanceTimer: ReturnType<typeof setTimeout> | null = null
  watch(customerEmail, (email) => {
    pointsBalance.value = null
    useMyPoints.value = false
    if (balanceTimer) clearTimeout(balanceTimer)
    const clean = email.trim().toLowerCase()
    if (!pointsEnabled.value || !clean.includes('@') || clean.length < 6) return
    balanceTimer = setTimeout(async () => {
      pointsBalanceLoading.value = true
      try {
        const response = await SettingsService.pointsBalance(clean)
        pointsBalance.value = response.data.points > 0
          ? { points: response.data.points, discountCents: response.data.discountCents }
          : null
      } catch { pointsBalance.value = null }
      finally { pointsBalanceLoading.value = false }
    }, 600)
  })

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
    branchClosedInfo, scheduleForNextOpening, outOfCoverage,
    pointsEnabled, pointsToEarn, pointsBalance, pointsBalanceLoading, useMyPoints, pointsDiscount, pointsRedeemPerDollar,
    loading, ready, branch, branchLoading, publicBranches,
    deliveryCost, deliveryDistance, mapsError, locating, resolvingLink, locationDetected, hasDeliveryCoords,
    detectedLat, detectedLng, manualMapsLink, displayLat, displayLng,
    showBilling, billingDocType, billingName, billingDocNumber, billingEmail, billingAddress,
    total, promo, promoDiscount, effectiveBranchId, isFormValid,
    ivaRate, pricesIncludeIva, payphoneAmounts,
    payphoneToken, payphoneStoreId,
    onPayPhoneReady, closePayment, toggleDeliveryType,
    detectLocation, useManualLink, clearLocation,
    detectBranch, reloadBranches, createOrder, selectBranch,
  }
}
