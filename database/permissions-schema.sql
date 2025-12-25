-- Permissions Schema for Role-Based Access Control

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'menu' or 'action'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(role_id, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (code, name, description, category) VALUES 
-- Menu permissions
('menu.users', 'User Management', 'Access to user management page', 'menu'),
('menu.roles', 'Role Management', 'Access to role management page', 'menu'),
('menu.categories', 'Categories', 'Access to categories management', 'menu'),
('menu.products', 'Products', 'Access to products management', 'menu'),

-- Action permissions
('action.users.view', 'View Users', 'Can view user list', 'action'),
('action.users.create', 'Create Users', 'Can create new users', 'action'),
('action.users.edit', 'Edit Users', 'Can edit existing users', 'action'),
('action.users.delete', 'Delete Users', 'Can delete users', 'action'),

('action.roles.view', 'View Roles', 'Can view role list', 'action'),
('action.roles.create', 'Create Roles', 'Can create new roles', 'action'),
('action.roles.edit', 'Edit Roles', 'Can edit existing roles', 'action'),
('action.roles.delete', 'Delete Roles', 'Can delete roles', 'action'),

('action.categories.view', 'View Categories', 'Can view category list', 'action'),
('action.categories.create', 'Create Categories', 'Can create new categories', 'action'),
('action.categories.edit', 'Edit Categories', 'Can edit existing categories', 'action'),
('action.categories.delete', 'Delete Categories', 'Can delete categories', 'action'),

('action.products.view', 'View Products', 'Can view product list', 'action'),
('action.products.create', 'Create Products', 'Can create new products', 'action'),
('action.products.edit', 'Edit Products', 'Can edit existing products', 'action'),
('action.products.delete', 'Delete Products', 'Can delete products', 'action')
ON CONFLICT (code) DO NOTHING;

-- Grant super_admin all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Grant admin limited permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.code IN (
    'menu.users',
    'menu.categories',
    'menu.products',
    'action.users.view',
    'action.categories.view',
    'action.categories.create',
    'action.categories.edit',
    'action.products.view',
    'action.products.create',
    'action.products.edit'
  )
ON CONFLICT DO NOTHING;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = user_has_permission.user_id AND p.code = user_has_permission.permission_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE(permission_code VARCHAR, permission_name VARCHAR, category VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT p.code, p.name, p.category
  FROM user_profiles up
  JOIN role_permissions rp ON up.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE up.user_id = get_user_permissions.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
