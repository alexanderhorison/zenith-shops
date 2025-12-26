"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '', // Read only
        dob: '',
    })

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/admin/customers/${id}`)
                if (!response.ok) throw new Error('Failed to fetch customer')
                const data = await response.json()
                setFormData({
                    full_name: data.customer.full_name || '',
                    email: data.customer.email || '',
                    dob: data.customer.dob || '',
                })
            } catch (error) {
                console.error('Error fetching customer:', error)
                toast.error('Failed to load customer details')
            } finally {
                setLoading(false)
            }
        }
        fetchCustomer()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const response = await fetch(`/api/admin/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    dob: formData.dob || null,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update customer')
            }

            toast.success('Customer updated successfully', {
                description: getToastTimestamp(),
            })
            router.push('/dashboard/admin/customers')
            router.refresh()
        } catch (error) {
            console.error('Error updating customer:', error)
            toast.error('Failed to update customer')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <Skeleton className="h-10 w-32 ml-auto" />
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
                    onClick={() => router.push('/dashboard/admin/customers')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Customer</h1>
                    <p className="text-muted-foreground">
                        Update customer profile information
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>
                        Manage personal information for this customer
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed directly.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                className="md:w-1/2"
                            />
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Customer
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
