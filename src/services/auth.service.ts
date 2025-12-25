import { createClient } from '@/lib/supabase/client'

export class AuthService {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  async signUp(email: string, password: string, fullName?: string) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
  }

  async signOut() {
    return await this.supabase.auth.signOut()
  }

  async getUser() {
    return await this.supabase.auth.getUser()
  }

  async updatePassword(newPassword: string) {
    return await this.supabase.auth.updateUser({
      password: newPassword,
    })
  }
}

export const authService = new AuthService()
