import { IUserRepository } from '@/repositories/interfaces/user-repository.interface'

export interface UserData {
  email: string
  full_name: string
  role_id: number
  is_active: boolean
  password?: string
}

export interface UserUpdateData {
  email?: string
  full_name?: string
  role_id?: number
  is_active?: boolean
  password?: string
}

export class UserService {
  constructor(private userRepo: IUserRepository) { }

  /**
   * Get all users with their roles
   */
  async getAllUsers() {
    return this.userRepo.findAll()
  }

  /**
   * Get a specific user by ID
   */
  async getUserById(userId: string) {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new Error(`User not found: ${userId}`)
    }
    return user
  }

  /**
   * Create a new user (Auth + Profile)
   */
  async createUser(data: UserData) {
    // 1. Create user in Supabase Auth via Repository
    const authData = await this.userRepo.createAuthUser({
      email: data.email,
      password: data.password || 'TempPass123!',
      full_name: data.full_name
    })

    // 2. Update the auto-created profile with role and other details
    // Note: If repository's updateProfile returns null, it means update failed or no row found.
    const profile = await this.userRepo.updateProfile(authData.user.id, {
      full_name: data.full_name,
      role_id: data.role_id || null,
      is_active: data.is_active
    })

    if (!profile) {
      // Rollback: Delete the auth user if profile update fails
      await this.userRepo.deleteAuthUser(authData.user.id)
      throw new Error('Failed to update user profile after creation')
    }

    return profile
  }

  /**
   * Update an existing user (Profile + Auth)
   */
  async updateUser(userId: string, data: UserUpdateData) {
    // 1. Update Profile Data
    const profileUpdate: { full_name?: string; role_id?: number | null; is_active?: boolean; email?: string } = {}
    if (data.full_name) profileUpdate.full_name = data.full_name
    if (data.role_id !== undefined) profileUpdate.role_id = data.role_id
    if (data.is_active !== undefined) profileUpdate.is_active = data.is_active
    if (data.email) profileUpdate.email = data.email

    if (Object.keys(profileUpdate).length > 0) {
      await this.userRepo.updateProfile(userId, profileUpdate)
    }

    // 2. Update Auth Data (Email/Password)
    const authUpdate: { email?: string; password?: string } = {}
    if (data.email) authUpdate.email = data.email
    if (data.password) authUpdate.password = data.password

    if (Object.keys(authUpdate).length > 0) {
      await this.userRepo.updateAuthUser(userId, authUpdate)
    }

    // Return the updated full profile
    return this.getUserById(userId)
  }

  /**
   * Delete a user (Profile + Auth)
   */
  async deleteUser(userId: string) {
    // Note: Usually deleting auth user cascades to profile.
    // We can just call deleteAuthUser or we can do explicit cleanup if needed.
    // The current implementation in repository does deleteAuthUser.

    // Attempt explicit profile delete if needed by logic, but assume repo handles it or cascade.
    // Let's trust the repository's deleteAuthUser to be the main entry point for removing a user entirely.
    await this.userRepo.deleteAuthUser(userId)
    return true
  }
}
