import APIBase from './httpBase'

class AuthService extends APIBase {
  login(email: string, password: string) {
    return this.post<{ token: string; user: { _id: string; email: string; name?: string; phone?: string; photo?: string; accountType: string; branches?: Array<{ _id: string }>; allBranches?: boolean } }>('auth/login', {
      email,
      password,
    })
  }

  register(payload: { name: string; email: string; password: string }) {
    return this.post<{ token: string; user: { _id: string; email: string; name?: string; phone?: string; photo?: string; accountType: string; branches?: Array<{ _id: string }>; allBranches?: boolean } }>('auth/register', payload)
  }

  forgotPassword(email: string) {
    return this.post<{ message: string }>('auth/forgot-password', { email })
  }

  resetPassword(token: string, email: string, password: string) {
    return this.post<{ message: string }>('auth/reset-password', { token, email, password })
  }

  updateProfile(payload: { name?: string; email?: string; phone?: string; photo?: string }) {
    return this.put<{ _id: string; email: string; name?: string; phone?: string; photo?: string; accountType: string }>('auth/profile', payload)
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.put<{ message: string }>('auth/change-password', { currentPassword, newPassword })
  }

  uploadProfilePhoto(file: File) {
    const formData = new FormData()
    formData.append('photo', file)
    return this.post<{ photo: string; photoPublicId: string }>('auth/profile/photo', formData)
  }

  deleteProfilePhoto() {
    return this.delete<{ message: string }>('auth/profile/photo')
  }
}

export default new AuthService()
