-- Update RLS policies to strictly use the new permission system (role_id driven)
-- instead of the legacy 'role' enum column (is_admin function).

-- ======================================================================
-- CATEGORIES
-- ======================================================================

-- Drop old admin policy
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Super admins can manage all categories" ON public.categories;

-- Create granular policies
CREATE POLICY "Enable create access for authorized users"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.create'
  )
);

CREATE POLICY "Enable update access for authorized users"
ON public.categories FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.edit'
  )
);

CREATE POLICY "Enable delete access for authorized users"
ON public.categories FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.categories.delete'
  )
);

-- Note: "Users can view active categories" policy remains for public access.
-- If we need admins to view INACTIVE categories, we need a policy for that too.
CREATE POLICY "Enable view access for authorized users (including inactive)"
ON public.categories FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND (p.code = 'menu.categories' OR p.code = 'action.categories.view')
  )
);


-- ======================================================================
-- PRODUCTS
-- ======================================================================

-- Drop old admin policy
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Super admins can manage all products" ON public.products;

-- Create granular policies
CREATE POLICY "Enable create access for authorized users"
ON public.products FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.create'
  )
);

CREATE POLICY "Enable update access for authorized users"
ON public.products FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.edit'
  )
);

CREATE POLICY "Enable delete access for authorized users"
ON public.products FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND p.code = 'action.products.delete'
  )
);

-- View inactive products (admins)
CREATE POLICY "Enable view access for authorized users (including inactive)"
ON public.products FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN role_permissions rp ON up.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE up.user_id = auth.uid() AND (p.code = 'menu.products' OR p.code = 'action.products.view')
  )
);
