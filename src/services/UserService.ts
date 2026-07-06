import APIBase from './httpBase'

export interface UserDTO {
  _id: string
  email: string
  name?: string
  accountType: 'customer' | 'branch_admin' | 'admin'
  branches?: Array<{ _id: string; name: string }>
  allBranches?: boolean
}

class UserService extends APIBase {
  getAll() {
    return this.get<UserDTO[]>('users')
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
