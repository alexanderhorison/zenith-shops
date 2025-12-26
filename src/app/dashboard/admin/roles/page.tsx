"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Shield, ArrowUpDown, Key, ShieldAlert } from "lucide-react"
import { LoadingIconButton } from "@/components/loading-icon-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PermissionsDialog } from "@/components/ui/permissions-dialog"
import { getToastTimestamp } from "@/lib/utils"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef, SortingState } from "@tanstack/react-table"
import { useDebounce } from "@/hooks/use-debounce"

interface Role {
  id: number
  name: string
  description: string
  created_at: string
}

export default function RoleManagementPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteRoleId, setDeleteRoleId] = useState<number | null>(null)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null)

  // Server-side state
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowCount, setRowCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState("")
  const debouncedSearch = useDebounce(globalFilter, 500)

  // Column definitions for the DataTable
  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Role Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        const badgeVariant = name === 'super_admin' ? 'destructive' :
          name === 'admin' ? 'default' : 'secondary'
        return (
          <Badge variant={badgeVariant} className="capitalize font-medium">
            {name.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Description
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return <div className="max-w-md truncate text-muted-foreground">{description}</div>
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
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return <div className="text-muted-foreground">{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRoleForPermissions(role)
                setPermissionsDialogOpen(true)
              }}
              title="Manage Permissions"
              className="h-8 w-8 p-0"
            >
              <Key className="h-4 w-4 text-amber-500" />
            </Button>
            <PermissionGuard permission="action.roles.edit">
              <LoadingIconButton
                url={`/dashboard/admin/roles/${role.id}/edit`}
                title="Edit Role"
                icon={<Pencil className="h-4 w-4 text-blue-500" />}
              />
            </PermissionGuard>
            <PermissionGuard permission="action.roles.delete">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteRoleId(role.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete Role"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        )
      },
    },
  ]

  const fetchRoles = async () => {
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

      const response = await fetch(`/api/admin/roles?${params.toString()}`)

      if (!response.ok) throw new Error('Failed to fetch roles')

      const data = await response.json()
      setRoles(data.data)
      setRowCount(data.meta.total)
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting])

  const confirmDelete = async () => {
    if (!deleteRoleId) return

    try {
      const response = await fetch(`/api/admin/roles/${deleteRoleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Role deleted successfully', {
          description: getToastTimestamp(),
        })
        await fetchRoles()
      } else {
        toast.error('Failed to delete role', {
          description: data.error || 'Unknown error occurred',
        })
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Error deleting role', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setDeleteRoleId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
      permission="menu.roles"
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
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Manage system roles and permissions
            </p>
          </div>
          <PermissionGuard permission="action.roles.create">
            <Button onClick={() => router.push('/dashboard/admin/roles/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles Overview
            </CardTitle>
            <CardDescription>
              Manage system roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={roles}
              searchKey="name"
              searchPlaceholder="Search roles..."
              rowCount={rowCount}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </CardContent>
        </Card>

        {/* Permissions Management Dialog */}
        {
          selectedRoleForPermissions && (
            <PermissionsDialog
              open={permissionsDialogOpen}
              onOpenChange={setPermissionsDialogOpen}
              roleId={selectedRoleForPermissions.id}
              roleName={selectedRoleForPermissions.name}
              onSaved={() => {
                // Optionally refresh data or show success message
              }}
            />
          )
        }

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteRoleId !== null}
          onOpenChange={(open) => !open && setDeleteRoleId(null)}
          onConfirm={confirmDelete}
          title="Delete role?"
          description="This will permanently delete this role. Users with this role will need to be reassigned."
          icon={Shield}
          confirmText="Delete"
        />
      </div>
    </PermissionGuard>
  )
}
