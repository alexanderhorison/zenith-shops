import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkPolicies() {
    console.log('--- Checking RLS Policies on public.orders ---')
    const { data, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'orders')
        .eq('schemaname', 'public')

    if (error) {
        console.error('Error fetching policies:', error)
        // Fallback: try raw SQL if RPC fails or permissions issue (but service role should bypass)
        // Actually supabase-js query builder on pg_catalog tables might not work if not exposed via PostgREST.
        // We might need to use RPC or direct connection if available, but let's try this first.
    } else {
        console.table(data)
    }

    // Alternative: Test insertion as service role (should work) vs simulate RLS?
    // Hard to simulate user context here easily without a token.
    // But listing policies confirms existence.
}

checkPolicies()
