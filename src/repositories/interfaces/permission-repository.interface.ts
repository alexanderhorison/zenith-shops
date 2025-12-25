export interface Permission {
    id: number
    code: string
    name: string
    description: string | null
    category: 'menu' | 'action'
    created_at: string
}

export interface PermissionDetail {
    permission_code: string;
    permission_name: string;
    category: string;
}

export interface IPermissionRepository {
    findAll(): Promise<Permission[]>
    findByRoleId(roleId: number): Promise<Permission[]>
    updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void>

    // These are for checking permissions for a specific user
    userHasPermission(userId: string, permissionCode: string): Promise<boolean>
    getUserPermissions(userId: string): Promise<PermissionDetail[]>
}
