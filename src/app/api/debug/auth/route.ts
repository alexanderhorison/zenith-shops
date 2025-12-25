import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole, getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', step: 'no_user' }, { status: 401 })
    }

    // Get user role
    const userRole = await getUserRole(user.id)
    
    // Get full user profile
    const currentUser = await getCurrentUser()
    
    return NextResponse.json({ 
      debug: {
        userId: user.id,
        userEmail: user.email,
        userRole,
        currentUser,
        hasAdminAccess: userRole && (userRole.name === 'super_admin' || userRole.name === 'admin')
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 })
  }
}