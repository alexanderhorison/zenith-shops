import { createClient } from '@/lib/supabase/server';
import { permissionService } from '@/lib/di';

export type MenuPermission =
  | 'menu.users'
  | 'menu.roles'
  | 'menu.categories'
  | 'menu.products'
  | 'menu.customers';

export type ActionPermission =
  | 'action.users.view'
  | 'action.users.create'
  | 'action.users.edit'
  | 'action.users.delete'
  | 'action.roles.view'
  | 'action.roles.create'
  | 'action.roles.edit'
  | 'action.roles.delete'
  | 'action.categories.view'
  | 'action.categories.create'
  | 'action.categories.edit'
  | 'action.categories.delete'
  | 'action.products.view'
  | 'action.products.create'
  | 'action.products.edit'
  | 'action.products.delete'
  | 'action.customers.view'
  | 'action.customers.edit'
  | 'action.customers.suspend';

export type Permission = MenuPermission | ActionPermission;

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permissionCode: Permission): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Check specific permission
    return await permissionService.userHasPermission(user.id, permissionCode);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all menu permissions for the current user
 */
export async function getMenuPermissions(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    return await permissionService.getUserMenuPermissions(user.id);
  } catch (error) {
    console.error('Error getting menu permissions:', error);
    return [];
  }
}

/**
 * Get all action permissions for the current user
 */
export async function getActionPermissions(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    return await permissionService.getUserActionPermissions(user.id);
  } catch (error) {
    console.error('Error getting action permissions:', error);
    return [];
  }
}

/**
 * Require specific permission or throw error
 */
export async function requirePermission(permissionCode: Permission): Promise<void> {
  const allowed = await hasPermission(permissionCode);
  if (!allowed) {
    throw new Error(`Permission denied: ${permissionCode}`);
  }
}
