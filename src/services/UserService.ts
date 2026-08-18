import APIBase from './httpBase'

export interface UserDTO {
  _id: string
  email: string
  name?: string
  accountType: 'customer' | 'branch_admin' | 'admin'
  branches?: Array<{ _id: string; name: string }>
  allBranches?: boolean
  points?: number
}

export interface CustomerDTO {
  _id: string
  name: string
  email: string
  phone: string
  points: number
  movements: number
  lastMovement: { amount: number; reason?: string; date?: string } | null
  createdAt?: string
}

export interface CustomerPointsDTO {
  _id: string
  name: string
  email: string
  phone: string
  points: number
  history: Array<{ amount: number; reason?: string; date?: string }>
}

class UserService extends APIBase {
  getAll() {
    return this.get<UserDTO[]>('users')
  }

  /** Clientes (accountType customer) con sus puntos, ordenados por puntos. */
  getCustomers(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.get<{ customers: CustomerDTO[]; summary: { count: number; totalPoints: number } }>(`users/customers${qs}`)
  }

  /** Detalle de puntos e historial de un cliente. */
  getCustomerPoints(id: string) {
    return this.get<CustomerPointsDTO>(`users/customers/${id}`)
  }

  getById(id: string) {
    return this.get<UserDTO>(`users/${id}`)
  }

  create(payload: Record<string, unknown>) {
    return this.post<UserDTO>('users', payload)
  }

  update(id: string, payload: Record<string, unknown>) {
    return this.put<UserDTO>(`users/${id}`, payload)
  }

  remove(id: string) {
    return this.delete<{ message: string }>(`users/${id}`)
  }
}

export default new UserService()
