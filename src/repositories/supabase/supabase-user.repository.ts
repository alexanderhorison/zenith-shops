import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IUserRepository, User } from '../interfaces/user-repository.interface'

export class SupabaseUserRepository implements IUserRepository {
    async findAll(): Promise<User[]> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        user_id,
        email,
        full_name,
        role_id,
        is_active,
        created_at,
        role:roles(id, name, description)
      `)
            .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data as unknown as User[]
        // Type casting because Supabase types might be inferred differently than our interface requires
    }

    async findById(id: string): Promise<User | null> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        user_id,
        email,
        full_name,
        role_id,
        is_active,
        created_at,
        role:roles(id, name, description)
      `)
            .eq('user_id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }
        return data as unknown as User
    }

    async createAuthUser(data: { email: string, password?: string, full_name: string }): Promise<{ user: { id: string } }> {
        const adminClient = createAdminClient()
        const { data: authData, error } = await adminClient.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: { full_name: data.full_name }
        })

        if (error) throw new Error(error.message)
        return authData
    }

    async updateProfile(id: string, data: { full_name?: string, role_id?: number | null, is_active?: boolean, email?: string }): Promise<User | null> {
        const supabase = await createClient()
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .update(data)
            .eq('user_id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return profile as unknown as User
    }

    async updateAuthUser(id: string, data: { email?: string, password?: string }): Promise<void> {
        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.updateUserById(id, data)
        if (error) throw new Error(error.message)
    }

    async deleteAuthUser(id: string): Promise<void> {
        const adminClient = createAdminClient()
        const { error } = await adminClient.auth.admin.deleteUser(id)
        if (error) throw new Error(error.message)

        // Note: Deleting auth user usually cascades to user_profiles if set up in DB, 
        // or we might need to delete profile manually. 
        // Our service checks for profile deletion success, but here we just expose the capabilities.
        // Ideally usage is: deleteAuthUser handles everything if CASCADE is on.
    }
}
