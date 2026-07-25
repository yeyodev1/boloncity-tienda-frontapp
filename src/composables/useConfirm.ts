import { computed, reactive } from 'vue'

export type ConfirmType = 'danger' | 'warning' | 'info'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
  icon?: string
  imageUrl?: string
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

const state = reactive<ConfirmState>({
  open: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  type: 'warning',
  icon: '',
  imageUrl: '',
})

let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      state.open = true
      state.title = options.title
      state.message = options.message
      state.confirmText = options.confirmText || 'Confirmar'
      state.cancelText = options.cancelText || 'Cancelar'
      state.type = options.type || 'warning'
      state.icon = options.icon || ''
      state.imageUrl = options.imageUrl || ''
      resolver = resolve
    })

  const accept = () => {
    state.open = false
    resolver?.(true)
    resolver = null
  }

  const cancel = () => {
    state.open = false
    resolver?.(false)
    resolver = null
  }

  return {
    confirmState: computed(() => state),
    confirm,
    accept,
    cancel,
  }
}
