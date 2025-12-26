export interface Role {
    id: number
    name: string
    description: string
    created_at: string
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export interface IRoleRepository {
    findAll(params?: PaginationParams): Promise<PaginatedResult<Role>>
    findById(id: number): Promise<Role | null>
    create(data: { name: string, description: string }): Promise<Role>
    update(id: number, data: { name?: string, description?: string }): Promise<Role>
    delete(id: number): Promise<void>
    checkUsage(id: number): Promise<boolean>
}
