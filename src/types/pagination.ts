export interface PaginationParams {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    filters?: Record<string, any>
}

export interface PaginatedMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PaginatedResult<T> {
    data: T[]
    meta: PaginatedMeta
}

export function createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }
}
