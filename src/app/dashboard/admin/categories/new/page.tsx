"use client"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package } from "lucide-react"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export default function NewCategoryPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        slug: "",
        is_active: true,
    })

    const supabase = createClient()

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
            // Debug: Check current user
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Current user:', user?.id, user?.email)

            const { data, error } = await supabase
                .from('categories')
                .insert([{
                    name: formData.name,
                    description: formData.description,
                    slug: formData.slug,
                    is_active: formData.is_active,
                }])
                .select()

            if (error) {
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                })
                throw error
            }

            // Don't show toast here - let the list page handle it after redirect
            router.push('/dashboard/admin/categories?success=created')
        } catch (error: any) {
            console.error("Error creating category:", error)
            const errorMessage = error?.message || error?.details || "Unknown error occurred"
            toast.error("Failed to create category", {
                description: getToastTimestamp(),
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
                    onClick={() => router.push('/dashboard/admin/categories')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
                    <p className="text-muted-foreground">
                        Add a new category to organize your products
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
                        Enter the details for the new category
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
                                            Category will be visible and products can be assigned to it.
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
                                            Category will be hidden and products will not be visible in this category.
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
                                {saving ? 'Creating...' : 'Create Category'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
