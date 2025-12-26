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
}
