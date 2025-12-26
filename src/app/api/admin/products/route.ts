import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: Request) {
    return withPermission(PERMISSIONS.ACTIONS.PRODUCTS.VIEW, async () => {
        try {
            const { searchParams } = new URL(request.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '10')
            const search = searchParams.get('search') || undefined
            const sortBy = searchParams.get('sortBy') || undefined
            const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined
            const category_id = searchParams.get('category_id')
            const is_available = searchParams.get('is_available')

            const result = await productService.getAllProducts({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                filters: {
                    category_id: category_id,
                    is_available: is_available
                }
            })

            return NextResponse.json(result)
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
