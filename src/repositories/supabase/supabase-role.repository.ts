import { createAdminClient } from '@/lib/supabase/admin'
import { IRoleRepository, Role } from '../interfaces/role-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'

export class SupabaseRoleRepository implements IRoleRepository {
    async findAll(params?: PaginationParams): Promise<PaginatedResult<Role>> {
        const supabase = createAdminClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        let query = supabase
            .from('roles')
            .select('*', { count: 'exact' })

        // 1. Search
        if (params?.search) {
            query = query.ilike('name', `%${params.search}%`)
        }

        // 2. Sorting
        if (params?.sortBy) {
            query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
        } else {
            query = query.order('name', { ascending: true })
        }

        // 3. Pagination
        const { data, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)

        return createPaginatedResult(data as Role[], count || 0, page, limit)
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
