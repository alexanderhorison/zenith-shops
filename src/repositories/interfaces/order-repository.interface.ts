export interface OrderItem {
    id: number
    order_id: number
    product_id: number
    quantity: number
    unit_price: string
    selected_variants?: Record<string, string> // JSONB: { "Size": "L", "Milk": "Oat" }
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
    create(data: {
        user_id?: string;
        status: string;
        total_amount: number;
        items: Array<{
            product_id: number;
            quantity: number;
            unit_price: number;
            selected_variants?: Record<string, string>;
        }>
    }): Promise<Order>
}
