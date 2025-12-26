import { User } from './user-repository.interface'
import { PaginationParams, PaginatedResult } from '@/types/pagination'

export interface Customer extends User {
    total_orders: number
    total_spent: number
    orders?: any[] // Simplified for now, or define Order interface
    dob: string | null
}

export interface ICustomerRepository {
    findAllWithStats(params?: PaginationParams): Promise<PaginatedResult<Customer>>
    findByIdWithStats(id: string): Promise<Customer | null>
    updateStatus(id: string, isActive: boolean): Promise<void>
    updateCustomer(id: string, data: { full_name?: string }): Promise<Customer | null>
}
