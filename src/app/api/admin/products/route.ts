import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET() {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.VIEW, async () => {
        try {
            const products = await productService.getAllProducts()
            return NextResponse.json({ products })
        } catch (error: any) {
            console.error('Error in GET /api/admin/products:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function POST(request: NextRequest) {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.CREATE, async () => {
        try {
            const data = await request.json()

            if (!data.name || !data.price) {
                return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
            }

            const product = await productService.createProduct(data)
            return NextResponse.json({ product }, { status: 201 })
        } catch (error: any) {
            console.error('Error in POST /api/admin/products:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
