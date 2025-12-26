"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Loader2,
    Calendar,
    CreditCard,
    Package,
    User as UserIcon,
    ShoppingCart
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface OrderItem {
    id: number
    quantity: number
    unit_price: string
    product: {
        name: string
        image_url: string | null
    }
}

interface OrderDetails {
    id: number
    total_amount: string
    status: string
    created_at: string
    customer: {
        full_name: string
        email: string
    }
    items: OrderItem[]
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [order, setOrder] = useState<OrderDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/admin/orders/${id}`)
                if (!response.ok) throw new Error('Failed to fetch order')
                const data = await response.json()
                setOrder(data.order)
            } catch (error) {
                console.error('Error fetching order:', error)
                toast.error('Failed to load order details')
            } finally {
                setLoading(false)
            }
        }
        fetchOrder()
    }, [id])

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                    <div>
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!order) return <div>Order not found</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push('/dashboard/admin/orders')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                {item.product.image_url ? (
                                                    <img
                                                        src={item.product.image_url}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="h-8 w-8 text-muted-foreground/50" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="font-medium">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(parseFloat(item.unit_price) * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between items-center pt-4">
                                    <span className="font-medium text-muted-foreground">Total Amount</span>
                                    <span className="text-2xl font-bold">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        }).format(parseFloat(order.total_amount))}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Info */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                    <p className="font-medium">{order.customer.full_name}</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p>{order.customer.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
