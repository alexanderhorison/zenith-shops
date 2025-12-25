# Adding New Menu Items

This guide explains how to add new items to the sidebar menu.

## 1. Define the Permission (Optional)

If the menu item requires specific permissions (e.g., only visible to Admins), you generally need a permission code.

1.  **Add permission to Database**:
    Run a SQL command to add the new permission.
    ```sql
    INSERT INTO permissions (code, name, description, category) 
    VALUES ('menu.new-feature', 'New Feature Access', 'Access to new feature page', 'menu')
    ON CONFLICT DO NOTHING;
    ```

2.  **Grant permission to Roles (Optional / Seed)**:
    *   **Via UI**: You can now go to the **Roles** page in the dashboard and check the new permission for the desired role.
    *   **Via SQL (For seeding)**: If you want to pre-populate this permission for a role (e.g., super_admin):
    ```sql
    -- Example: Grant to Admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'admin' AND p.code = 'menu.new-feature';
    ```

3.  **Update Constants**:
    Update `src/lib/permission-constants.ts` to include the new permission string for type safety.

    ```typescript
    export const PERMISSIONS = {
        MENU: {
            // ... existing
            NEW_FEATURE: 'menu.new-feature',
        },
        // ...
    }
    ```

## 2. Update Menu Configuration

Open `src/config/menu-config.ts` and add your item to the appropriate group.

```typescript
import { NewIcon } from 'lucide-react'

// ...

export const MENU_GROUPS: MenuGroup[] = [
    // ...
    {
        label: "My New Group",
        items: [
            {
                title: "New Feature",
                url: "/dashboard/new-feature",
                icon: NewIcon,
                permission: PERMISSIONS.MENU.NEW_FEATURE // Optional
            }
        ]
    }
]
```

## 3. Create the Page

Ensure the page exists at the specified URL (e.g., `src/app/dashboard/new-feature/page.tsx`).

Don't forget to protect the page itself using `PermissionGuard` or API guards!

```tsx
// src/app/dashboard/new-feature/page.tsx
import { PermissionGuard } from "@/components/auth/PermissionGuard"
import { PERMISSIONS } from "@/lib/permission-constants"

export default function NewFeaturePage() {
    return (
        <PermissionGuard permission={PERMISSIONS.MENU.NEW_FEATURE}>
            {/* Page Content */}
        </PermissionGuard>
    )
}
```
