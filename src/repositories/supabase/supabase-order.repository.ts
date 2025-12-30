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

        if (!data.items || data.items.length === 0) {
            throw new Error("Order must have at least one item")
        }

        // 1. Fetch Products to get authoritative prices and availability
        const productIds = data.items.map(item => item.product_id)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, price, name, is_available')
            .in('id', productIds)

        if (productsError) throw new Error(`Failed to fetch products: ${productsError.message}`)

        const productMap = new Map(products?.map(p => [p.id, p]))

        // 1b. Fetch Variants for these products to validate availability
        // Only fetch valid and available variants
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('product_id, variant_group, name, is_available')
            .in('product_id', productIds)
            .eq('is_available', true)

        if (variantsError) throw new Error(`Failed to fetch variants: ${variantsError.message}`)

        // Create a lookup: product_id -> Map<Group, Set<Name>>
        const variantMap = new Map<number, Map<string, Set<string>>>()
        variants?.forEach(v => {
            if (!variantMap.has(v.product_id)) {
                variantMap.set(v.product_id, new Map())
            }
            const groupMap = variantMap.get(v.product_id)!
            if (!groupMap.has(v.variant_group)) {
                groupMap.set(v.variant_group, new Set())
            }
            groupMap.get(v.variant_group)!.add(v.name)
        })

        // 2. Calculate Total and Prepare Items
        let calculatedTotal = 0
        const orderItemsToInsert: any[] = []

        for (const item of data.items) {
            const product = productMap.get(item.product_id)
            if (!product) {
                throw new Error(`Product with ID ${item.product_id} not found`)
            }

            if (!product.is_available) {
                throw new Error(`Product '${product.name}' is currently unavailable`)
            }

            // Validate Variants
            if (item.selected_variants) {
                const productVariants = variantMap.get(item.product_id)

                for (const [group, name] of Object.entries(item.selected_variants)) {
                    // Check if the group exists and the specific option name exists within that group
                    const availableNames = productVariants?.get(group)

                    if (!availableNames || !availableNames.has(name)) {
                        throw new Error(`Variant '${group}: ${name}' is not available for product '${product.name}'`)
                    }
                }
            }

            const realPrice = Number(product.price)
            const quantity = item.quantity
            calculatedTotal += realPrice * quantity

            orderItemsToInsert.push({
                product_id: item.product_id,
                quantity: quantity,
                unit_price: realPrice, // Authoritative price
                selected_variants: item.selected_variants || null
            })
        }

        // 3. Create Order with Calculated Total
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: data.user_id,
                status: data.status,
                total_amount: calculatedTotal, // Security: ignore client-provided total
            })
            .select()
            .single()

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`)

        // 4. Create Order Items
        const itemsWithOrderId = orderItemsToInsert.map(item => ({
            ...item,
            order_id: order.id
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId)

        if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`)

        return this.findById(order.id) as Promise<Order>
    }
}
