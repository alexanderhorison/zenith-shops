export interface OrderItem {
    id: number
    order_id: number
    product_id: number
    quantity: number
    unit_price: string
    product?: {
        name: string
        image_url: string | null
    }
}

export interface Order {
    id: number
    user_id: string | null // Reference to customers.id
    total_amount: string
    status: string // pending, completed, cancelled
    created_at: string
    updated_at: string
    customer?: {
        full_name: string
        email: string
    }
    items?: OrderItem[]
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export interface IOrderRepository {
    findAll(params?: PaginationParams): Promise<PaginatedResult<Order>>
    findById(id: number): Promise<Order | null>
}
