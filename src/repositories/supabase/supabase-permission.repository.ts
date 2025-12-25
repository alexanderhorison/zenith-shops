import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { IPermissionRepository, Permission, PermissionDetail } from '../interfaces/permission-repository.interface'

export class SupabasePermissionRepository implements IPermissionRepository {
    async findAll(): Promise<Permission[]> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('permissions')
            .select('*')
            .order('category', { ascending: true })
            .order('name', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch permissions: ${error.message}`)
        }
        return data || []
    }

    async findByRoleId(roleId: number): Promise<Permission[]> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('role_permissions')
            .select(`
        permission_id,
        permissions (
          id,
          code,
          name,
          description,
          category,
          created_at
        )
      `)
            .eq('role_id', roleId)

        if (error) {
            throw new Error(`Failed to fetch role permissions: ${error.message}`)
        }

        // Extract nested permissions
        return (data || []).map((rp: any) => rp.permissions).filter(Boolean) as Permission[]
    }

    async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
        const supabase = createAdminClient()

        // Transactional logic manually implemented
        // 1. Delete existing
        const { error: deleteError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)

        if (deleteError) {
            throw new Error(`Failed to delete existing permissions: ${deleteError.message}`)
        }

        // 2. Insert new
        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map(permissionId => ({
                role_id: roleId,
                permission_id: permissionId,
            }))

            const { error: insertError } = await supabase
                .from('role_permissions')
                .insert(rolePermissions)

            if (insertError) {
                throw new Error(`Failed to insert permissions: ${insertError.message}`)
            }
        }
    }

    async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
        const supabase = await createClient()

        // We can optimization: if we have a way to cache this, purely in service/middleware.
        // Repo just does the raw query.

        // Note: The previous implementation used !inner joins to ensure checking across relations
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
            .eq('user_id', userId)
            .eq('role.role_permissions.permission.code', permissionCode)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return false // Not found
            console.error('Error checking permission:', error)
            return false
        }

        return !!data
    }

    async getUserPermissions(userId: string): Promise<PermissionDetail[]> {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
        role:roles!inner (
          role_permissions!inner (
            permission:permissions!inner (
              code,
              name,
              category
            )
          )
        )
      `)
            .eq('user_id', userId)

        if (error) {
            throw new Error(`Failed to fetch user permissions: ${error.message}`)
        }

        const permissions: PermissionDetail[] = []

        const profiles = data as any[]
        if (profiles && profiles.length > 0) {
            const profile = profiles[0]
            if (profile.role?.role_permissions) {
                profile.role.role_permissions.forEach((rp: any) => {
                    if (rp.permission) {
                        permissions.push({
                            permission_code: rp.permission.code,
                            permission_name: rp.permission.name,
                            category: rp.permission.category
                        })
                    }
                })
            }
        }
        return permissions
    }
}
