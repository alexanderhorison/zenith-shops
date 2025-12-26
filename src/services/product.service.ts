import { IProductRepository } from '@/repositories/interfaces/product-repository.interface'

export interface Product {
    id: string
    name: string
    description: string | null
    price: number
    category_id: number | null
    image_url: string | null
    is_available: boolean
    created_at: string
}

export interface CreateProductDTO {
    name: string
    description?: string
    price: number
    category_id?: number
    image_url?: string
    is_available?: boolean
}

export interface UpdateProductDTO {
    name?: string
    description?: string
    price?: number
    category_id?: number
    image_url?: string
    is_available?: boolean
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export class ProductService {
    constructor(private productRepo: IProductRepository) { }

    /**
     * Get all products
     */
    async getAllProducts(params?: PaginationParams): Promise<PaginatedResult<any>> {
        return this.productRepo.findAll(params)
    }

    /**
     * Get product by ID
     */
    async getProductById(id: string) {
        const product = await this.productRepo.findById(id)
        if (!product) {
            throw new Error(`Product not found: ${id}`)
        }
        return product
    }

    /**
     * Create a new product
     */
    async createProduct(data: CreateProductDTO) {
        return this.productRepo.create({
            name: data.name,
            description: data.description || undefined,
            price: data.price,
            category_id: data.category_id || undefined,
            image_url: data.image_url || undefined,
            is_available: data.is_available
        })
    }

    /**
     * Update an existing product
     */
    async updateProduct(id: string, data: UpdateProductDTO) {
        // Need to be careful with optional fields in Partial<T>
        const updateData: any = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.price !== undefined) updateData.price = data.price
        if (data.category_id !== undefined) updateData.category_id = data.category_id
        if (data.image_url !== undefined) updateData.image_url = data.image_url
        if (data.is_available !== undefined) updateData.is_available = data.is_available

        return this.productRepo.update(id, updateData)
    }

    /**
     * Delete a product
     */
    async deleteProduct(id: string) {
        await this.productRepo.delete(id)
        return true
    }
}
