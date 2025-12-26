import { createAdminClient } from '@/lib/supabase/admin'
import { IProductRepository, Product } from '../interfaces/product-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'

export class SupabaseProductRepository implements IProductRepository {
    async findAll(params?: PaginationParams): Promise<PaginatedResult<Product>> {
        const supabase = createAdminClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        let query = supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name)
            `, { count: 'exact' })

        // 1. Search (Name)
        if (params?.search) {
            query = query.ilike('name', `%${params.search}%`)
        }

        // 2. Filters
        if (params?.filters) {
            if (params.filters.category_id && params.filters.category_id !== 'all') {
                query = query.eq('category_id', params.filters.category_id)
            }
            if (params.filters.is_available !== undefined && params.filters.is_available !== 'all') {
                query = query.eq('is_available', params.filters.is_available === 'true')
            }
        }

        // 3. Sorting
        if (params?.sortBy) {
            if (params.sortBy === 'category') {
                query = query.order('name', { foreignTable: 'categories', ascending: params.sortOrder === 'asc' })
            } else {
                query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
            }
        } else {
            query = query.order('name', { ascending: true })
        }

        // 4. Pagination
        const { data, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)
        return createPaginatedResult(data as unknown as Product[], count || 0, page, limit)
    }

    async findById(id: string): Promise<Product | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name)
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }
        return data as unknown as Product
    }

    async create(data: { name: string; description?: string; price: number; category_id?: number; image_url?: string; is_available?: boolean }): Promise<Product> {
        const supabase = createAdminClient()
        const { data: product, error } = await supabase
            .from('products')
            .insert(data)
            .select()
            .single()

        if (error) throw new Error(error.message)
        return product as unknown as Product
    }

    async update(id: string, data: Partial<{ name: string; description: string; price: number; category_id: number; image_url: string; is_available: boolean }>): Promise<Product> {
        const supabase = createAdminClient()
        const { data: product, error } = await supabase
            .from('products')
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)
        // If we want to return full object with relations, we might need a re-fetch or assume caller handles it.
        // For now, return what we got. To match interface fully (which has category object), we might need to re-fetch if the interface strictly requires it.
        // But usually update returns the modified fields.
        // Let's re-fetch to be safe and consistent with "getById".
        return this.findById(id) as Promise<Product>
    }

    async delete(id: string): Promise<void> {
        const supabase = createAdminClient()
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) throw new Error(error.message)
    }
}
