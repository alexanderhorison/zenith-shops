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
}

export interface IProductRepository {
    findAll(): Promise<Product[]>
    findById(id: string): Promise<Product | null>
    create(data: { name: string, description?: string, price: number, category_id?: number, image_url?: string, is_available?: boolean }): Promise<Product>
    update(id: string, data: Partial<{ name: string, description: string, price: number, category_id: number, image_url: string, is_available: boolean }>): Promise<Product>
    delete(id: string): Promise<void>
}
