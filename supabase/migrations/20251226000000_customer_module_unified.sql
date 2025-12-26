-- Unified Migration: Customer Module
-- Consolidates: Customers table, Orders, Order Items, Roles, and Permissions

-- 1. Create 'customer' role
INSERT INTO roles (name, description) 
VALUES ('customer', 'Regular customer with access to basic shop features')
ON CONFLICT (name) DO NOTHING;

-- 2. Create 'customers' table (Separated from user_profiles)
-- 2. Create 'customers' table (Separated from user_profiles)
-- Decoupled from auth.users (Standalone CRM)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  dob DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  -- References customers table, not auth.users
  user_id UUID REFERENCES public.customers(id) ON DELETE SET NULL, 
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Customers Table Policies
DROP POLICY IF EXISTS "Admins can manage all customers" ON public.customers;
CREATE POLICY "Admins can manage all customers" ON public.customers
  FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile" ON public.customers
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile" ON public.customers
  FOR UPDATE USING (auth.uid() = id);

-- Orders Table Policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Order Items Table Policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 7. Permissions
INSERT INTO permissions (code, name, description, category) VALUES 
-- Menu
('menu.customers', 'Customers', 'Access to customer management', 'menu'),
-- Actions
('action.customers.view', 'View Customers', 'Can view customer list and details', 'action'),
('action.customers.edit', 'Edit Customers', 'Can edit customer details', 'action'),
('action.customers.suspend', 'Suspend Customers', 'Can suspend or activate customers', 'action')
ON CONFLICT (code) DO NOTHING;

-- 8. GRANT Permissions (Fix for missing access)
-- Grant all new permissions to super_admin and admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'admin') 
  AND p.code IN (
      'menu.customers', 
      'action.customers.view', 
      'action.customers.edit', 
      'action.customers.suspend'
  )
ON CONFLICT DO NOTHING;

-- 9. Optional: Migration Helper
-- If relying on existing data in user_profiles during development, migrate it.
-- This block is safe to run repeatedly as it uses ON CONFLICT.
INSERT INTO public.customers (id, email, full_name, dob, is_active, created_at)
SELECT 
  user_id,
  email,
  full_name,
  NULL as dob, -- Original user_profiles might not have had DOB at start, or use dob column if exists
  is_active,
  created_at
FROM public.user_profiles
WHERE role_id IN (SELECT id FROM roles WHERE name = 'customer')
ON CONFLICT (id) DO NOTHING;
