import { NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { customerService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: Request) {
    return withPermission(PERMISSIONS.ACTIONS.CUSTOMERS.VIEW, async () => {
        try {
            const { searchParams } = new URL(request.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '10')
            const search = searchParams.get('search') || undefined
            const sortBy = searchParams.get('sortBy') || undefined
            const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined
            const isActive = searchParams.get('is_active')

            const result = await customerService.getAllCustomers({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                filters: {
                    is_active: isActive
                }
            })

            return NextResponse.json(result)
        } catch (error: any) {
            console.error('Error in GET /api/admin/customers:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
