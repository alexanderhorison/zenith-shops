import {
    Home,
    Users,
    Shield,
    Package,
    Coffee,
    LucideIcon
} from 'lucide-react'
import { PERMISSIONS } from '@/lib/permission-constants'

export interface MenuItem {
    title: string
    url: string
    icon: LucideIcon
    permission?: string
}

export interface MenuGroup {
    label: string
    items: MenuItem[]
}

export const MENU_GROUPS: MenuGroup[] = [
    {
        label: "Navigation",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: Home,
            }
        ]
    },
    {
        label: "User Data Management",
        items: [
            {
                title: "Users",
                url: "/dashboard/admin/users",
                icon: Users,
                permission: PERMISSIONS.MENU.USERS
            },
            {
                title: "Roles",
                url: "/dashboard/admin/roles",
                icon: Shield,
                permission: PERMISSIONS.MENU.ROLES
            }
        ]
    },
    {
        label: "Product Management",
        items: [
            {
                title: "Categories",
                url: "/dashboard/admin/categories",
                icon: Package,
                permission: PERMISSIONS.MENU.CATEGORIES
            },
            {
                title: "Products",
                url: "/dashboard/admin/products",
                icon: Coffee,
                permission: PERMISSIONS.MENU.PRODUCTS
            }
        ]
    }
]
