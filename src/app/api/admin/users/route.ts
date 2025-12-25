import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { userService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

export async function GET() {
  return withPermission(PERMISSIONS.ACTIONS.USERS.VIEW, async () => {
    try {
      // Fetch users with their roles via Service
      const users = await userService.getAllUsers()
      return NextResponse.json({ users })
    } catch (error: any) {
      console.error('Error in GET /api/admin/users:', error)
      return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withPermission(PERMISSIONS.ACTIONS.USERS.CREATE, async () => {
    try {
      const { email, password, full_name, role_id, is_active } = await request.json()

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      if (!full_name) {
        return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
      }

      if (!role_id || isNaN(role_id)) {
        return NextResponse.json({ error: 'Valid role is required' }, { status: 400 })
      }

      try {
        const user = await userService.createUser({
          email,
          password,
          full_name,
          role_id,
          is_active: is_active ?? true
        })

        return NextResponse.json({
          message: 'User created successfully',
          user
        }, { status: 201 })
      } catch (error: any) {
        console.error('Service error:', error)
        if (error.message.includes('already exists')) {
          return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
      }

    } catch (error: any) {
      console.error('Error in POST /api/admin/users:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}