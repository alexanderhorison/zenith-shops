"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2,
    Search,
    Eye,
    Pencil,
    Ban,
    CheckCircle,
    MoreHorizontal,
    ArrowUpDown,
    Users
} from "lucide-react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
} from "@tanstack/react-table"
import { useDebounce } from "@/hooks/use-debounce"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { getToastTimestamp } from "@/lib/utils"
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PERMISSIONS } from "@/lib/permission-constants"
import { usePermissions } from "@/components/auth/PermissionsContext"
import { LoadingIconButton } from "@/components/loading-icon-button"

interface Customer {
    id: string
    email: string
    full_name: string
    is_active: boolean
    total_orders: number
    total_spent: number
    created_at: string
}

export default function CustomersPage() {
    const router = useRouter()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [sorting, setSorting] = useState<SortingState>([])
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [rowCount, setRowCount] = useState(0)

    const debouncedSearch = useDebounce(globalFilter, 500)
    const { hasPermission } = usePermissions()

    const fetchCustomers = async () => {
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

            const statusFilter = columnFilters.find(f => f.id === 'is_active')
            if (statusFilter && statusFilter.value !== 'all_status') {
                params.set('is_active', statusFilter.value as string)
            }

            const response = await fetch(`/api/admin/customers?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch customers')

            const data = await response.json()
            setCustomers(data.data)
            setRowCount(data.meta.total)
        } catch (error) {
            console.error('Error fetching customers:', error)
            toast.error('Failed to load customers')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [pagination.pageIndex, pagination.pageSize, debouncedSearch, sorting, columnFilters])

    const handleSuspend = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/customers/${id}/suspend`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            })

            if (!response.ok) throw new Error('Failed to update status')

            toast.success(`Customer ${!currentStatus ? 'activated' : 'suspended'} successfully`, {
                description: getToastTimestamp()
            })
            fetchCustomers()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const columns: ColumnDef<Customer>[] = [
        {
            accessorKey: "full_name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("full_name") || "N/A"}</div>,
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        {
            accessorKey: "total_orders",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Orders
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="text-center">{row.getValue("total_orders")}</div>,
        },
        {
            accessorKey: "total_spent",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold"
                    >
                        Total Spent
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_spent"))
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount)
                return <div className="text-right font-medium">{formatted}</div>
            },
            meta: {
                align: "right"
            }
        },
        {
            accessorKey: "is_active",
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
                const isActive = row.getValue("is_active")
                return (
                    <Badge variant={isActive ? "default" : "destructive"}>
                        {isActive ? "Active" : "Suspended"}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                if (value === "all_status") return true
                const isActive = row.getValue("is_active") as boolean
                return isActive.toString() === value
            },
        },
        {
            id: "actions",
            header: () => <div className="text-center">Actions</div>,
            cell: ({ row }) => {
                const customer = row.original

                return (
                    <div className="flex justify-center gap-2">
                        <PermissionGuard permission={PERMISSIONS.ACTIONS.CUSTOMERS.VIEW}>
                            <LoadingIconButton
                                url={`/dashboard/admin/customers/${customer.id}`}
                                icon={<Eye className="h-4 w-4" />}
                                title="View Details"
                            />
                        </PermissionGuard>

                        <PermissionGuard permission={PERMISSIONS.ACTIONS.CUSTOMERS.EDIT}>
                            {/* Using LoadingIconButton for edit navigation too */}
                            <LoadingIconButton
                                url={`/dashboard/admin/customers/${customer.id}/edit`}
                                icon={<Pencil className="h-4 w-4 text-blue-500" />}
                                title="Edit Customer"
                            />
                        </PermissionGuard>

                        <PermissionGuard permission={PERMISSIONS.ACTIONS.CUSTOMERS.SUSPEND}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => handleSuspend(customer.id, customer.is_active)}
                                        className={customer.is_active ? "text-destructive" : "text-green-600"}
                                    >
                                        {customer.is_active ? (
                                            <>
                                                <Ban className="mr-2 h-4 w-4" /> Suspend
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </PermissionGuard>
                    </div>
                )
            },
        },
    ]

    const statusFilterValue = (columnFilters.find((f) => f.id === "is_active")?.value as string) || "all_status"

    if (loading) {
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
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">
                        Manage your customer base and view their history.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Customers Overview
                        </CardTitle>
                    </div>
                    <CardDescription>
                        List of all registered customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={customers}
                        searchKey="email"
                        searchPlaceholder="Search by email..."
                        columnFilters={columnFilters}
                        onColumnFiltersChange={setColumnFilters}
                        rowCount={rowCount}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        sorting={sorting}
                        onSortingChange={setSorting}
                        globalFilter={globalFilter}
                        onGlobalFilterChange={setGlobalFilter}
                    >
                        <div className="flex items-center gap-2">
                            <Select
                                value={statusFilterValue}
                                onValueChange={(value) => {
                                    const newFilters = columnFilters.filter((f) => f.id !== "is_active")
                                    if (value !== "all_status") {
                                        newFilters.push({ id: "is_active", value })
                                    }
                                    setColumnFilters(newFilters)
                                }}
                            >
                                <SelectTrigger className="h-10 w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all_status">All Status</SelectItem>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </DataTable>
                </CardContent>
            </Card>
        </div>
    )
}
