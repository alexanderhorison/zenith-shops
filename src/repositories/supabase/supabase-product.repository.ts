import { createAdminClient } from '@/lib/supabase/admin'
import { IProductRepository, Product, ProductVariant, Tag } from '../interfaces/product-repository.interface'
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
                category:categories(id, name),
                variants:product_variants(*),
                product_tags(tag:tags(*))
            `, { count: 'exact' })

        // 1. Search (Name)
        if (params?.search) {
            query = query.ilike('name', `%${params.search}%`)
        }

        // 2. Filters
        if (params?.filters) {
            const { category_id, is_available } = params.filters

            if (category_id && category_id !== 'all') {
                query = query.eq('category_id', category_id)
            }

            if (is_available !== undefined && is_available !== null && is_available !== 'all') {
                query = query.eq('is_available', is_available === 'true')
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

        // 5. Global Stats (Average Price)
        // We get all prices to calculate the global average regardless of pagination
        const { data: allPrices } = await supabase.from('products').select('price')
        const avgPrice = allPrices && allPrices.length > 0
            ? allPrices.reduce((sum, p) => sum + (p.price || 0), 0) / allPrices.length
            : 0

        // Transform the nested product_tags to a flat tags array
        const transformedData = (data as any[]).map(product => ({
            ...product,
            tags: product.product_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
        }))

        return createPaginatedResult(
            transformedData as unknown as Product[],
            count || 0,
            page,
            limit,
            { avgPrice }
        )
    }

    async findById(id: string): Promise<Product | null> {
        const supabase = createAdminClient()
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category:categories(id, name),
                variants:product_variants(*),
                product_tags(tag:tags(*))
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }

        // Transform the nested product_tags to a flat tags array
        const transformedData = {
            ...data,
            tags: (data as any).product_tags?.map((pt: any) => pt.tag).filter(Boolean) || []
        }

        return transformedData as unknown as Product
    }

    async create(data: {
        name: string;
        description?: string;
        price: number;
        category_id?: number;
        image_url?: string;
        is_available?: boolean;
        tag_ids?: number[];
        variants?: Omit<ProductVariant, 'id' | 'product_id'>[]
    }): Promise<Product> {
        const supabase = createAdminClient()
        const { tag_ids, variants, ...productData } = data

        // 1. Create Product
        const { data: product, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single()

        if (error) throw new Error(error.message)

        // 2. Add Tags if any
        if (tag_ids && tag_ids.length > 0) {
            const productTags = tag_ids.map(tagId => ({
                product_id: product.id,
                tag_id: tagId
            }))
            const { error: tagError } = await supabase.from('product_tags').insert(productTags)
            if (tagError) throw new Error(tagError.message)
        }

        // 3. Add Variants if any
        if (variants && variants.length > 0) {
            const productVariants = variants.map(v => ({
                ...v,
                product_id: product.id
            }))
            const { error: variantError } = await supabase.from('product_variants').insert(productVariants)
            if (variantError) throw new Error(variantError.message)
        }

        return this.findById(product.id) as Promise<Product>
    }

    async update(id: string, data: Partial<{
        name: string;
        description: string;
        price: number;
        category_id: number;
        image_url: string;
        is_available: boolean;
        tag_ids: number[];
        variants: Omit<ProductVariant, 'id' | 'product_id'>[]
    }>): Promise<Product> {
        const supabase = createAdminClient()
        const { tag_ids, variants, ...productData } = data

        // 1. Update Product info
        if (Object.keys(productData).length > 0) {
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)

            if (error) throw new Error(error.message)
        }

        // 2. Sync Tags
        if (tag_ids !== undefined) {
            // Delete old tags
            await supabase.from('product_tags').delete().eq('product_id', id)
            // Insert new tags
            if (tag_ids.length > 0) {
                const productTags = tag_ids.map(tagId => ({
                    product_id: id,
                    tag_id: tagId
                }))
                const { error: tagError } = await supabase.from('product_tags').insert(productTags)
                if (tagError) throw new Error(tagError.message)
            }
        }

        // 3. Sync Variants
        if (variants !== undefined) {
            // Delete old variants
            await supabase.from('product_variants').delete().eq('product_id', id)
            // Insert new variants
            if (variants.length > 0) {
                const productVariants = variants.map(v => ({
                    ...v,
                    product_id: id
                }))
                const { error: variantError } = await supabase.from('product_variants').insert(productVariants)
                if (variantError) throw new Error(variantError.message)
            }
        }

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
