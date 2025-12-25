import { createClient } from '@/lib/supabase/client';

/**
 * Client-side version of hasPermission using direct Supabase queries
 * avoiding RPC calls for better maintainability.
 */
export async function hasPermissionClient(permissionCode: string): Promise<boolean> {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        // Fetch user's role and associated permissions directly via tables
        // Path: user_profiles -> roles -> role_permissions -> permissions
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        role:roles!inner (
          role_permissions!inner (
            permission:permissions!inner (
              code
            )
          )
        )
      `)
            .eq('user_id', user.id)
            .eq('role.role_permissions.permission.code', permissionCode)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error which means false
            console.error('Error checking permission:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

export async function hasAnyPermissionClient(permissions: string[]): Promise<boolean> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Actually, let's keep the loop simple or do a `in` query. 
    // For robustness and simplicity in client code:
    for (const permission of permissions) {
        if (await hasPermissionClient(permission)) return true;
    }
    return false;
}

export async function hasAllPermissionsClient(permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
        if (!(await hasPermissionClient(permission))) return false;
    }
    return true;
}

/**
 * Get all menu permissions for the current user (client-side)
 * Queries tables directly.
 */
export async function getMenuPermissionsClient(): Promise<string[]> {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        // Query mostly follows the schema relationships
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        role:roles!inner (
          role_permissions!inner (
            permission:permissions!inner (
              code,
              category
            )
          )
        )
      `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching user permissions:', error.message);
            return [];
        }

        if (!data) return [];

        // Parse the nested response
        // data is an array (likely 1 item per user profile found, which is 1)
        // inside is role -> role_permissions array
        const permissions: string[] = [];

        // Use unknown casting to safely traverse the nested structure without strict generated types
        const profile = data[0] as unknown as {
            role: {
                role_permissions: Array<{
                    permission: {
                        code: string;
                        category: string;
                    }
                }>
            }
        };

        if (profile?.role?.role_permissions) {
            profile.role.role_permissions.forEach((rp) => {
                if (rp.permission && rp.permission.category === 'menu') {
                    permissions.push(rp.permission.code);
                }
            });
        }

        return permissions;

    } catch (error) {
        console.error('Error getting menu permissions:', error);
        return [];
    }
}
