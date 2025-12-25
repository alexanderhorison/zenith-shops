import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET() {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.VIEW, async () => {
        try {
            const categories = await categoryService.getAllCategories()
            return NextResponse.json({ categories })
        } catch (error: any) {
            console.error('Error in GET /api/admin/categories:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function POST(request: NextRequest) {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.CREATE, async () => {
        try {
            const data = await request.json()

            if (!data.name) {
                return NextResponse.json({ error: 'Name is required' }, { status: 400 })
            }

            const category = await categoryService.createCategory(data)
            return NextResponse.json({ category }, { status: 201 })
        } catch (error: any) {
            console.error('Error in POST /api/admin/categories:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
