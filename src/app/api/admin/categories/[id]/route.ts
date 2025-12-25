import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.VIEW, async () => {
        try {
            const { id } = await params
            const category = await categoryService.getCategoryById(parseInt(id))
            return NextResponse.json({ category })
        } catch (error: any) {
            console.error('Error in GET /api/admin/categories/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.EDIT, async () => {
        try {
            const { id } = await params
            const data = await request.json()
            const category = await categoryService.updateCategory(parseInt(id), data)
            return NextResponse.json({ category })
        } catch (error: any) {
            console.error('Error in PUT /api/admin/categories/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.DELETE, async () => {
        try {
            const { id } = await params
            await categoryService.deleteCategory(parseInt(id))
            return NextResponse.json({ message: 'Category deleted successfully' })
        } catch (error: any) {
            console.error('Error in DELETE /api/admin/categories/[id]:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
