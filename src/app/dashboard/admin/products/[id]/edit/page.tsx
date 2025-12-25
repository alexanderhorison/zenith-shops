"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
} from "@/components/ui/combobox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Coffee, Banknote } from "lucide-react"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Category {
    id: number
    name: string
}

interface Product {
    id: number
    name: string
    description: string
    price: number
    category_id: number
    image_url: string
    is_available: boolean
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_available: true,
    })

    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Load both product and categories in parallel
            const [productResponse, categoriesResponse] = await Promise.all([
                supabase.from('products').select('*').eq('id', params.id).single(),
                supabase.from('categories').select('id, name').eq('is_active', true).order('name')
            ])

            if (categoriesResponse.data) {
                setCategories(categoriesResponse.data)
            }

            if (productResponse.data) {
                setFormData({
                    name: productResponse.data.name,
                    description: productResponse.data.description || "",
                    price: new Intl.NumberFormat("id-ID").format(productResponse.data.price),
                    category_id: productResponse.data.category_id.toString(),
                    image_url: productResponse.data.image_url || "",
                    is_available: productResponse.data.is_available,
                })
            } else {
                toast.error('Product not found')
                router.push('/dashboard/admin/products')
            }
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Failed to load product data')
        } finally {
            setLoading(false)
        }
    }

    const formatPrice = (value: string) => {
        const numericValue = value.replace(/\D/g, "");
        if (!numericValue) return "";
        return new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatPrice(e.target.value);
        setFormData({ ...formData, price: formattedValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const rawPrice = formData.price.replace(/\./g, "");
            const { error } = await supabase
                .from('products')
                .update({
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(rawPrice),
                    category_id: parseInt(formData.category_id),
                    image_url: formData.image_url,
                    is_available: formData.is_available,
                })
                .eq('id', params.id)

            if (error) throw error

            toast.success('Product updated successfully', {
                description: getToastTimestamp(),
            })

            router.push('/dashboard/admin/products')
        } catch (error) {
            console.error("Error updating product:", error)
            toast.error("Failed to update product", {
                description: error instanceof Error ? error.message : "Unknown error occurred",
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
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
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
                        Update product information
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5" />
                        Product Information
                    </CardTitle>
                    <CardDescription>
                        Update the details for this product
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Americano"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">
                                    Category <span className="text-destructive">*</span>
                                </Label>
                                <Combobox
                                    value={categories.find(c => c.id.toString() === formData.category_id)?.name || ""}
                                    onValueChange={(name) => {
                                        const category = categories.find(c => c.name === name)
                                        if (category) {
                                            setFormData({ ...formData, category_id: category.id.toString() })
                                        }
                                    }}
                                >
                                    <ComboboxInput placeholder="Search category..." />
                                    <ComboboxContent>
                                        <ComboboxList>
                                            <ComboboxEmpty>No category found.</ComboboxEmpty>
                                            {categories.map((category) => (
                                                <ComboboxItem key={category.id} value={category.name}>
                                                    {category.name}
                                                </ComboboxItem>
                                            ))}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="price">
                                    Price <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground border-r pr-2 mr-2">
                                        <Banknote className="h-4 w-4 mr-1" />
                                        <span className="text-sm font-medium">Rp</span>
                                    </div>
                                    <Input
                                        id="price"
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.price}
                                        onChange={handlePriceChange}
                                        className="pl-16 font-medium"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Product description..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="image_url">Image URL</Label>
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <RadioGroup
                                value={formData.is_available.toString()}
                                onValueChange={(value) => setFormData({ ...formData, is_available: value === 'true' })}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="relative">
                                    <RadioGroupItem
                                        value="true"
                                        id="available"
                                        className="peer absolute right-4 top-4"
                                    />
                                    <Label
                                        htmlFor="available"
                                        className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                                    >
                                        <span className="text-sm text-foreground">Available</span>
                                        <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                                            Product is in stock and visible in the store. This is the default.
                                        </p>
                                    </Label>
                                </div>
                                <div className="relative">
                                    <RadioGroupItem
                                        value="false"
                                        id="unavailable"
                                        className="peer absolute right-4 top-4"
                                    />
                                    <Label
                                        htmlFor="unavailable"
                                        className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                                    >
                                        <span className="text-sm text-foreground">Unavailable</span>
                                        <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                                            Product is out of stock and will be hidden from customers.
                                        </p>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/admin/products')}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
