import { IOrderRepository, Order } from '@/repositories/interfaces/order-repository.interface'

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export class OrderService {
    constructor(private orderRepository: IOrderRepository) { }

    async getAllOrders(params?: PaginationParams): Promise<PaginatedResult<Order>> {
        return this.orderRepository.findAll(params)
    }

    async getOrderById(id: number): Promise<Order | null> {
        return this.orderRepository.findById(id)
    }

    async createOrder(data: {
        user_id?: string;
        status: string;
        total_amount: number;
        items: Array<{
            product_id: number;
            quantity: number;
            unit_price: number;
            selected_variants?: Record<string, string>;
        }>
    }): Promise<Order> {
        return this.orderRepository.create(data)
    }
}
