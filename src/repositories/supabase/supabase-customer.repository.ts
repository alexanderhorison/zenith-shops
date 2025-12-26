import { createClient } from '@/lib/supabase/server'
import { ICustomerRepository, Customer } from '../interfaces/customer-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'

export class SupabaseCustomerRepository implements ICustomerRepository {
    async findAllWithStats(params?: PaginationParams): Promise<PaginatedResult<Customer>> {
        const supabase = await createClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        // 1. Fetch customers with count
        let query = supabase
            .from('customers')
            .select(`
                id,
                email,
                full_name,
                dob,
                is_active,
                created_at
            `, { count: 'exact' })

        // Apply search if provided
        if (params?.search) {
            query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`)
        }

        // Apply filters if provided
        if (params?.filters?.is_active !== undefined && params.filters.is_active !== 'all') {
            query = query.eq('is_active', params.filters.is_active === 'true')
        }

        // Apply sorting
        if (params?.sortBy) {
            query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        // Apply pagination rules
        const { data: customers, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)

        // 2. Enrich with stats (only for the fetched page)
        const customersWithStats = await Promise.all((customers || []).map(async (customer) => {
            const { count, data: orders } = await supabase
                .from('orders')
                .select('total_amount', { count: 'exact' })
                .eq('user_id', customer.id)

            const totalSpent = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0

            return {
                id: customer.id,
                user_id: customer.id,
                email: customer.email,
                full_name: customer.full_name,
                is_active: customer.is_active,
                created_at: customer.created_at,
                dob: customer.dob,
                total_orders: count || 0,
                total_spent: totalSpent,
                role: { id: 0, name: 'customer', description: 'Customer' }
            } as unknown as Customer
        }))

        return createPaginatedResult(customersWithStats, count || 0, page, limit)
    }

    async findByIdWithStats(id: string): Promise<Customer | null> {
        const supabase = await createClient()

        // 1. Fetch customer
        const { data: customer, error: profileError } = await supabase
            .from('customers')
            .select(`
                id,
                email,
                full_name,
                dob,
                is_active,
                created_at
            `)
            .eq('id', id)
            .single()

        if (profileError) {
            if (profileError.code === 'PGRST116') return null
            throw new Error(profileError.message)
        }

        // 2. Fetch all orders with items
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('user_id', id)
            .order('created_at', { ascending: false })

        if (ordersError) throw new Error(ordersError.message)

        const totalSpent = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0

        return {
            id: customer.id,
            user_id: customer.id,
            email: customer.email,
            full_name: customer.full_name,
            is_active: customer.is_active,
            created_at: customer.created_at,
            dob: customer.dob,
            total_orders: orders?.length || 0,
            total_spent: totalSpent,
            orders: orders || [],
            role: { id: 0, name: 'customer', description: 'Customer' }
        } as unknown as Customer
    }

    async updateStatus(id: string, isActive: boolean): Promise<void> {
        const supabase = await createClient()
        const { error } = await supabase
            .from('customers')
            .update({ is_active: isActive })
            .eq('id', id)

        if (error) throw new Error(error.message)
    }

    async updateCustomer(id: string, data: { full_name?: string, dob?: string | null }): Promise<Customer | null> {
        const supabase = await createClient()
        const { data: updated, error } = await supabase
            .from('customers')
            .update(data)
            .eq('id', id)
            .select()
            .single()

        if (error) throw new Error(error.message)

        // Map back to Customer interface format
        return {
            id: updated.id,
            user_id: updated.id, // Keep for compatibility if needed
            email: updated.email,
            full_name: updated.full_name,
            is_active: updated.is_active,
            created_at: updated.created_at,
            dob: updated.dob,
            total_orders: 0,
            total_spent: 0,
            role: { id: 0, name: 'customer', description: 'Customer' }
        } as unknown as Customer
    }
}
