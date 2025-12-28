"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductForm } from "@/components/admin/products/ProductForm"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"

export default function NewProductPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (data: any) => {
        setSaving(true)
        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create product')
            }

            router.push('/dashboard/admin/products?success=created')
        } catch (error: any) {
            console.error("Error creating product:", error)
            toast.error("Failed to create product", {
                description: getToastTimestamp()
            })
            setSaving(false)
        }
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
                    <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground">
                        Add a new product with variants and labels
                    </p>
                </div>
            </div>

            <ProductForm
                onSubmit={handleSubmit}
                saving={saving}
                title="Product Details"
                description="Enter basic information, variants, and product labels"
                submitLabel="Create Product"
            />
        </div>
    )
}

