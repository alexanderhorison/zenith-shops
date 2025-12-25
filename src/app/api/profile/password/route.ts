import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userService } from '@/lib/di'
import { withAuth } from '@/lib/api-guards'


export async function PUT(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { currentPassword, newPassword } = await request.json()

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
      }

      // We need a fresh client to verify the password check
      const supabase = await createClient()

      // First verify the current password by trying to sign in with it
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      })

      if (verifyError) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      // Update the password using Service
      await userService.changePassword(user.id, newPassword)

      return NextResponse.json({
        message: 'Password updated successfully'
      })
    } catch (error: any) {
      console.error('Error in PUT /api/profile/password:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}