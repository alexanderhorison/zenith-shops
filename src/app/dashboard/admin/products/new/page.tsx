"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { ArrowLeft, Coffee, Banknote } from "lucide-react"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Category {
    id: number
    name: string
}

export default function NewProductPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
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
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('is_active', true)
                .order('name')

            if (error) {
                console.error('Error fetching categories:', error)
                toast.error('Failed to load categories')
            } else {
                setCategories(data || [])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoadingCategories(false)
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
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(rawPrice),
                    category_id: parseInt(formData.category_id),
                    image_url: formData.image_url,
                    is_available: formData.is_available,
                }])
                .select()

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            // Don't show toast here - let the list page handle it after redirect
            router.push('/dashboard/admin/products?success=created')
        } catch (error) {
            console.error("Error creating product:", error)
            toast.error("Failed to create product", {
                description: error instanceof Error ? error.message : JSON.stringify(error),
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
                        Add a new product to your catalog
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
                        Enter the details for the new product
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
                                    disabled={loadingCategories}
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
                            <Button type="submit" disabled={saving || loadingCategories}>
                                {saving ? 'Creating...' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
