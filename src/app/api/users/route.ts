import { NextResponse } from 'next/server'
import { createUser, getAllUsers, updateUserProfile, deleteUser } from '@/lib/auth'

export async function GET() {
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, roleId } = await request.json()
    
    const user = await createUser(email, password, fullName, roleId)
    
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 400 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { userId, ...updates } = await request.json()
    
    const updatedUser = await updateUserProfile(userId, updates)
    
    return NextResponse.json(updatedUser)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()
    
    await deleteUser(userId)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 400 }
    )
  }
}