"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ProductForm } from "@/components/admin/products/ProductForm"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        loadProduct()
    }, [])

    const loadProduct = async () => {
        try {
            const response = await fetch(`/api/admin/products/${params.id}`)
            if (!response.ok) throw new Error('Failed to fetch product')

            const data = await response.json()
            if (data.product) {
                setProduct(data.product)
            } else {
                toast.error('Product not found', {
                    description: getToastTimestamp()
                })
                router.push('/dashboard/admin/products')
            }
        } catch (error) {
            console.error('Error loading product:', error)
            toast.error('Failed to load product data', {
                description: getToastTimestamp()
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (data: any) => {
        setSaving(true)
        try {
            const response = await fetch(`/api/admin/products/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update product')
            }

            toast.success('Product updated successfully', {
                description: getToastTimestamp()
            })
            router.push('/dashboard/admin/products')
        } catch (error: any) {
            console.error("Error updating product:", error)
            toast.error("Failed to update product", {
                description: getToastTimestamp()
            })
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
                    onClick={() => router.push('/dashboard/admin/products')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                    <p className="text-muted-foreground">
                        Update product variants and labels
                    </p>
                </div>
            </div>

            <ProductForm
                initialData={product}
                onSubmit={handleSubmit}
                saving={saving}
                title="Edit Product"
                description="Update information, variants, and labels for this product"
                submitLabel="Save Changes"
            />
        </div>
    )
}

