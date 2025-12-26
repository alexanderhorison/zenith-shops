import { NextRequest, NextResponse } from 'next/server'
import { PERMISSIONS } from '@/lib/permission-constants'
import { userService } from '@/lib/di'
import { withPermission } from '@/lib/api-guards'

export async function GET(request: Request) {
  return withPermission(PERMISSIONS.ACTIONS.USERS.VIEW, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const search = searchParams.get('search') || undefined
      const sortBy = searchParams.get('sortBy') || undefined
      const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined

      const role_id = searchParams.get('role_id')
      const is_active = searchParams.get('is_active')

      const filters: any = {}
      if (role_id && role_id !== 'all') filters.role_id = parseInt(role_id)
      if (is_active && is_active !== 'all') filters.is_active = is_active // Repos will check for string 'true'/'false' or handle boolean logic on client side before passing?
      // Wait, repository expects { is_active: boolean }? 
      // SupabaseUserRepository checks: params.filters.is_active === 'true'
      // So passing the string is fine if Repository handles it, or I should convert here.
      // Repository: query.eq('is_active', params.filters.is_active === 'true')
      // So I should pass the STRING 'true'/'false' and let repository handle comparison? 
      // Or pass boolean? The Repository logic I wrote earlier does: `params.filters.is_active === 'true'`.
      // So if I pass 'true' string, it works.

      const result = await userService.getAllUsers({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        filters: {
          role_id: role_id && role_id !== 'all' ? role_id : undefined,
          is_active: is_active && is_active !== 'all' ? is_active : undefined
        }
      })

      return NextResponse.json(result)
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