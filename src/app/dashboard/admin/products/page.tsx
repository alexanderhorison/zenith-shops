"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Pencil, Trash2, Coffee, Banknote, Package, ArrowUpDown, ShieldAlert } from "lucide-react"
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

interface Product {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  category_name: string
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
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category_name")}</Badge>,
    },
    {
      accessorKey: "price",
      header: "Price",
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
      header: "Status",
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
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="text-right space-x-2">
            <PermissionGuard permission="action.products.edit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/admin/products/${product.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
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

    // Check for success message from redirection (only show once)
    if (searchParams.get('success') === 'created' && !toastShownRef.current) {
      toastShownRef.current = true
      toast.success('Product created successfully', {
        description: getToastTimestamp(),
      })
      // Clean up the URL
      router.replace('/dashboard/admin/products')
    }
  }, [searchParams, router])

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      // Fetch products with category names
      const { data: productsData, error: productsError } = await supabase
        .from('products_with_categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (categoriesError || productsError) {
        console.error('Database error, using mock data:', { categoriesError, productsError })
        // Fallback to mock data
        const mockCategories: Category[] = [
          { id: 1, name: "Espresso" },
          { id: 2, name: "Latte" },
          { id: 3, name: "Cold Brew" },
          { id: 4, name: "Pastries" },
        ]

        const mockProducts: Product[] = [
          {
            id: 1,
            name: "Americano",
            description: "Rich espresso diluted with hot water for a smooth, bold flavor",
            price: 3.50,
            category_id: 1,
            category_name: "Espresso",
            image_url: "",
            is_available: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]

        setCategories(mockCategories)
        setProducts(mockProducts)

        toast.error('Using mock data', {
          description: 'Could not fetch products from database',
        })
      } else {
        setCategories(categoriesData || [])
        setProducts(productsData || [])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error('Failed to load products', {
        description: 'An unexpected error occurred',
      })
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

  const totalProducts = products.length
  const availableProducts = products.filter(p => p.is_available).length
  const totalValue = products.reduce((sum, product) => sum + product.price, 0)

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
                {availableProducts} available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {totalProducts > 0
                  ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(totalValue / totalProducts)
                  : 'Rp 0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per product
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
              Manage your coffee shop's product catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Search products..."
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