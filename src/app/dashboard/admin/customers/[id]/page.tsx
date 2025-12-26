"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Loader2,
    Mail,
    User as UserIcon,
    Calendar,
    CreditCard,
    Package
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
import { DataTable } from "@/components/ui/data-table"
import { toast } from "sonner"
import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"

interface OrderItem {
    id: number
    product_id: number
    quantity: number
    unit_price: string
}

interface Order {
    id: number
    total_amount: string
    status: string
    created_at: string
    items: OrderItem[]
}

interface CustomerDetails {
    id: string
    email: string
    full_name: string
    is_active: boolean
    created_at: string
    dob?: string | null
    orders: Order[]
}

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [customer, setCustomer] = useState<CustomerDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await fetch(`/api/admin/customers/${id}`)
                if (!response.ok) throw new Error('Failed to fetch customer')
                const data = await response.json()
                setCustomer(data.customer)
            } catch (error) {
                console.error('Error fetching customer:', error)
                toast.error('Failed to load customer details')
            } finally {
                setLoading(false)
            }
        }
        fetchCustomer()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <p className="text-muted-foreground">Customer not found</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        )
    }

    const orderColumns: ColumnDef<Order>[] = [
        {
            accessorKey: "id",
            header: "Order ID",
            cell: ({ row }) => (
                <Link
                    href={`/dashboard/admin/orders/${row.getValue("id")}`}
                    className="font-mono hover:underline text-primary"
                >
                    #{row.getValue("id")}
                </Link>
            ),
        },
        {
            accessorKey: "created_at",
            header: "Date",
            cell: ({ row }) => format(new Date(row.getValue("created_at")), "PPP p"),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "items",
            header: "Items",
            cell: ({ row }) => {
                const items = row.original.items
                return <span>{items.reduce((acc, item) => acc + item.quantity, 0)} items</span>
            },
        },
        {
            accessorKey: "total_amount",
            header: "Total",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_amount"))
                return new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount)
            },
            meta: {
                align: "right"
            }
        },
    ]

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
                    <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
                    <p className="text-muted-foreground">
                        View customer information and transaction history.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Customer Profile Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-accent-foreground">
                                {customer.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-lg">{customer.full_name}</p>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                    <Badge variant={customer.is_active ? "outline" : "destructive"}>
                                        {customer.is_active ? "Active" : "Suspended"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center text-sm">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Joined {format(new Date(customer.created_at), "PPP")}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>DOB: {customer.dob ? format(new Date(customer.dob), "PPP") : "N/A"}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="flex flex-col items-center p-3 bg-muted/40 rounded-lg">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Orders</span>
                                    <span className="text-xl font-bold mt-1">{customer.orders.length}</span>
                                </div>
                                <div className="flex flex-col items-center p-3 bg-muted/40 rounded-lg">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Spent</span>
                                    <span className="text-xl font-bold mt-1">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                            maximumFractionDigits: 0
                                        }).format(customer.orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transactions / Orders Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Recent orders placed by this customer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customer.orders.length > 0 ? (
                            <DataTable columns={orderColumns} data={customer.orders} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Package className="h-10 w-10 mb-3 opacity-20" />
                                <p>No transactions found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
