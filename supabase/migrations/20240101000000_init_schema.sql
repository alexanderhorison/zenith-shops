-- Initial Schema Migration
-- Includes: Roles, User Profiles, Permissions (RBAC), Categories, Products
-- Created: 2024-01-01

-- ==========================================
-- 1. UTILITIES & ENUMS
-- ==========================================
-- Legacy Type Removed
-- user_role enum is no longer used. We use roles table.

-- Helper for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. ROLES & PROFILES
-- ==========================================

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.roles (name, description) VALUES 
('super_admin', 'Super Administrator with full system access'),
('admin', 'Administrator with limited system access')
ON CONFLICT (name) DO NOTHING;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Duplicate reference for easier querying if needed, but 'id' is key
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
  -- role column removed in favor of role_id
);
-- Ensure uniqueness
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_key') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END$$;


-- Functions for Role Checks
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
   -- Prefer checking roles table via role_id
  RETURN (
    SELECT r.name
    FROM user_profiles up
    JOIN roles r ON up.role_id = r.id
    WHERE up.id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_uuid) IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_uuid) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Automate Profile Creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated At Triggers
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 3. PERMISSIONS (RBAC)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(role_id, permission_id)
);

-- Default Permissions
INSERT INTO permissions (code, name, description, category) VALUES 
-- Menu
('menu.users', 'User Management', 'Access to user management page', 'menu'),
('menu.roles', 'Role Management', 'Access to role management page', 'menu'),
('menu.categories', 'Categories', 'Access to categories management', 'menu'),
('menu.products', 'Products', 'Access to products management', 'menu'),
-- Actions
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

-- Grant Super Admin All
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Grant Admin defaults
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.code IN (
    'menu.users', 'menu.categories', 'menu.products',
    'action.users.view',
    'action.categories.view', 'action.categories.create', 'action.categories.edit',
    'action.products.view', 'action.products.create', 'action.products.edit'
  )
ON CONFLICT DO NOTHING;


-- ==========================================
-- 4. CATEGORIES & PRODUCTS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
DROP TRIGGER IF EXISTS handle_updated_at_categories ON public.categories;
CREATE TRIGGER handle_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS handle_updated_at_products ON public.products;
CREATE TRIGGER handle_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Seed Categories/Products
INSERT INTO public.categories (name, description, slug, is_active) VALUES 
  ('Espresso', 'Rich and bold espresso-based beverages', 'espresso', true),
  ('Latte', 'Creamy milk-based coffee drinks', 'latte', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, description, price, category_id, is_available) VALUES 
  ('Americano', 'Rich espresso diluted with hot water', 3.50, 1, true)
ON CONFLICT DO NOTHING;


-- ==========================================
-- 5. RLS POLICIES (Secure by Default)
-- ==========================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5.0 Metadata Read Policies (Required for Permission Checks)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.roles;
CREATE POLICY "Allow read access to authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.permissions;
CREATE POLICY "Allow read access to authenticated users" ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.role_permissions;
CREATE POLICY "Allow read access to authenticated users" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- 5.1 Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
CREATE POLICY "Admins can update profiles" ON user_profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- 5.2 Categories Granular Policies
DROP POLICY IF EXISTS "Enable create access for authorized users" ON public.categories;
CREATE POLICY "Enable create access for authorized users" ON public.categories FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.create'
  )
);

DROP POLICY IF EXISTS "Enable update access for authorized users" ON public.categories;
CREATE POLICY "Enable update access for authorized users" ON public.categories FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.edit'
  )
);

DROP POLICY IF EXISTS "Enable delete access for authorized users" ON public.categories;
CREATE POLICY "Enable delete access for authorized users" ON public.categories FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.delete'
  )
);

DROP POLICY IF EXISTS "Enable view access for authorized users (including inactive)" ON public.categories;
CREATE POLICY "Enable view access for authorized users (including inactive)" ON public.categories FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND (p.code = 'menu.categories' OR p.code = 'action.categories.view')
  )
);
-- Public view for active? (Optional, skipping for strict admin tool focus unless needed)

-- 5.3 Products Granular Policies
DROP POLICY IF EXISTS "Enable create access for authorized users" ON public.products;
CREATE POLICY "Enable create access for authorized users" ON public.products FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.create'
  )
);

DROP POLICY IF EXISTS "Enable update access for authorized users" ON public.products;
CREATE POLICY "Enable update access for authorized users" ON public.products FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.edit'
  )
);

DROP POLICY IF EXISTS "Enable delete access for authorized users" ON public.products;
CREATE POLICY "Enable delete access for authorized users" ON public.products FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.delete'
  )
);

DROP POLICY IF EXISTS "Enable view access for authorized users" ON public.products;
CREATE POLICY "Enable view access for authorized users" ON public.products FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND (p.code = 'menu.products' OR p.code = 'action.products.view')
  )
);
