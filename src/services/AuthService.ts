import APIBase from './httpBase'

class AuthService extends APIBase {
  login(email: string, password: string) {
    return this.post<{ token: string; user: { _id: string; email: string; name?: string; accountType: string; branches?: Array<{ _id: string }>; allBranches?: boolean } }>('auth/login', {
      email,
      password,
    })
  }

  register(payload: { name: string; email: string; password: string }) {
    return this.post<{ token: string; user: { _id: string; email: string; name?: string; accountType: string; branches?: Array<{ _id: string }>; allBranches?: boolean } }>('auth/register', payload)
  }
}

export default new AuthService()
