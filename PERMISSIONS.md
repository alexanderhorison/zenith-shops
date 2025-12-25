# Role-Based Permissions System

## Overview

This system allows you to control which menus and actions each role can access. Super admins have full access by default, while other roles must be explicitly granted permissions.

## Setup Instructions

### 1. Run the Database Schema

1. Open your **Supabase project dashboard**
2. Navigate to **SQL Editor**
3. Open the file `database/permissions-schema.sql`
4. Copy its contents and paste into the SQL Editor
5. Click **Run** to execute the schema

This will:
- Create `permissions` and `role_permissions` tables
- Insert default permissions (menus and actions)
- Grant super_admin all permissions
- Grant admin limited permissions
- Create helper functions for permission checking

### 2. Verify Tables Created

After running the schema, verify these tables exist:
- `permissions` - Stores all available permissions
- `role_permissions` - Links roles to their permissions

## Permission Types

### Menu Permissions
Control which menu items users can see:
- `menu.dashboard` - Access to dashboard
- `menu.users` - User Management page
- `menu.roles` - Role Management page  
- `menu.categories` - Categories management
- `menu.products` - Products management
- `menu.profile` - Profile settings

### Action Permissions
Control what actions users can perform:
- `action.users.view` - View user list
- `action.users.create` - Create new users
- `action.users.edit` - Edit existing users
- `action.users.delete` - Delete users
- (Similar patterns for roles, categories, products)

## Using the Permissions System

### 1. Managing Role Permissions (UI)

1. Go to **Dashboard → Admin → Role Management**
2. Click the **Key icon** (🔑) on any role
3. Select the permissions you want to grant
4. Click **Save Permissions**

### 2. Checking Permissions in Code

#### Server-side (API routes, Server Components)

```typescript
import { hasPermission, requirePermission } from '@/lib/permissions';

// Check if user has permission
const canViewUsers = await hasPermission('action.users.view');
if (canViewUsers) {
  // Show user list
}

// Require permission (throws error if not authorized)
await requirePermission('action.users.edit');
```

#### Get User's Menu Permissions

```typescript
import { getMenuPermissions } from '@/lib/permissions';

const menus = await getMenuPermissions();
// Returns: ['menu.dashboard', 'menu.users', ...]
```

### 3. Protecting API Routes

Add permission checks to your API routes:

```typescript
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  try {
    // Require permission to access this endpoint
    await requirePermission('action.users.view');
    
    // Your logic here
    return NextResponse.json({ data: [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Permission denied' },
      { status: 403 }
    );
  }
}
```

### 4. Conditional Rendering in Components

```typescript
import { hasPermission } from '@/lib/permissions';

export default async function MyComponent() {
  const canCreate = await hasPermission('action.users.create');
  
  return (
    <div>
      {canCreate && (
        <Button onClick={handleCreate}>Create User</Button>
      )}
    </div>
  );
}
```

## Default Permissions

### Super Admin
- Has **ALL** permissions automatically
- Cannot be restricted

### Admin
Default permissions include:
- Menu: Dashboard, Users, Categories, Products, Profile
- Actions: 
  - View users
  - View, create, edit categories
  - View, create, edit products

### User
No default permissions - must be granted manually

## Database Functions

The schema includes these helper functions:

### `user_has_permission(user_id, permission_code)`
Check if a user has a specific permission.

```sql
SELECT user_has_permission(
  'user-uuid-here',
  'action.users.view'
);
```

### `get_user_permissions(user_id)`
Get all permissions for a user.

```sql
SELECT * FROM get_user_permissions('user-uuid-here');
```

## API Endpoints

### Get All Permissions
```
GET /api/permissions
```
Returns all available permissions (super_admin only).

### Get Role Permissions  
```
GET /api/admin/roles/:id/permissions
```
Returns permissions for a specific role.

### Update Role Permissions
```
PUT /api/admin/roles/:id/permissions
Body: { "permissionIds": [1, 2, 3] }
```
Updates permissions for a role (replaces all existing).

## Service Layer

### PermissionService

Located at `src/services/permission.service.ts`

Methods:
- `getAllPermissions()` - Get all permissions
- `getRolePermissions(roleId)` - Get permissions for a role
- `updateRolePermissions(roleId, permissionIds)` - Update role permissions
- `userHasPermission(userId, code)` - Check user permission
- `getUserPermissions(userId)` - Get all user permissions
- `getUserMenuPermissions(userId)` - Get user's menu permissions
- `getUserActionPermissions(userId)` - Get user's action permissions

## Best Practices

1. **Always check permissions** before displaying sensitive UI elements
2. **Always validate permissions** on the server (API routes)
3. **Never trust client-side** permission checks for security
4. **Use typed permissions** from `@/lib/permissions` for autocomplete
5. **Grant minimal permissions** and add more as needed
6. **Test with non-admin users** to ensure permissions work correctly

## Troubleshooting

### Permissions not working
1. Verify schema was run successfully in Supabase
2. Check that roles table has data
3. Verify user has a role assigned in user_profiles table
4. Check role_permissions table for the role's permissions

### Super admin not working
Ensure the role name in the roles table is exactly `super_admin` (with underscore).

### Permission checks failing
Check the console for errors - the service layer logs helpful error messages.
