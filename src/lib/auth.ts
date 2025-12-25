import { createClient } from '@/lib/supabase/server'

export interface Role {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role_id: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  role?: Role
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', user.id)
    .single()

  return profile
}

export async function getUserRole(userId: string): Promise<Role | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select(`
      role:roles(id, name, description)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error getting user role:', error)
    return null
  }

  // The role is nested in the profile object
  const role = profile?.role as Role | Role[] | null
  
  // Handle case where Supabase returns array instead of single object
  if (Array.isArray(role)) {
    return role[0] || null
  }
  
  return role || null
}

export async function isSuperAdmin(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser()
    userId = user?.id
  }
  
  if (!userId) return false
  
  const supabase = await createClient()
  const { data } = await supabase
    .rpc('is_super_admin', { user_id: userId })

  return data || false
}

export async function isAdmin(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser()
    userId = user?.id
  }
  
  if (!userId) return false
  
  const supabase = await createClient()
  const { data } = await supabase
    .rpc('is_admin', { user_id: userId })

  return data || false
}

export async function getAllRoles() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Role[]
}

export async function getAllUsers() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      role:roles(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (UserProfile & { role: Role | null })[]
}

export async function createUser(email: string, password: string, fullName?: string, roleId?: number) {
  const supabase = await createClient()

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: {
      full_name: fullName
    },
    email_confirm: true
  })

  if (authError) throw authError

  // Update profile with role
  if (authData.user && roleId) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        role_id: roleId,
        full_name: fullName,
        created_by: (await getCurrentUser())?.id
      })
      .eq('id', authData.user.id)

    if (profileError) throw profileError
  }

  return authData.user
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error
  
  return true
}