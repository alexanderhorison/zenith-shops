-- Enable INSERT access for Admins on orders table
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
CREATE POLICY "Admins can create orders" ON public.orders
  FOR INSERT 
  TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

-- Enable UPDATE access for Admins on orders table (for status updates)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable INSERT access for Admins on order_items table
DROP POLICY IF EXISTS "Admins can create order items" ON public.order_items;
CREATE POLICY "Admins can create order items" ON public.order_items
  FOR INSERT 
  TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()));

-- Enable UPDATE access for Admins on order_items table (just in case)
DROP POLICY IF EXISTS "Admins can update order_items" ON public.order_items;
CREATE POLICY "Admins can update order_items" ON public.order_items
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable DELETE access for Admins on order_items table (just in case)
DROP POLICY IF EXISTS "Admins can delete order_items" ON public.order_items;
CREATE POLICY "Admins can delete order_items" ON public.order_items
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
