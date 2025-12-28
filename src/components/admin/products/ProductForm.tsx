"use client"

import { useState, useEffect } from "react"
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
import { Coffee, Banknote, Plus, Trash2, X, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"

interface Category {
    id: number
    name: string
}

interface Tag {
    id: number
    name: string
    color: string
}

interface VariantOption {
    id?: number
    name: string
    price_override: string
    sku: string
    is_available: boolean
}

interface VariantGroup {
    name: string
    options: VariantOption[]
}

interface ProductFormProps {
    initialData?: any
    onSubmit: (data: any) => Promise<void>
    saving: boolean
    title: string
    description: string
    submitLabel: string
}

export function ProductForm({
    initialData,
    onSubmit,
    saving,
    title,
    description,
    submitLabel
}: ProductFormProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingTags, setLoadingTags] = useState(true)

    // Helper to group flat variants from DB
    const getInitialVariantGroups = (): VariantGroup[] => {
        if (!initialData?.variants || initialData.variants.length === 0) return []

        const groupsMap: Record<string, VariantOption[]> = {}

        initialData.variants.forEach((v: any) => {
            const groupName = v.variant_group || 'Default'
            if (!groupsMap[groupName]) {
                groupsMap[groupName] = []
            }
            groupsMap[groupName].push({
                ...v,
                price_override: (v.price_override !== null && v.price_override !== undefined)
                    ? new Intl.NumberFormat("id-ID").format(v.price_override)
                    : ""
            })
        })

        return Object.entries(groupsMap).map(([name, options]) => ({
            name,
            options
        }))
    }

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price ? new Intl.NumberFormat("id-ID").format(initialData.price) : "",
        category_id: initialData?.category_id?.toString() || "",
        image_url: initialData?.image_url || "",
        is_available: initialData?.is_available ?? true,
        tag_ids: initialData?.tags?.map((t: any) => t.id) || [] as number[],
        variantGroups: getInitialVariantGroups()
    })

    useEffect(() => {
        fetchResources()
    }, [])

    const fetchResources = async () => {
        try {
            const [catRes, tagRes] = await Promise.all([
                fetch('/api/admin/categories?limit=100'),
                fetch('/api/admin/tags')
            ])

            if (!catRes.ok) {
                const error = await catRes.json()
                throw new Error(error.error || 'Failed to load categories')
            }
            if (!tagRes.ok) {
                const error = await tagRes.json()
                throw new Error(error.error || 'Failed to load tags')
            }

            const catData = await catRes.json()
            const tagData = await tagRes.json()

            // api/admin/categories returns paginated results { data, meta }
            setCategories(catData.data || [])
            // api/admin/tags returns array directly
            setAvailableTags(tagData || [])
        } catch (error: any) {
            console.error('Error fetching resources:', error)
            toast.error('Failed to load form resources', {
                description: getToastTimestamp()
            })
        } finally {
            setLoadingCategories(false)
            setLoadingTags(false)
        }
    }

    // Improved price parsing to handle IDR format (dot as thousands, comma as decimal)
    const parseFormattedPrice = (value: string): number => {
        if (!value) return 0;
        const sanitized = value
            .replace(/\./g, "") // Remove dots (thousands)
            .replace(/,/g, "."); // Replace comma with dot (decimal)
        return parseFloat(sanitized) || 0;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, "");
        const formattedValue = numeric ? new Intl.NumberFormat("id-ID").format(parseInt(numeric)) : "";
        setFormData({ ...formData, price: formattedValue });
    };

    const addVariantGroup = () => {
        setFormData({
            ...formData,
            variantGroups: [
                ...formData.variantGroups,
                { name: "", options: [] }
            ]
        });
    };

    const removeVariantGroup = (groupIndex: number) => {
        const newGroups = [...formData.variantGroups];
        newGroups.splice(groupIndex, 1);
        setFormData({ ...formData, variantGroups: newGroups });
    };

    const addOption = (groupIndex: number) => {
        const newGroups = [...formData.variantGroups];
        newGroups[groupIndex].options.push({ name: "", price_override: "", sku: "", is_available: true });
        setFormData({ ...formData, variantGroups: newGroups });
    };

    const removeOption = (groupIndex: number, optionIndex: number) => {
        const newGroups = [...formData.variantGroups];
        newGroups[groupIndex].options.splice(optionIndex, 1);
        setFormData({ ...formData, variantGroups: newGroups });
    };

    const handleOptionChange = (groupIndex: number, optionIndex: number, field: keyof VariantOption, value: any) => {
        const newGroups = [...formData.variantGroups];
        const option = newGroups[groupIndex].options[optionIndex];

        if (field === 'price_override') {
            const numeric = value.replace(/\D/g, "");
            (option as any)[field] = numeric ? new Intl.NumberFormat("id-ID").format(parseInt(numeric)) : "";
        } else {
            (option as any)[field] = value;
        }

        setFormData({ ...formData, variantGroups: newGroups });
    };

    const handleGroupNameChange = (groupIndex: number, name: string) => {
        const newGroups = [...formData.variantGroups];
        newGroups[groupIndex].name = name;
        setFormData({ ...formData, variantGroups: newGroups });
    };

    const toggleTag = (tagId: number) => {
        setFormData(prev => {
            const hasTag = prev.tag_ids.includes(tagId);
            return {
                ...prev,
                tag_ids: hasTag
                    ? prev.tag_ids.filter((id: number) => id !== tagId)
                    : [...prev.tag_ids, tagId]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const numericPrice = parseFormattedPrice(formData.price);

        // Flatten variant groups for API
        const flattenedVariants: any[] = []
        formData.variantGroups.forEach(group => {
            group.options.forEach(option => {
                const numericOverride = parseFormattedPrice(option.price_override);
                flattenedVariants.push({
                    id: option.id,
                    variant_group: group.name || 'Default',
                    name: option.name,
                    sku: option.sku,
                    price_override: option.price_override ? numericOverride : null,
                    is_available: option.is_available
                })
            })
        })

        const submissionData = {
            name: formData.name,
            description: formData.description,
            price: numericPrice,
            category_id: formData.category_id ? parseInt(formData.category_id) : null,
            image_url: formData.image_url,
            is_available: formData.is_available,
            tag_ids: formData.tag_ids,
            variants: flattenedVariants
        }

        await onSubmit(submissionData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Coffee className="h-5 w-5 text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Americano"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
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
                            <Label htmlFor="price">Base Price <span className="text-destructive">*</span></Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground border-r pr-2 mr-2">
                                    <Banknote className="h-4 w-4 mr-1 text-primary" />
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

                        <div className="grid gap-2">
                            <Label htmlFor="image_url">Image URL</Label>
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://..."
                            />
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

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Tags className="h-4 w-4 text-primary" />
                            Labels & Tags
                        </Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/20">
                            {loadingTags ? (
                                <div className="text-sm text-muted-foreground">Loading tags...</div>
                            ) : availableTags.length > 0 ? (
                                availableTags.map(tag => {
                                    const isSelected = formData.tag_ids.includes(tag.id);
                                    return (
                                        <Badge
                                            key={tag.id}
                                            variant={isSelected ? "default" : "outline"}
                                            className={`cursor-pointer transition-all hover:scale-105 py-1.5 px-3 ${isSelected ? "" : "hover:bg-primary/10"
                                                }`}
                                            onClick={() => toggleTag(tag.id)}
                                        >
                                            {tag.name}
                                            {isSelected && <X className="ml-1.5 h-3 w-3" />}
                                        </Badge>
                                    )
                                })
                            ) : (
                                <div className="text-sm text-muted-foreground">No tags available</div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">Product Variants</CardTitle>
                            <CardDescription>Group options like Sizes, Sugar Levels, or Toppings</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addVariantGroup}
                            className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Variant Group
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {formData.variantGroups.length > 0 ? (
                        <div className="space-y-8">
                            {formData.variantGroups.map((group: VariantGroup, gIndex: number) => (
                                <div key={gIndex} className="p-6 border rounded-2xl bg-muted/5 space-y-4 relative">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 max-w-sm">
                                            <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Group Name (e.g. Size)</Label>
                                            <Input
                                                value={group.name}
                                                onChange={(e) => handleGroupNameChange(gIndex, e.target.value)}
                                                placeholder="Enter group name..."
                                                className="font-semibold"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVariantGroup(gIndex)}
                                            className="text-destructive hover:bg-destructive/10 h-8"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove Group
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase tracking-widest text-muted-foreground block">Options</Label>
                                        <div className="grid gap-3">
                                            {group.options.map((option, oIndex) => (
                                                <div key={oIndex} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-background border rounded-xl shadow-sm relative group/option">
                                                    <div className="flex-1 w-full space-y-1.5">
                                                        <Label className="text-[10px] text-muted-foreground">Option Name (e.g. Small)</Label>
                                                        <Input
                                                            value={option.name}
                                                            onChange={(e) => handleOptionChange(gIndex, oIndex, 'name', e.target.value)}
                                                            placeholder="Small"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-40 space-y-1.5">
                                                        <Label className="text-[10px] text-muted-foreground">Price (+/-)</Label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none border-r pr-1.5 mr-1.5 text-[10px]">
                                                                Rp
                                                            </div>
                                                            <Input
                                                                value={option.price_override}
                                                                onChange={(e) => handleOptionChange(gIndex, oIndex, 'price_override', e.target.value)}
                                                                className="pl-10 text-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-40 space-y-1.5">
                                                        <Label className="text-[10px] text-muted-foreground">SKU (Optional)</Label>
                                                        <Input
                                                            value={option.sku}
                                                            onChange={(e) => handleOptionChange(gIndex, oIndex, 'sku', e.target.value)}
                                                            className="text-sm"
                                                            placeholder="SKU"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeOption(gIndex, oIndex)}
                                                        className="text-destructive opacity-0 group-hover/option:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addOption(gIndex)}
                                                className="w-full md:w-32 border-dashed bg-transparent hover:bg-primary/5 text-primary text-xs"
                                            >
                                                <Plus className="mr-2 h-3 w-3" />
                                                Add Option
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-3xl bg-muted/5">
                            <Plus className="h-10 w-10 text-muted-foreground/20 mb-3" />
                            <p className="font-medium text-muted-foreground">Level up with variants</p>
                            <p className="text-sm text-muted-foreground/60 mb-6 max-w-xs text-center">
                                Add groups like Size or Sugar Level to offer your customers more choices.
                            </p>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addVariantGroup}
                                className="shadow-sm"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Group
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl text-foreground">Availability Status</CardTitle>
                    <CardDescription>
                        Control whether this product is visible in the shop and available for ordering.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left font-normal"
                            >
                                <span className="text-sm font-semibold text-foreground">Available</span>
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
                                className="flex flex-col items-start gap-1 rounded-xl border border-muted bg-card p-5 transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/[0.03] cursor-pointer h-full text-left font-normal"
                            >
                                <span className="text-sm font-semibold text-foreground">Unavailable</span>
                                <p className="text-sm text-muted-foreground/80 leading-relaxed pr-8">
                                    Product is out of stock and will be hidden from customers.
                                </p>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={saving || loadingCategories || loadingTags}
                    className="px-6"
                >
                    {saving ? 'Processing...' : submitLabel}
                </Button>
            </div>
        </form>
    )
}
