import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { customerService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withPermission(PERMISSIONS.ACTIONS.CUSTOMERS.SUSPEND, async () => {
        try {
            const { id } = await params
            const { is_active } = await request.json()

            if (typeof is_active !== 'boolean') {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
            }

            await customerService.updateCustomerStatus(id, is_active)

            return NextResponse.json({
                message: `Customer ${is_active ? 'activated' : 'suspended'} successfully`
            })
        } catch (error: any) {
            console.error('Error in PATCH /api/admin/customers/[id]/suspend:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
