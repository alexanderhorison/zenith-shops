import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PERMISSIONS } from '@/lib/permission-constants'
import { withPermission } from '@/lib/api-guards'

export async function GET() {
    return withPermission(PERMISSIONS.ACTIONS.CATEGORIES.VIEW, async () => {
        try {
            const supabase = createAdminClient()
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .order('name')

            if (error) throw new Error(error.message)
            return NextResponse.json(data)
        } catch (error: any) {
            console.error('Error in GET /api/admin/tags:', error)
            return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
        }
    })
}
