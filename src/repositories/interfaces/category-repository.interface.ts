export interface Category {
    id: number
    name: string
    created_at: string
}

import { PaginationParams, PaginatedResult } from '@/types/pagination'

export interface ICategoryRepository {
    findAll(params?: PaginationParams): Promise<PaginatedResult<Category>>
    findById(id: number): Promise<Category | null>
    create(data: { name: string }): Promise<Category>
    update(id: number, data: { name?: string }): Promise<Category>
    delete(id: number): Promise<void>
    checkUsage(id: number): Promise<boolean>
}
