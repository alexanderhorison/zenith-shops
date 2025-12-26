import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userService } from '@/lib/di'
import { withAuth } from '@/lib/api-guards'


export async function GET() {
  return withAuth(async (user) => {
    try {
      const profile = await userService.getUserById(user.id)

      // Return both auth user and profile in one response
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { full_name } = await request.json()

      if (!full_name || full_name.trim() === '') {
        return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
      }

      // Update the user profile using Service
      const updatedProfile = await userService.updateUserProfile(user.id, {
        full_name: full_name.trim()
      })

      if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      // Also update the auth user metadata
      // Note: We still need a supabase client if we are calling auth.updateUser separately, 
      // but userService.updateUser covers this logic. 
      // However, to keep this refactor focused on "Authentication Check Rule", 
      // we will use the same logic but wrapped in withAuth.
      // But wait: `withAuth` gives us `user` object. It does NOT give us a `supabase` client.
      // So we still need `createClient` if we want to call supbase directly for metadata.
      // Optimization: Let's assume metadata update is secondary or handled by service if we switched fully.
      // The previous code had explicit supabase call for metadata.
      // Let's create a client just for that, OR better: move metadata update to `userService.updateUserProfile`?
      // No, `updateUserProfile` as implemented only updates valid DB fields.
      // Let's re-instantiate supabase client here for the metadata update. 
      // It's a bit redundant but okay for now.

      const supabase = await createClient()
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: full_name.trim()
        }
      })

      if (authUpdateError) {
        console.error('Error updating auth user metadata:', authUpdateError)
      }

      const fullProfile = await userService.getUserById(user.id)

      return NextResponse.json({
        message: 'Profile updated successfully',
        profile: fullProfile
      })
    } catch (error) {
      console.error('Error in PUT /api/profile:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}