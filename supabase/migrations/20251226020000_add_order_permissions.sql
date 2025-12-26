-- Add Orders permissions
INSERT INTO permissions (code, name, description, module)
VALUES 
  ('menu.orders', 'View Orders Menu', 'Access to the Orders menu item', 'orders'),
  ('action.orders.view', 'View Orders', 'Ability to view order details', 'orders')
ON CONFLICT (code) DO NOTHING;

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id, 
  p.id 
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.code IN ('menu.orders', 'action.orders.view')
ON CONFLICT DO NOTHING;
