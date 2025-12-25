import { ICategoryRepository } from '@/repositories/interfaces/category-repository.interface'

export interface Category {
    id: number
    name: string
    created_at: string
}

export interface CreateCategoryDTO {
    name: string
}

export interface UpdateCategoryDTO {
    name?: string
}

export class CategoryService {
    constructor(private categoryRepo: ICategoryRepository) { }

    /**
     * Get all categories
     */
    async getAllCategories() {
        return this.categoryRepo.findAll()
    }

    /**
     * Get category by ID
     */
    async getCategoryById(id: number) {
        const category = await this.categoryRepo.findById(id)
        if (!category) {
            throw new Error(`Category not found: ${id}`)
        }
        return category
    }

    /**
     * Create a new category
     */
    async createCategory(data: CreateCategoryDTO) {
        return this.categoryRepo.create(data)
    }

    /**
     * Update an existing category
     */
    async updateCategory(id: number, data: UpdateCategoryDTO) {
        return this.categoryRepo.update(id, data)
    }

    /**
     * Delete a category
     */
    async deleteCategory(id: number) {
        // Repository handles usage check? 
        // Our interface has checkUsage.
        // Let's implement logic here.
        const inUse = await this.categoryRepo.checkUsage(id)
        if (inUse) {
            throw new Error('Cannot delete category that contains products')
        }

        await this.categoryRepo.delete(id)
        return true
    }
}
