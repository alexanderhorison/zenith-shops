'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { cn, getToastTimestamp } from '@/lib/utils'
import { toast } from 'sonner'

interface Role {
  id: number
  name: string
  description: string
}

interface User {
  user_id: string
  email: string
  full_name: string | null
  role_id: number | null
  is_active: boolean
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load both user and roles in parallel
      const [userResponse, rolesResponse] = await Promise.all([
        fetch(`/api/admin/users/${params.id}`),
        fetch('/api/admin/roles?limit=100')
      ])

      // Process roles first
      const rolesData = await rolesResponse.json()
      if (rolesResponse.ok && rolesData.data) {
        setRoles(rolesData.data)
      } else {
        console.error('Failed to load roles:', rolesData)
        toast.error('Failed to load roles')
      }

      // Then process user data
      const userData = await userResponse.json()
      if (userResponse.ok && userData.user) {
        setFormData({
          email: userData.user.email,
          fullName: userData.user.full_name || '',
          password: '',
          confirmPassword: '',
          roleId: userData.user.role_id?.toString() || '',
          isActive: userData.user.is_active
        })
      } else {
        toast.error('User not found')
        setTimeout(() => router.push('/dashboard/admin/users'), 1500)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match', {
        description: getToastTimestamp(),
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.fullName,
          password: formData.password || undefined,
          role_id: parseInt(formData.roleId),
          is_active: formData.isActive
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('User updated successfully', {
          description: getToastTimestamp(),
        })
        router.push('/dashboard/admin/users')
      } else {
        toast.error(data.error || 'Failed to update user', {
          description: getToastTimestamp(),
        })
      }
    } catch (error) {
      toast.error('Network error occurred while updating user', {
        description: getToastTimestamp(),
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/admin/users')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
          <p className="text-muted-foreground">
            Update user information and permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Update the details for this user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  New Password
                  <span className="text-sm text-muted-foreground ml-2">
                    (leave blank to keep current password)
                  </span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  disabled={!formData.password}
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-red-500">*</span>
              </Label>
              {roles.length === 0 ? (
                <div className="flex items-center gap-2 p-4 border border-destructive/50 rounded-lg text-destructive bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <div className="text-sm font-medium">
                    No Roles Available. Please create roles first before assigning them to users.
                  </div>
                </div>
              ) : (
                <RadioGroup
                  value={formData.roleId || ''}
                  onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {roles.map((role) => {
                    const displayName = role.name.replaceAll('_', ' ').charAt(0).toUpperCase() + role.name.replaceAll('_', ' ').slice(1);
                    return (
                      <div key={role.id} className="relative">
                        <RadioGroupItem
                          value={role.id.toString()}
                          id={`role-${role.id}`}
                          className="peer absolute right-4 top-4"
                        />
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                        >
                          <span className="text-sm text-foreground">{displayName}</span>
                          <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                            {role.description}
                          </p>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
            </div>

            <div className="space-y-3">
              <Label>Account Status</Label>
              <RadioGroup
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === "active" })}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="active"
                    id="user-active"
                    className="peer absolute right-4 top-4"
                  />
                  <Label
                    htmlFor="user-active"
                    className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                  >
                    <span className="text-sm text-foreground">Active</span>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                      User can sign in
                    </p>
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem
                    value="inactive"
                    id="user-inactive"
                    className="peer absolute right-4 top-4"
                  />
                  <Label
                    htmlFor="user-inactive"
                    className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                  >
                    <span className="text-sm text-foreground">Inactive</span>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                      User cannot sign in
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
