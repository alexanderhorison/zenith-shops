"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, Package, ArrowUpDown, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

interface Category {
  id: number
  name: string
  description: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null)
  const toastShownRef = useRef(false)

  const supabase = createClient()

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => (
        <code className="bg-muted px-2 py-1 rounded text-sm">
          {row.getValue("slug")}
        </code>
      ),
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
        const category = row.original
        return (
          <div className="text-right space-x-2">
            <PermissionGuard permission="action.categories.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/admin/categories/${category.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="action.categories.delete">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        )
      },
    },
  ]

  useEffect(() => {
    fetchCategories()

    // Check for success message from redirection (only show once)
    if (searchParams.get('success') === 'created' && !toastShownRef.current) {
      toastShownRef.current = true
      toast.success('Category created successfully', {
        description: getToastTimestamp(),
      })
      // Clean up the URL
      router.replace('/dashboard/admin/categories')
    }
  }, [searchParams, router])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching categories:', error.message || error)
        // Fallback to mock data if database isn't ready
        const mockCategories: Category[] = [
          {
            id: 1,
            name: "Espresso",
            description: "Rich and bold espresso-based beverages",
            slug: "espresso",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            name: "Latte",
            description: "Creamy milk-based coffee drinks",
            slug: "latte",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        setCategories(mockCategories)
        toast.error('Using mock data', {
          description: 'Could not fetch categories from database',
        })
      } else {
        setCategories(data || [])
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: number) => {
    setDeleteCategoryId(categoryId)
  }

  const confirmDelete = async () => {
    if (!deleteCategoryId) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteCategoryId)

      if (error) throw error

      toast.success('Category deleted successfully', {
        description: getToastTimestamp(),
      })

      // Refresh the categories list
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setDeleteCategoryId(null)
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
      permission="menu.categories"
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
            <h1 className="text-3xl font-bold tracking-tight">Master Data Category</h1>
            <p className="text-muted-foreground">
              Manage coffee shop categories and product classifications
            </p>
          </div>
          <PermissionGuard permission="action.categories.create">
            <Button onClick={() => router.push('/dashboard/admin/categories/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Categories Overview
            </CardTitle>
            <CardDescription>
              {categories.length} total categories • {categories.filter(c => c.is_active).length} active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={categories}
              searchKey="name"
              searchPlaceholder="Search categories..."
            />
          </CardContent>
        </Card >

        {/* Delete Confirmation Dialog */}
        < ConfirmDialog
          open={deleteCategoryId !== null}
          onOpenChange={(open) => !open && setDeleteCategoryId(null)}
          onConfirm={confirmDelete}
          title="Delete category?"
          description="This will permanently delete this category. This action cannot be undone."
          icon={Trash2}
          confirmText="Delete"
        />
      </div>
    </PermissionGuard>
  )
}