import { createClient } from '@/lib/supabase/server'
import { IOrderRepository, Order } from '../interfaces/order-repository.interface'
import { PaginationParams, PaginatedResult, createPaginatedResult } from '@/types/pagination'
import { startOfDay, endOfDay, subDays } from 'date-fns'

export class SupabaseOrderRepository implements IOrderRepository {
    async findAll(params?: PaginationParams): Promise<PaginatedResult<Order>> {
        const supabase = await createClient()
        const page = params?.page || 1
        const limit = params?.limit || 10
        const offset = (page - 1) * limit

        let query = supabase
            .from('orders')
            .select(`
                *,
                customer:customers (
                    full_name,
                    email
                )
            `, { count: 'exact' })

        // 1. Search (Search by ID for now, as related table search is tricky)
        if (params?.search) {
            // Check if search is numeric for ID
            if (!isNaN(Number(params.search))) {
                query = query.eq('id', Number(params.search))
            }
            // Future: Implement customer name search properly
        }

        // 2. Filters
        if (params?.filters) {
            // Status Filter
            if (params.filters.status && params.filters.status !== 'all') {
                query = query.eq('status', params.filters.status)
            }

            // Date Range Filter
            if (params.filters.dateRange && params.filters.dateRange !== 'all') {
                const now = new Date()

                let start, end = endOfDay(now).toISOString()

                switch (params.filters.dateRange) {
                    case 'today':
                        start = startOfDay(now).toISOString()
                        break
                    case 'yesterday':
                        const yesterday = subDays(now, 1)
                        start = startOfDay(yesterday).toISOString()
                        end = endOfDay(yesterday).toISOString()
                        break
                    case 'week':
                        start = startOfDay(subDays(now, 7)).toISOString()
                        break
                    case 'month':
                        start = startOfDay(subDays(now, 30)).toISOString()
                        break
                }

                if (start) {
                    query = query.gte('created_at', start).lte('created_at', end)
                }
            }
        }

        // 3. Sorting
        if (params?.sortBy) {
            // Handle related table sorting if necessary, but defaulting to flat fields
            query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' })
        } else {
            query = query.order('created_at', { ascending: false })
        }

        // 4. Pagination
        const { data: orders, count, error } = await query.range(offset, offset + limit - 1)

        if (error) throw new Error(error.message)

        return createPaginatedResult(orders as unknown as Order[], count || 0, page, limit)
    }

    async findById(id: number): Promise<Order | null> {
        const supabase = await createClient()

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customers (
                    full_name,
                    email
                ),
                items:order_items (
                    *,
                    product:products (
                        name,
                        image_url
                    )
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null
            throw new Error(error.message)
        }

        return order as unknown as Order
    }

    async create(data: {
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
        const supabase = await createClient()

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: data.user_id,
                status: data.status,
                total_amount: data.total_amount,
                // created_at / updated_at handled by DB default
            })
            .select()
            .single()

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`)

        // 2. Create Order Items
        if (data.items && data.items.length > 0) {
            const orderItems = data.items.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                selected_variants: item.selected_variants || null
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`)
        }

        return this.findById(order.id) as Promise<Order>
    }
}
