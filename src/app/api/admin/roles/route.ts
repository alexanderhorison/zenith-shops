import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET() {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.VIEW, async () => {
    try {
      const roles = await roleService.getAllRoles()
      return NextResponse.json({ roles })
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