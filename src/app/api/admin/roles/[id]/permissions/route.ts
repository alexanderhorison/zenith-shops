import { NextRequest, NextResponse } from 'next/server';
import { permissionService } from '@/lib/di';
import { PERMISSIONS } from '@/lib/permission-constants';
import { withPermission } from '@/lib/api-guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.VIEW, async () => {
    try {
      const { id } = await params;
      const roleId = parseInt(id);

      if (isNaN(roleId)) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        );
      }

      const permissions = await permissionService.getRolePermissions(roleId);

      return NextResponse.json({ permissions });
    } catch (error: any) {
      console.error('Error fetching role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role permissions' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(PERMISSIONS.ACTIONS.ROLES.EDIT, async () => {
    try {
      const { id } = await params;
      const roleId = parseInt(id);

      if (isNaN(roleId)) {
        return NextResponse.json(
          { error: 'Invalid role ID' },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { permissionIds } = body;

      if (!Array.isArray(permissionIds)) {
        return NextResponse.json(
          { error: 'permissionIds must be an array' },
          { status: 400 }
        );
      }

      await permissionService.updateRolePermissions(roleId, permissionIds);

      return NextResponse.json({
        message: 'Permissions updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to update role permissions' },
        { status: 500 }
      );
    }
  });
}
