"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/dashboard/page-header"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PERMISSIONS } from "@/lib/permission-constants"
import { getToastTimestamp } from "@/lib/utils"

const orderItemSchema = z.object({
    product_id: z.number().int().positive("Product ID must be a positive integer"),
    quantity: z.number().int().positive("Quantity must be greater than 0"),
    unit_price: z.number().nonnegative("Unit price cannot be negative").optional(),
    selected_variants: z.record(z.string()).optional(),
})

const orderJsonSchema = z.object({
    customer_id: z.string().uuid("Customer ID must be a valid UUID").optional().nullable(),
    status: z.enum(["pending", "completed", "cancelled"]),
    items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
})

const formSchema = z.object({
    jsonInput: z.string().superRefine((val, ctx) => {
        try {
            const parsed = JSON.parse(val)
            const result = orderJsonSchema.safeParse(parsed)

            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `${issue.path.join(".") || "root"}: ${issue.message}`,
                    })
                })
                return z.NEVER
            }
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid JSON syntax. Check for trailing commas or quote marks.",
            })
            return z.NEVER
        }
    }),
})

export default function NewOrderPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            jsonInput: JSON.stringify({
                customer_id: null, // Insert Customer UUID here, or keep null for Guest
                status: "pending",
                items: [
                    {
                        product_id: 1,
                        quantity: 1,
                        unit_price: 15000,
                        selected_variants: {
                            "Size": "Regular",
                            "Milk": "Oat"
                        }
                    }
                ]
            }, null, 2),
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const parsedData = JSON.parse(values.jsonInput)

            // Double check with schema to catch specific errors for the toast
            const validation = orderJsonSchema.safeParse(parsedData)
            if (!validation.success) {
                throw new Error(validation.error.issues.map(i => i.message).join(", "))
            }

            // Map customer_id to user_id for the backend
            const payload = {
                ...parsedData,
                user_id: parsedData.customer_id
            }
            delete payload.customer_id

            const response = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create order')
            }

            toast.success("Order Created", {
                description: getToastTimestamp(),
            })

            router.push('/dashboard/admin/orders')
            router.refresh()
        } catch (error: any) {
            // Suppress console error to prevent Next.js overlay for validation errors
            // console.error(error) 
            toast.error("Failed to create order", {
                description: error.message || "Please check your input",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <PermissionGuard permission={PERMISSIONS.ACTIONS.ORDERS.MANAGE}>
            <div className="space-y-6">
                <PageHeader
                    title="Create Order"
                    description="Manually create a new transaction using JSON format."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Data</CardTitle>
                        <CardDescription>
                            Paste the order details in JSON format.
                            Include product_id, quantity, unit_price, and selected_variants (optional).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="jsonInput"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>JSON Payload</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Paste JSON here..."
                                                    className="font-mono text-sm h-[400px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Ensure valid JSON syntax. `price` is fetched automatically from DB.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Order
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </PermissionGuard>
    )
}
