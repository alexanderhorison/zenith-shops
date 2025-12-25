"use client"


import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { ShieldAlert } from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown
} from "lucide-react"
import { getToastTimestamp } from "@/lib/utils"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"

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
  created_at: string
  role?: Role | null
}

export default function UserManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Full Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("full_name") || "—"}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role
        const roleColor = role?.name === 'super_admin' ? 'destructive' :
          role?.name === 'admin' ? 'default' : 'secondary'
        return (
          <Badge variant={roleColor} className="capitalize font-medium">
            {role?.name?.replace('_', ' ') || 'User'}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all_roles") return true
        const role = row.original.role
        return role?.name === value
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === "all_status") return true
        const isActive = row.getValue("is_active") as boolean
        return isActive.toString() === value
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end gap-2 text-right">
            <PermissionGuard permission="action.users.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/admin/users/${user.user_id}/edit`)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4 text-blue-500" />
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="action.users.delete">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteUserId(user.user_id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        )
      },
    },
  ]

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users:', data.error)
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error connecting to server')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers()
      setLoading(false)
    }
    loadData()

    if (searchParams.get('success') === 'created') {
      toast.success('User created successfully', {
        description: getToastTimestamp(),
      })
      router.replace('/dashboard/admin/users')
    }
  }, [searchParams, router])

  const confirmDelete = async () => {
    if (!deleteUserId) return

    try {
      const response = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully', {
          description: getToastTimestamp(),
        })
        await fetchUsers()
      } else {
        toast.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user')
    } finally {
      setDeleteUserId(null)
    }
  }

  const uniqueRoles = Array.from(new Set(users.map(user => user.role?.name).filter(Boolean))) as string[]

  const roleFilterValue = (columnFilters.find((f) => f.id === "role")?.value as string) || "all_roles"
  const statusFilterValue = (columnFilters.find((f) => f.id === "is_active")?.value as string) || "all_status"

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PermissionGuard
      permission="menu.users"
      fallback={
        <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
          <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions for your Coffee Shop CMS
            </p>
          </div>
          <PermissionGuard permission="action.users.create">
            <Button onClick={() => router.push('/dashboard/admin/users/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users Overview</CardTitle>
            <CardDescription>
              Manage and monitor user accounts and their assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users}
              searchKey="email"
              searchPlaceholder="Search by email..."
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
            >
              <div className="flex items-center gap-2">
                <Select
                  value={roleFilterValue}
                  onValueChange={(value) => {
                    const newFilters = columnFilters.filter((f) => f.id !== "role")
                    if (value !== "all_roles") {
                      newFilters.push({ id: "role", value })
                    }
                    setColumnFilters(newFilters)
                  }}
                >
                  <SelectTrigger className="h-10 w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_roles">All Roles</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <span className="capitalize">{role.replace('_', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilterValue}
                  onValueChange={(value) => {
                    const newFilters = columnFilters.filter((f) => f.id !== "is_active")
                    if (value !== "all_status") {
                      newFilters.push({ id: "is_active", value })
                    }
                    setColumnFilters(newFilters)
                  }}
                >
                  <SelectTrigger className="h-10 w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_status">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DataTable>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={deleteUserId !== null}
          onOpenChange={(open) => !open && setDeleteUserId(null)}
          onConfirm={confirmDelete}
          title="Delete user?"
          description="This will permanently delete this user account. This action cannot be undone."
          icon={Trash2}
          confirmText="Delete"
        />
      </div>
    </PermissionGuard>
  )
}