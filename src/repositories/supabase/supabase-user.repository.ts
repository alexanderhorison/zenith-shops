import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IUserRepository, User } from '../interfaces/user-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'

export class SupabaseUserRepository implements IUserRepository {
    async findAll(params?: PaginationParams): Promise<PaginatedResult<User>> {
        const supabase = await createClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        let query = supabase
            .from('user_profiles')
            .select(`
        user_id,
        email,
        full_name,
        role_id,
        is_active,
        created_at,
        role:roles(id, name, description)
      `, { count: 'exact' })

        // 1. Search (Email or Full Name)
        if (params?.search) {
            query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`)
        }

        // 2. Filters
        if (params?.filters) {
            if (params.filters.role_id && params.filters.role_id !== 'all') {
                query = query.eq('role_id', params.filters.role_id)
            }
            if (params.filters.is_active !== undefined && params.filters.is_active !== 'all') {
                query = query.eq('is_active', params.filters.is_active === 'true')
            }
        }

        // 3. Sorting
        if (params?.sortBy) {
            if (params.sortBy === 'role_name') {
                // Sorting by related table is tricky with standard query, defaulting to created_at
                // Or we can try to sort by fetching role name. Supabase supports foreign table sorting?
                // Usually: query.order('name', { foreignTable: 'roles', ... })
                // But keys are flattened in response. 
                // Let's stick to simple column sorting for now.
                query = query.order('created_at', { ascending: false })
            } else {
                query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
            }
        } else {
            query = query.order('created_at', { ascending: false })
        }

        // 4. Pagination
        const { data, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)

        return createPaginatedResult(data as unknown as User[], count || 0, page, limit)
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
