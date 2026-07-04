declare global {
  interface Window {
    PPaymentButtonBox?: new (config: Record<string, unknown>) => { render: (target: string) => unknown }
  }
}

export {}
