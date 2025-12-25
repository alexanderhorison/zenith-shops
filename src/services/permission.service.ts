import { IPermissionRepository, Permission } from '@/repositories/interfaces/permission-repository.interface'

export class PermissionService {
  constructor(private permissionRepo: IPermissionRepository) { }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.findAll()
  }

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    return this.permissionRepo.findByRoleId(roleId)
  }

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    return this.permissionRepo.updateRolePermissions(roleId, permissionIds)
  }

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    return this.permissionRepo.userHasPermission(userId, permissionCode)
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string) {
    return this.permissionRepo.getUserPermissions(userId)
  }

  /**
   * Get menu permissions for a user
   */
  async getUserMenuPermissions(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId)
    return permissions
      .filter(p => p.category === 'menu')
      .map(p => p.permission_code)
  }

  /**
   * Get action permissions for a user
   */
  async getUserActionPermissions(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId)
    return permissions
      .filter(p => p.category === 'action')
      .map(p => p.permission_code)
  }
}
