import { createAdminClient } from '@/lib/supabase/admin'
import { IRoleRepository, Role } from '../interfaces/role-repository.interface'

export class SupabaseRoleRepository implements IRoleRepository {
    async findAll(): Promise<Role[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Role[]
    }

    async findById(id: number): Promise<Role | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }
        return data as Role
    }

    async create(data: { name: string, description: string }): Promise<Role> {
        const supabase = createAdminClient()
        const { data: role, error } = await supabase
            .from('roles')
            .insert(data)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return role as Role
    }

    async update(id: number, data: { name?: string, description?: string }): Promise<Role> {
        const supabase = createAdminClient()
        const { data: role, error } = await supabase
            .from('roles')
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return role as Role
    }

    async delete(id: number): Promise<void> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }

    async checkUsage(id: number): Promise<boolean> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('role_id', id)
            .limit(1)

        if (error) throw new Error(error.message)
        return !!(data && data.length > 0)
    }
}
