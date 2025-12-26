"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Settings2,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown
} from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    children?: React.ReactNode
    columnFilters?: ColumnFiltersState
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void
    sorting?: SortingState
    onSortingChange?: (sorting: SortingState) => void
    rowCount?: number
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
    pagination?: { pageIndex: number; pageSize: number }
    globalFilter?: string
    onGlobalFilterChange?: (value: string) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    children,
    columnFilters: externalColumnFilters,
    onColumnFiltersChange: setExternalColumnFilters,
    sorting: externalSorting,
    onSortingChange: setExternalSorting,
    rowCount,
    onPaginationChange,
    pagination,
    globalFilter: externalGlobalFilter,
    onGlobalFilterChange: setExternalGlobalFilter,
}: DataTableProps<TData, TValue>) {
    const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
    const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [loading, setLoading] = React.useState(false)
    const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("")
    const [internalPagination, setInternalPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    })

    const columnFilters = externalColumnFilters || internalColumnFilters
    const setColumnFilters = setExternalColumnFilters || setInternalColumnFilters

    const sorting = externalSorting || internalSorting
    const setSorting = setExternalSorting || setInternalSorting

    // Use external pagination if provided, otherwise internal
    const tablePagination = pagination || internalPagination
    const setTablePagination = onPaginationChange || setInternalPagination

    // Use external global filter if provided
    const globalFilter = externalGlobalFilter !== undefined ? externalGlobalFilter : internalGlobalFilter
    const setGlobalFilter = setExternalGlobalFilter || setInternalGlobalFilter

    const table = useReactTable({
        data,
        columns,
        rowCount, // Pass rowCount for server-side pagination
        manualPagination: !!rowCount, // Enable manual pagination if rowCount is present
        manualFiltering: !!rowCount, // Enable manual filtering if using server-side data (assumption)
        manualSorting: !!rowCount, // Enable manual sorting if using server-side data (assumption)
        onSortingChange: (updaterOrValue) => {
            const nextSorting = typeof updaterOrValue === 'function'
                ? updaterOrValue(sorting)
                : updaterOrValue
            setSorting(nextSorting)
        },
        onColumnFiltersChange: (updaterOrValue) => {
            const nextFilters = typeof updaterOrValue === 'function'
                ? updaterOrValue(columnFilters)
                : updaterOrValue
            setColumnFilters(nextFilters)
        },
        onPaginationChange: (updaterOrValue) => {
            const nextPagination = typeof updaterOrValue === 'function'
                ? updaterOrValue(tablePagination)
                : updaterOrValue
            setTablePagination(nextPagination)
        },
        onGlobalFilterChange: (updaterOrValue) => {
            const nextFilter = typeof updaterOrValue === 'function'
                ? updaterOrValue(globalFilter)
                : updaterOrValue
            setGlobalFilter(nextFilter)
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        // onGlobalFilterChange: setGlobalFilter, -> Handled above manually to support both
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            pagination: tablePagination,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-2">
                    {searchKey && (
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={globalFilter ?? ""}
                                onChange={(event) => setGlobalFilter(event.target.value)}
                                className="pl-10 h-10"
                            />
                        </div>
                    )}
                    {children}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-10 ml-auto">
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id.replace("_", " ")}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value))
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
