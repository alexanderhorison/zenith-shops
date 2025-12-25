import { NextResponse } from 'next/server';
import { permissionService } from '@/lib/di';

export async function GET() {
  try {
    // Remove super_admin check, allow all authenticated users
    const permissions = await permissionService.getAllPermissions();
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}
