export interface Tag {
    id: number
    name: string
    color: string
}

export interface ProductVariant {
    id: number
    product_id: number
    variant_group: string
    name: string
    price_override: number | null
    sku: string | null
    is_available: boolean
}

export interface Product {
    id: string
    name: string
    description: string | null
    price: number
    category_id: number | null
    image_url: string | null
    is_available: boolean
    created_at: string
    category?: {
        id: number
        name: string
    }
    tags?: Tag[]
    variants?: ProductVariant[]
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export interface IProductRepository {
    findAll(params?: PaginationParams): Promise<PaginatedResult<Product>>
    findById(id: string): Promise<Product | null>
    create(data: {
        name: string,
        description?: string,
        price: number,
        category_id?: number,
        image_url?: string,
        is_available?: boolean,
        tag_ids?: number[],
        variants?: Omit<ProductVariant, 'id' | 'product_id'>[]
    }): Promise<Product>
    update(id: string, data: Partial<{
        name: string,
        description: string,
        price: number,
        category_id: number,
        image_url: string,
        is_available: boolean,
        tag_ids: number[],
        variants: Omit<ProductVariant, 'id' | 'product_id'>[]
    }>): Promise<Product>
    delete(id: string): Promise<void>
}
