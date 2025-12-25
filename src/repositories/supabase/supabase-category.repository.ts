import { createAdminClient } from '@/lib/supabase/admin'
import { ICategoryRepository, Category } from '../interfaces/category-repository.interface'

export class SupabaseCategoryRepository implements ICategoryRepository {
    async findAll(): Promise<Category[]> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw new Error(error.message)
        return data as Category[]
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
