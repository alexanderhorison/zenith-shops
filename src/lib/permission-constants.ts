export const PERMISSIONS = {
    MENU: {
        USERS: 'menu.users',
        ROLES: 'menu.roles',
        CATEGORIES: 'menu.categories',
        PRODUCTS: 'menu.products',
        CUSTOMERS: 'menu.customers',
        ORDERS: 'menu.orders',
    },
    ACTIONS: {
        USERS: {
            VIEW: 'action.users.view',
            CREATE: 'action.users.create',
            EDIT: 'action.users.edit',
            DELETE: 'action.users.delete',
        },
        ROLES: {
            VIEW: 'action.roles.view',
            CREATE: 'action.roles.create',
            EDIT: 'action.roles.edit',
            DELETE: 'action.roles.delete',
        },
        CATEGORIES: {
            VIEW: 'action.categories.view',
            CREATE: 'action.categories.create',
            EDIT: 'action.categories.edit',
            DELETE: 'action.categories.delete',
        },
        PRODUCTS: {
            VIEW: 'action.products.view',
            CREATE: 'action.products.create',
            EDIT: 'action.products.edit',
            DELETE: 'action.products.delete',
        },
        CUSTOMERS: {
            VIEW: 'action.customers.view',
            EDIT: 'action.customers.edit',
            SUSPEND: 'action.customers.suspend',
        },
        ORDERS: {
            VIEW: 'action.orders.view',
            MANAGE: 'action.orders.manage', // Create/Update status
        },
    },
} as const;

// Extract values for type safety if needed in the future
export type PermissionCode =
    | typeof PERMISSIONS.MENU[keyof typeof PERMISSIONS.MENU]
    | typeof PERMISSIONS.ACTIONS.USERS[keyof typeof PERMISSIONS.ACTIONS.USERS]
    | typeof PERMISSIONS.ACTIONS.ROLES[keyof typeof PERMISSIONS.ACTIONS.ROLES]
    | typeof PERMISSIONS.ACTIONS.CATEGORIES[keyof typeof PERMISSIONS.ACTIONS.CATEGORIES]
    | typeof PERMISSIONS.ACTIONS.PRODUCTS[keyof typeof PERMISSIONS.ACTIONS.PRODUCTS]
    | typeof PERMISSIONS.ACTIONS.CUSTOMERS[keyof typeof PERMISSIONS.ACTIONS.CUSTOMERS];
