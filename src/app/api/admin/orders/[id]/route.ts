import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { orderService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

interface RouteParams {
    params: Promise<{
        id: string
    }>
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    return withPermission(PERMISSIONS.ACTIONS.ORDERS.VIEW, async () => {
        try {
            const { id } = await params
            const numericId = parseInt(id)
            if (isNaN(numericId)) {
                return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
            }

            const order = await orderService.getOrderById(numericId)

            if (!order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 })
            }

            return NextResponse.json({ order })
        } catch (error: any) {
            console.error('Error in GET /api/admin/orders/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
