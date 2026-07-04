<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

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

let mounted = false

function loadScript(src: string, type?: 'module') {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    if (type) script.type = type
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (mounted) return
  mounted = true

  await Promise.all([
    loadScript('https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js', 'module'),
  ])

  const PaymentButtonBox = window.PPaymentButtonBox
  if (!PaymentButtonBox) return

  const box = new PaymentButtonBox({
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

  box?.render('pp-button')
  props.onReady?.()
})

onBeforeUnmount(() => {
  mounted = false
})
</script>

<template>
  <div id="pp-button" class="pp-button" />
</template>

<style scoped>
.pp-button { min-height: 88px; }
</style>
