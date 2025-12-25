"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Shield, ArrowUpDown, Key, ShieldAlert } from "lucide-react"
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
import { ColumnDef } from "@tanstack/react-table"

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
      header: "Description",
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
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex items-center justify-end gap-2 text-right">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/admin/roles/${role.id}/edit`)}
                title="Edit Role"
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4 text-blue-500" />
              </Button>
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
    try {
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      if (response.ok) {
        setRoles(data.roles || [])
      } else {
        console.error('Failed to fetch roles:', data.error)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchRoles()
      setLoading(false)
    }
    loadData()
  }, [])

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
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              A list of all roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={roles}
              searchKey="name"
              searchPlaceholder="Search roles..."
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
