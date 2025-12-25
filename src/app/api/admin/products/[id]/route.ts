import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.VIEW, async () => {
        try {
            const { id } = await params
            const product = await productService.getProductById(id)
            return NextResponse.json({ product })
        } catch (error: any) {
            console.error('Error in GET /api/admin/products/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.EDIT, async () => {
        try {
            const { id } = await params
            const data = await request.json()
            const product = await productService.updateProduct(id, data)
            return NextResponse.json({ product })
        } catch (error: any) {
            console.error('Error in PUT /api/admin/products/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.DELETE, async () => {
        try {
            const { id } = await params
            await productService.deleteProduct(id)
            return NextResponse.json({ message: 'Product deleted successfully' })
        } catch (error: any) {
            console.error('Error in DELETE /api/admin/products/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
