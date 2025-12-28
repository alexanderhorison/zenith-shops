import { NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { orderService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: Request) {
    return withPermission(PERMISSIONS.ACTIONS.ORDERS.VIEW, async () => {
        try {
            const { searchParams } = new URL(request.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '10')
            const search = searchParams.get('search') || undefined
            const sortBy = searchParams.get('sortBy') || undefined
            const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined
            const status = searchParams.get('status')
            const dateRange = searchParams.get('dateRange')

            const result = await orderService.getAllOrders({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                filters: {
                    status,
                    dateRange
                }
            })

            return NextResponse.json(result)
        } catch (error: any) {
            console.error('Error in GET /api/admin/orders:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function POST(request: Request) {
    return withPermission(PERMISSIONS.ACTIONS.ORDERS.MANAGE, async () => {
        try {
            const body = await request.json()
            const result = await orderService.createOrder(body)
            return NextResponse.json(result)
        } catch (error: any) {
            console.error('Error in POST /api/admin/orders:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
