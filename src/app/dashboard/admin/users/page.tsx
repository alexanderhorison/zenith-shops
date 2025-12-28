"use client"


import { useRef, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { ShieldAlert } from "lucide-react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState
} from "@tanstack/react-table"
import { useDebounce } from "@/hooks/use-debounce"
import { createClient } from "@/lib/supabase/client"
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
  ArrowUpDown,
  Users
} from "lucide-react"


import { LoadingIconButton } from "@/components/loading-icon-button"

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
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // Server-side state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowCount, setRowCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState("")
  const debouncedSearch = useDebounce(globalFilter, 500)

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
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
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
    },
    {
      accessorKey: "is_active",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <PermissionGuard permission="action.users.edit">
              <LoadingIconButton
                url={`/dashboard/admin/users/${user.user_id}/edit`}
                icon={<Pencil className="h-4 w-4 text-blue-500" />}
              />
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
    if (users.length > 0) {
      // Only set loading if not initial fetch to avoid flash
      // But for now let's keep it simple
    }
    console.log('Fetching users with params:', {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      debouncedSearch,
      sorting,
      columnFilters
    })
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', (pagination.pageIndex + 1).toString())
      params.set('limit', pagination.pageSize.toString())

      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      if (sorting.length > 0) {
        params.set('sortBy', sorting[0].id)
        params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc')
      }

      columnFilters.forEach(filter => {
        if (filter.value !== undefined) {
          params.set(filter.id, filter.value as string)
        }
      })

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.data)
      setRowCount(data.meta.total)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error connecting to server', {
        description: getToastTimestamp(),
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('name')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters])

  useEffect(() => {
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
        toast.error('Failed to delete user', {
          description: getToastTimestamp(),
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Error deleting user', {
        description: getToastTimestamp(),
      })
    } finally {
      setDeleteUserId(null)
    }
  }

  const roleFilterValue = (columnFilters.find((f) => f.id === "role_id")?.value as string) || "all_roles"
  const statusFilterValue = (columnFilters.find((f) => f.id === "is_active")?.value as string) || "all_status"

  if (loading) {
    // ... (keep loading skeleton)
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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Overview
            </CardTitle>
            <CardDescription>
              Manage users and roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users}
              searchKey="email"
              searchPlaceholder="Search by email..."
              rowCount={rowCount}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
            >
              <div className="flex items-center gap-2">
                <Select
                  value={roleFilterValue}
                  onValueChange={(value) => {
                    const newFilters = columnFilters.filter((f) => f.id !== "role_id")
                    if (value !== "all_roles") {
                      newFilters.push({ id: "role_id", value })
                    }
                    setColumnFilters(newFilters)
                  }}
                >
                  <SelectTrigger className="h-10 w-[150px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_roles">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <span className="capitalize">{role.name.replace('_', ' ')}</span>
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

        {/* Delete Dialog */}
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