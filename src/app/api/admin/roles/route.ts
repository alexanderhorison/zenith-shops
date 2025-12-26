import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: Request) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.VIEW, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || undefined
      const sortBy = searchParams.get('sortBy') || undefined
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

      const result = await roleService.getAllRoles({
        page,
        limit,
        search,
        sortBy,
        sortOrder
      })

      return NextResponse.json(result)
    } catch (error: any) {
      console.error('Error in GET /api/admin/roles:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.CREATE, async () => {
    try {
      const { name, description } = await request.json()

      if (!name || !description) {
        return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
      }

      const role = await roleService.createRole({ name, description })

      return NextResponse.json({ role }, { status: 201 })
    } catch (error: any) {
      console.error('Error in POST /api/admin/roles:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}