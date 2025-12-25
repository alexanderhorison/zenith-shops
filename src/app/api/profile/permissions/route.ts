
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { permissionService } from '@/lib/di'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ permissions: [] }, { status: 401 })
        }

        const permissions = await permissionService.getUserPermissions(user.id)
        const codes = permissions.map(p => p.permission_code)

        return NextResponse.json({ permissions: codes })

    } catch (error: any) {
        console.error('Error in GET /api/profile/permissions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
