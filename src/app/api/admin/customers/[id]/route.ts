import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { customerService } from '@/lib/di'
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
    return withPermission(PERMISSIONS.ACTIONS.CUSTOMERS.VIEW, async () => {
        try {
            const { id } = await params
            const customer = await customerService.getCustomerById(id)
            return NextResponse.json({ customer })
        } catch (error: any) {
            console.error('Error in GET /api/admin/customers/[id]:', error)
            if (error.message.includes('not found')) {
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
            }
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    return withPermission(PERMISSIONS.ACTIONS.CUSTOMERS.EDIT, async () => {
        try {
            const { id } = await params
            const body = await request.json()

            const updateData: { full_name?: string, dob?: string | null } = {}
            if (body.full_name !== undefined) updateData.full_name = body.full_name
            if (body.dob !== undefined) updateData.dob = body.dob

            const updatedCustomer = await customerService.updateCustomer(id, updateData)

            return NextResponse.json({
                message: 'Customer updated successfully',
                customer: updatedCustomer
            })
        } catch (error: any) {
            console.error('Error in PUT /api/admin/customers/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
