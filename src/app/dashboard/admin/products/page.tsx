"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, Coffee, Banknote, Package, ArrowUpDown, ShieldAlert } from "lucide-react"
import { LoadingIconButton } from "@/components/loading-icon-button"

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
import { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { useDebounce } from "@/hooks/use-debounce"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  category?: {
    id: number
    name: string
  }
  image_url: string
  is_available: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: number
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
  const toastShownRef = useRef(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [rowCount, setRowCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState("")
  const debouncedSearch = useDebounce(globalFilter, 500)

  const supabase = createClient()

  const columns: ColumnDef<Product>[] = [
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
      cell: ({ row }) => {
        const product = row.original
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {product.description}
            </div>
          </div>
        )
      },
    },
    {
      id: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <Badge variant="outline">
            {category?.name || "Uncategorized"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 font-semibold"
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"))
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(price)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "is_available",
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
        const isAvailable = row.getValue("is_available") as boolean
        return (
          <Badge variant={isAvailable ? "default" : "secondary"}>
            {isAvailable ? "Available" : "Unavailable"}
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
        const product = row.original
        return (
          <div className="flex items-center justify-center gap-2">
            <PermissionGuard permission="action.products.edit">
              <LoadingIconButton
                url={`/dashboard/admin/products/${product.id}/edit`}
                icon={<Pencil className="h-4 w-4" />}
              />
            </PermissionGuard>
            <PermissionGuard permission="action.products.delete">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(product.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGuard>
          </div>
        )
      },
    }
  ]

  useEffect(() => {
    fetchData()
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters])

  useEffect(() => {
    if (searchParams.get('success') === 'created' && !toastShownRef.current) {
      toastShownRef.current = true
      toast.success('Product created successfully', {
        description: getToastTimestamp(),
      })
      router.replace('/dashboard/admin/products')
    }
  }, [searchParams, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch categories for filter (cached or separate)
      // Only fetch once ideally, but simple enough to fetch here or separate effect. 
      // Let's keep distinct.
      if (categories.length === 0) {
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
        setCategories(categoriesData || [])
      }

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

      // Check for category filter if implemented via columnFilters, assuming id "category_name" or custom
      // Actually current DataTable doesn't easily expose category dropdown unless we build it custom.
      // For now, support columnFilters if they map to fields.

      const response = await fetch(`/api/admin/products?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProducts(data.data)
      setRowCount(data.meta.total)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: number) => {
    setDeleteProductId(productId)
  }

  const confirmDelete = async () => {
    if (!deleteProductId) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProductId)

      if (error) throw error

      toast.success('Product deleted successfully', {
        description: getToastTimestamp(),
      })

      // Refresh the products list
      await fetchData()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Failed to delete product", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setDeleteProductId(null)
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
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
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

  const totalProducts = rowCount
  // const availableProducts = products.filter(p => p.is_available).length // Only current page
  // const totalValue = products.reduce((sum, product) => sum + product.price, 0) // Only current page

  return (
    <PermissionGuard
      permission="menu.products"
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
            <h1 className="text-3xl font-bold tracking-tight">Master Data Product</h1>
            <p className="text-muted-foreground">
              Manage coffee shop products, prices, and availability
            </p>
          </div>
          <PermissionGuard permission="action.products.create">
            <Button onClick={() => router.push('/dashboard/admin/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </PermissionGuard>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Total items in catalog
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Active categories
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Products Overview
            </CardTitle>
            <CardDescription>
              Manage product catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products..."
              rowCount={rowCount}
              pagination={pagination}
              onPaginationChange={setPagination}
              sorting={sorting}
              onSortingChange={setSorting}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
            />
          </CardContent>
        </Card >

        {/* Delete Confirmation Dialog */}
        < ConfirmDialog
          open={deleteProductId !== null}
          onOpenChange={(open) => !open && setDeleteProductId(null)}
          onConfirm={confirmDelete}
          title="Delete product?"
          description="This will permanently delete this product. This action cannot be undone."
          icon={Trash2}
          confirmText="Delete"
        />
      </div>
    </PermissionGuard>
  )
}