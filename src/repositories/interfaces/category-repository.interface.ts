export interface Category {
    id: number
    name: string
    created_at: string
}

export interface ICategoryRepository {
    findAll(): Promise<Category[]>
    findById(id: number): Promise<Category | null>
    create(data: { name: string }): Promise<Category>
    update(id: number, data: { name?: string }): Promise<Category>
    delete(id: number): Promise<void>
    checkUsage(id: number): Promise<boolean>
}
