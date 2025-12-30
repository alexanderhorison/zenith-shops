-- Add action.orders.manage permission
INSERT INTO permissions (code, name, description, category)
VALUES (
  'action.orders.manage',
  'Manage Orders',
  'Create, update and manage orders',
  'orders'
) ON CONFLICT (code) DO NOTHING;

-- Grant permission to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.code = 'action.orders.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
