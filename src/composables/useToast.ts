import { computed, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  label?: string
}

const toastItems = ref<ToastItem[]>([])

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function remove(id: string) {
  toastItems.value = toastItems.value.filter((item) => item.id !== id)
}

function push(type: ToastType, message: string) {
  const id = makeId()
  toastItems.value.push({ id, type, message })
  window.setTimeout(() => remove(id), 3500)
}

export function useToast() {
  return {
    toasts: computed(() => toastItems.value),
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    info: (message: string) => push('info', message),
    warning: (message: string) => push('warning', message),
    remove,
  }
}
