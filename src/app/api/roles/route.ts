import { NextResponse } from 'next/server'
import { getAllRoles } from '@/lib/auth'

export async function GET() {
  try {
    const roles = await getAllRoles()
    return NextResponse.json(roles)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}