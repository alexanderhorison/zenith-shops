import { ICustomerRepository } from '@/repositories/interfaces/customer-repository.interface'
import { PaginationParams } from '@/types/pagination'

export class CustomerService {
    constructor(private customerRepo: ICustomerRepository) { }

    /**
     * Get all customers with their order stats
     */
    async getAllCustomers(params?: PaginationParams) {
        return this.customerRepo.findAllWithStats(params)
    }

    /**
     * Get a specific customer by ID with full order history
     */
    async getCustomerById(id: string) {
        const customer = await this.customerRepo.findByIdWithStats(id)
        if (!customer) {
            throw new Error(`Customer not found: ${id}`)
        }
        return customer
    }

    /**
     * Update customer status (suspend/activate)
     */
    async updateCustomerStatus(id: string, isActive: boolean) {
        return this.customerRepo.updateStatus(id, isActive)
    }

    /**
     * Update customer details
     */
    async updateCustomer(id: string, data: { full_name?: string, dob?: string | null }) {
        return this.customerRepo.updateCustomer(id, data)
    }
}
