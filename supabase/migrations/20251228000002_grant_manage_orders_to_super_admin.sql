-- Grant action.orders.manage permission to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.code = 'action.orders.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;
