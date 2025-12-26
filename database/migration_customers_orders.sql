-- Migration: Add customer role, orders, and customer management permissions

-- 1. Create 'customer' role if not exists
INSERT INTO roles (name, description) 
VALUES ('customer', 'Regular customer with access to basic shop features')
ON CONFLICT (name) DO NOTHING;

-- 2. Create 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'order_items' table
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL, -- Price at time of purchase
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 6. Insert Permissions
INSERT INTO permissions (code, name, description, category) VALUES 
-- Menu
('menu.customers', 'Customers', 'Access to customer management', 'menu'),
-- Actions
('action.customers.view', 'View Customers', 'Can view customer list and details', 'action'),
('action.customers.edit', 'Edit Customers', 'Can edit customer details', 'action'),
('action.customers.suspend', 'Suspend Customers', 'Can suspend or activate customers', 'action')
ON CONFLICT (code) DO NOTHING;

-- 7. Grant Permissions to Admin and Super Admin
-- Grant super_admin all new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin' 
  AND p.code IN ('menu.customers', 'action.customers.view', 'action.customers.edit', 'action.customers.suspend')
ON CONFLICT DO NOTHING;

-- Grant admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' 
  AND p.code IN ('menu.customers', 'action.customers.view', 'action.customers.edit', 'action.customers.suspend')
ON CONFLICT DO NOTHING;

-- 8. Seed Sample Data (Optional, but helpful for development)
-- Just ensuring we have at least one customer-role user if possible, 
-- but we can't easily query auth.users ID here without knowing it.
-- We will skip inserting users/orders here to avoid errors and assume the app will handle usage.
