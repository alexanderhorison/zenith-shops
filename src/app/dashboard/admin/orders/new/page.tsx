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

const formSchema = z.object({
    jsonInput: z.string().refine((val) => {
        try {
            JSON.parse(val)
            return true
        } catch {
            return false
        }
    }, {
        message: "Invalid JSON format",
    }),
})

export default function NewOrderPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            jsonInput: JSON.stringify({
                status: "pending",
                total_amount: 0,
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

            // Basic validation of structure
            if (!parsedData.status || !parsedData.items || !Array.isArray(parsedData.items)) {
                throw new Error("Invalid order structure. Must contain status and items array.")
            }

            const response = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedData),
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
            console.error(error)
            toast.error("Failed to create order", {
                description: error.message || getToastTimestamp(),
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
                                    render={({ field }) => (
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
                                                Ensure valid JSON syntax. `total_amount` can be 0 (auto-calculated logic not implemented yet).
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
