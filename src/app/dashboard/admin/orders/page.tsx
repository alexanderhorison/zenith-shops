"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Loader2,
    Eye,
    ShoppingCart,
    ArrowUpDown,
    Calendar,
    Users
} from "lucide-react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PERMISSIONS } from "@/lib/permission-constants"
import { LoadingIconButton } from "@/components/loading-icon-button"
import { format } from "date-fns"
import { useDebounce } from "@/hooks/use-debounce"
import { cn, getToastTimestamp } from "@/lib/utils"

// ... (other imports)

interface Order {
    id: number
    user_id: string
    total_amount: string
    status: string
    created_at: string
    customer: {
        full_name: string
        email: string
    }
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }])
    const [dateFilter, setDateFilter] = useState("all")
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [rowCount, setRowCount] = useState(0)
    const [globalFilter, setGlobalFilter] = useState("")
    const debouncedSearch = useDebounce(globalFilter, 500)

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('page', (pagination.pageIndex + 1).toString())
            params.set('limit', pagination.pageSize.toString())

            if (debouncedSearch) {
                params.set('search', debouncedSearch)
            }

            if (sorting.length > 0) {
                params.set('sortBy', sorting[0].id)
                params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc')
            }

            const statusFilter = columnFilters.find(f => f.id === 'status')
            if (statusFilter && statusFilter.value !== 'all') {
                params.set('status', statusFilter.value as string)
            }

            if (dateFilter !== 'all') {
                params.set('dateRange', dateFilter)
            }

            const response = await fetch(`/api/admin/orders?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch orders')

            const data = await response.json()
            setOrders(data.data)
            setRowCount(data.meta.total)
        } catch (error) {
            console.error('Error fetching orders:', error)
            toast.error('Failed to load orders', {
                description: getToastTimestamp()
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters, dateFilter])

    // Client-side filtering removed in favor of server-side
    const filteredOrders = orders

    const columns: ColumnDef<Order>[] = [
        // ... (stats helper: same columns)
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Order ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
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
            id: "customer_name",
            accessorFn: (row) => row.customer?.full_name || "Guest",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Customer
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const customer = row.original.customer
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{customer?.full_name || "Guest"}</span>
                        <span className="text-xs text-muted-foreground">{customer?.email || "N/A"}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "total_amount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_amount"))
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount)
                return <div className="font-medium">{formatted}</div>
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={status === 'completed' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                if (value === "all") return true
                return row.getValue(id) === value
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at"))
                return (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(date, 'MMM d, yyyy HH:mm')}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: () => <div className="text-center">Actions</div>,
            cell: ({ row }) => {
                const order = row.original

                return (
                    <div className="flex justify-center gap-2">
                        <PermissionGuard permission={PERMISSIONS.ACTIONS.ORDERS.VIEW}>
                            <LoadingIconButton
                                url={`/dashboard/admin/orders/${order.id}`}
                                icon={<Eye className="h-4 w-4" />}
                                title="View Details"
                            />
                        </PermissionGuard>
                    </div>
                )
            },
        },
    ]

    const statusFilterValue = (columnFilters.find((f) => f.id === "status")?.value as string) || "all"

    if (loading) {
        // ... (keep skeleton)
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <div className="p-4 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
                    <p className="text-muted-foreground">
                        View and manage customer orders.
                    </p>
                </div>
                <PermissionGuard permission={PERMISSIONS.ACTIONS.ORDERS.MANAGE}>
                    <Link href="/dashboard/admin/orders/new">
                        <Button>
                            Create Order
                        </Button>
                    </Link>
                </PermissionGuard>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Orders Overview
                        </CardTitle>
                    </div>
                    <CardDescription>
                        List of all orders placed by customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        searchKey="customer_name"
                        searchPlaceholder="Search by Order ID..."
                        columnFilters={columnFilters}
                        onColumnFiltersChange={setColumnFilters}
                        sorting={sorting}
                        onSortingChange={setSorting}
                        rowCount={rowCount}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                    >
                        <div className="flex items-center gap-2">
                            <Select
                                value={dateFilter}
                                onValueChange={setDateFilter}
                            >
                                <SelectTrigger className="h-10 w-[150px]">
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="yesterday">Yesterday</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={statusFilterValue}
                                onValueChange={(value) => {
                                    const newFilters = columnFilters.filter((f) => f.id !== "status")
                                    if (value !== "all") {
                                        newFilters.push({ id: "status", value })
                                    }
                                    setColumnFilters(newFilters)
                                }}
                            >
                                <SelectTrigger className="h-10 w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTable>
                </CardContent>
            </Card>
        </div>
    )
}
