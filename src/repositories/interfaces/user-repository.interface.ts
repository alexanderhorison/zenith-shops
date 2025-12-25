import { UserData, UserUpdateData } from '@/services/user.service'

// We need to move the types (DTOs) out of Service or import them. 
// Ideally DTOs should be shared or in a types folder.
// For now, I will redefine generic types or import them if exported.
// Actually, let's look at user.service.ts again.
// It has UserData, UserUpdateData. I should probably move these to a separate types file or leave them there and import.
// To avoid circular dependency (Service -> Repository -> Service), I should move DTOs to a separate file or keep them in Service and import carefully, 
// OR define them in the interface file if they are domain objects.
// Let's rely on creating new types in the interface for clean separation.

export interface User {
    user_id: string
    email: string
    full_name: string
    role_id: number | null
    is_active: boolean
    created_at: string
    role?: {
        id: number
        name: string
        description: string
    }
}

export interface IUserRepository {
    findAll(): Promise<User[]>
    findById(id: string): Promise<User | null>
    createAuthUser(data: { email: string, password?: string, full_name: string }): Promise<{ user: { id: string } }>
    deleteAuthUser(id: string): Promise<void>
    updateAuthUser(id: string, data: { email?: string, password?: string }): Promise<void>

    updateProfile(id: string, data: { full_name?: string, role_id?: number | null, is_active?: boolean, email?: string }): Promise<User | null>
    // Note: Profile creation is auto-handled by triggers usually, but here we might need manual update after auth creation.
    // The service logic was: Create Auth -> Update Profile.
    // So the repository should expose separate methods for Auth and Profile if we want to keep logic in Service,
    // OR the repository could be "UserAggregateRepository" that handles both?
    // The plan said "Service coordinates Auth + DB". So Repository should handle strictly Data Access.
    // So we need access to 'auth' and 'user_profiles' table.
}
