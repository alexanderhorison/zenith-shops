import { SupabaseUserRepository } from '@/repositories/supabase/supabase-user.repository'
import { SupabaseRoleRepository } from '@/repositories/supabase/supabase-role.repository'
import { SupabaseProductRepository } from '@/repositories/supabase/supabase-product.repository'
import { SupabaseCategoryRepository } from '@/repositories/supabase/supabase-category.repository'

import { UserService } from '@/services/user.service'
import { RoleService } from '@/services/role.service'
import { ProductService } from '@/services/product.service'
import { CategoryService } from '@/services/category.service'
import { PermissionService } from '@/services/permission.service'
import { SupabasePermissionRepository } from '@/repositories/supabase/supabase-permission.repository'

// Initialize Repositories
// For a larger app, we might use a library like InversifyJS, but effective manual DI is fine here.
const userRepository = new SupabaseUserRepository()
const roleRepository = new SupabaseRoleRepository()
const productRepository = new SupabaseProductRepository()
const categoryRepository = new SupabaseCategoryRepository()
const permissionRepository = new SupabasePermissionRepository()

// Initialize Services with Repositories
// Note: We need to modify the Service classes to accept Repositories first. 
// They are currently static or instantiate their dependencies internally.
// We will modify them to be instantiated with dependencies.

export const userService = new UserService(userRepository)
export const roleService = new RoleService(roleRepository)
export const productService = new ProductService(productRepository)
export const categoryService = new CategoryService(categoryRepository)
export const permissionService = new PermissionService(permissionRepository)
