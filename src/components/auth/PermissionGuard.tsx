'use client';


import { usePermissions } from './PermissionsContext';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
}

export function PermissionGuard({
    children,
    permission,
    permissions,
    requireAll = false,
    fallback = null
}: PermissionGuardProps) {
    const { hasPermission, isLoading } = usePermissions();

    if (isLoading) {
        return null; // Or a loading spinner if preferred, but usually invisible is better for guards
    }

    let hasAccess = false;

    if (permission) {
        hasAccess = hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
        if (requireAll) {
            hasAccess = permissions.every(p => hasPermission(p));
        } else {
            hasAccess = permissions.some(p => hasPermission(p));
        }
    } else {
        // No permission specified, allow access
        hasAccess = true;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
