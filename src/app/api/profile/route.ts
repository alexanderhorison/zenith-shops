import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userService } from '@/lib/di'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with role information
    try {
      const profile = await userService.getUserById(user.id)
      return NextResponse.json({ profile })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Also update the auth user metadata (we can keep this here or move to service eventually)
    // For now, let's keep it here as it's specific to Auth maintenance, 
    // OR we could use userService.updateUser which handles both?
    // Let's use userService.updateUser! It handles both Profile and Auth updates!
    // Wait, updateUser requires UserUpdateData.

    // Actually, `userService.updateUser` does exactly what we want: updates profile AND auth (email/pass).
    // But here we are updating metadata in Auth, not email/pass. 
    // So `userService.updateUser` might NOT be enough for metadata.
    // Let's stick to updating profile via service, and auth metadata manually until we improve service.

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: full_name.trim()
      }
    })

    if (authUpdateError) {
      console.error('Error updating auth user metadata:', authUpdateError)
    }

    // We need to re-fetch the full profile with role to return it
    // because updateProfile returns the row, but we want the nested role too.
    const fullProfile = await userService.getUserById(user.id)

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: fullProfile
    })
  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}