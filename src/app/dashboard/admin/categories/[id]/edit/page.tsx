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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Package } from "lucide-react"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Category {
    id: number
    name: string
    description: string
    slug: string
    is_active: boolean
}

export default function EditCategoryPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        slug: "",
        is_active: true,
    })

    const supabase = createClient()

    useEffect(() => {
        fetchCategory()
    }, [])

    const fetchCategory = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error

            if (data) {
                setFormData({
                    name: data.name,
                    description: data.description || "",
                    slug: data.slug,
                    is_active: data.is_active,
                })
            }
        } catch (error) {
            console.error('Error fetching category:', error)
            toast.error('Failed to load category', {
                description: 'Could not fetch category data',
            })
        } finally {
            setLoading(false)
        }
    }

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
    }

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name),
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    name: formData.name,
                    description: formData.description,
                    slug: formData.slug,
                    is_active: formData.is_active,
                })
                .eq('id', params.id)

            if (error) throw error

            toast.success('Category updated successfully', {
                description: getToastTimestamp(),
            })

            router.push('/dashboard/admin/categories')
        } catch (error) {
            console.error("Error updating category:", error)
            toast.error("Failed to update category", {
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
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-20 w-full" />
                        </div>
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
                    onClick={() => router.push('/dashboard/admin/categories')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
                    <p className="text-muted-foreground">
                        Update category information
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Category Information
                    </CardTitle>
                    <CardDescription>
                        Update the details for this category
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
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g., Espresso"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="slug">
                                    Slug <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="e.g., espresso"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Category description..."
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <RadioGroup
                                value={formData.is_active.toString()}
                                onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="relative">
                                    <RadioGroupItem
                                        value="true"
                                        id="active"
                                        className="peer absolute right-4 top-4"
                                    />
                                    <Label
                                        htmlFor="active"
                                        className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                                    >
                                        <span className="text-sm text-foreground">Active</span>
                                        <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                                            Category is visible and products can be assigned to it.
                                        </p>
                                    </Label>
                                </div>
                                <div className="relative">
                                    <RadioGroupItem
                                        value="false"
                                        id="inactive"
                                        className="peer absolute right-4 top-4"
                                    />
                                    <Label
                                        htmlFor="inactive"
                                        className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left"
                                    >
                                        <span className="text-sm text-foreground">Inactive</span>
                                        <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                                            Category is hidden and products will not be visible in this category.
                                        </p>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/admin/categories')}
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
