import { createAdminClient } from '@/lib/supabase/admin'
import { ICategoryRepository, Category } from '../interfaces/category-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'

export class SupabaseCategoryRepository implements ICategoryRepository {
    async findAll(params?: PaginationParams): Promise<PaginatedResult<Category>> {
        const supabase = createAdminClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        let query = supabase
            .from('categories')
            .select('*', { count: 'exact' })

        if (params?.search) {
            query = query.ilike('name', `%${params.search}%`)
        }

        if (params?.sortBy) {
            query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
        } else {
            query = query.order('name', { ascending: true })
        }

        const { data, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)
        return createPaginatedResult(data as Category[], count || 0, page, limit)
    }

    async findById(id: number): Promise<Category | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }
        return data as Category
    }

    async create(data: { name: string }): Promise<Category> {
        const supabase = createAdminClient()
        const { data: category, error } = await supabase
            .from('categories')
            .insert(data)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return category as Category
    }

    async update(id: number, data: { name?: string }): Promise<Category> {
        const supabase = createAdminClient()
        const { data: category, error } = await supabase
            .from('categories')
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return category as Category
    }

    async delete(id: number): Promise<void> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }

    async checkUsage(id: number): Promise<boolean> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('category_id', id)
            .limit(1)

        if (error) throw new Error(error.message)
        return !!(data && data.length > 0)
    }
}
