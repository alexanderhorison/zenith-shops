import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { permissionService } from '@/lib/di'

/**
 * Higher-order helper to protect API routes with permission checks.
 *
 * @param permissionCode - The permission required to access this route.
 * @param handler - The actual route handler logic.
 */
export async function withPermission(
    permissionCode: string,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const supabase = await createClient()

        // 1. Authenticate User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Authorize User (Check Permission)
        const hasPermission = await permissionService.userHasPermission(user.id, permissionCode)
        if (!hasPermission) {
            return NextResponse.json(
                { error: `Forbidden - Missing required permission: ${permissionCode}` },
                { status: 403 }
            )
        }

        // 3. Run Handler
        return await handler()
    } catch (error) {
        console.error(`Error in secured route (${permissionCode}):`, error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
