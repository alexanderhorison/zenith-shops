import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/lib/di'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.VIEW, async () => {
    try {
      const { id: roleId } = await params
      const role = await roleService.getRoleById(parseInt(roleId))
      return NextResponse.json({ role })
    } catch (error: any) {
      console.error('Error in GET /api/admin/roles/[id]:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.EDIT, async () => {
    try {
      const { id: roleId } = await params
      const { name, description } = await request.json()

      if (!name || !description) {
        return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
      }

      const role = await roleService.updateRole(parseInt(roleId), { name, description })

      return NextResponse.json({ role })
    } catch (error: any) {
      console.error('Error in PUT /api/admin/roles/[id]:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.DELETE, async () => {
    try {
      const { id: roleId } = await params

      // RoleService.deleteRole handles usage check and deletion
      await roleService.deleteRole(parseInt(roleId))

      return NextResponse.json({ message: 'Role deleted successfully' })
    } catch (error: any) {
      console.error('Error in DELETE /api/admin/roles/[id]:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}
