import { IRoleRepository } from '@/repositories/interfaces/role-repository.interface'

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
}

export interface CreateRoleDTO {
  name: string
  description: string
}

export interface UpdateRoleDTO {
  name?: string
  description?: string
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export class RoleService {
  constructor(private roleRepo: IRoleRepository) { }

  /**
   * Get all roles
   */
  async getAllRoles(params?: PaginationParams): Promise<PaginatedResult<any>> {
    return this.roleRepo.findAll(params)
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: number) {
    const role = await this.roleRepo.findById(id)
    if (!role) {
      throw new Error(`Role not found: ${id}`)
    }
    return role
  }

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleDTO) {
    return this.roleRepo.create(data)
  }

  /**
   * Update an existing role
   */
  async updateRole(id: number, data: UpdateRoleDTO) {
    return this.roleRepo.update(id, data)
  }

  /**
   * Delete a role
   */
  async deleteRole(id: number) {
    // Check usage first
    await this.checkRoleInUse(id)
    await this.roleRepo.delete(id)
    return true
  }

  /**
   * Check if role is assigned to any users
   */
  async checkRoleInUse(roleId: number) {
    const inUse = await this.roleRepo.checkUsage(roleId)
    if (inUse) {
      throw new Error('Cannot delete role that is currently assigned to users')
    }
  }
}
