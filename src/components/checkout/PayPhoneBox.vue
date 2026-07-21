<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  token: string
  storeId: string
  clientTransactionId: string
  amount: number
  amountWithoutTax?: number
  amountWithTax?: number
  tax?: number
  reference: string
  email: string
  phoneNumber?: string
  documentId?: string
  onReady?: () => void
}>()

const PAYPHONE_CSS = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css'
const PAYPHONE_JS = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js'

let instance: any = null

function loadStyle(href: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) {
      resolve()
      return
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load ${href}`))
    document.head.appendChild(link)
  })
}

function loadScript(src: string, type?: 'module') {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    if (type) script.type = type
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    await Promise.all([
      loadStyle(PAYPHONE_CSS),
      loadScript(PAYPHONE_JS, 'module'),
    ])

    const PaymentButtonBox = (window as any).PPaymentButtonBox
    if (!PaymentButtonBox) return

    instance = new PaymentButtonBox({
      token: props.token,
      clientTransactionId: props.clientTransactionId,
      amount: Math.round(props.amount),
      amountWithoutTax: props.amountWithoutTax ? Math.round(props.amountWithoutTax) : undefined,
      amountWithTax: props.amountWithTax ? Math.round(props.amountWithTax) : undefined,
      tax: props.tax ? Math.round(props.tax) : undefined,
      currency: 'USD',
      storeId: props.storeId,
      reference: props.reference,
      lang: 'es',
      defaultMethod: 'card',
      email: props.email,
      phoneNumber: props.phoneNumber,
      documentId: props.documentId,
      identificationType: 1,
    })

    instance?.render('pp-button')
    props.onReady?.()
  } catch (error) {
    console.error('PayPhone box failed to load', error)
  }
})

onUnmounted(() => {
  if (instance && typeof instance.destroy === 'function') {
    instance.destroy()
  }
  instance = null
})
</script>

<template>
  <div id="pp-button" class="pp-button" />
</template>

<style scoped>
.pp-button {
  width: 100%;
}

.pp-button :deep(*) {
  box-sizing: border-box;
}
</style>
