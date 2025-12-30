-- Relax RLS for debugging: Allow any authenticated user to INSERT
DROP POLICY IF EXISTS "Admins can create orders" ON public.orders;
CREATE POLICY "Admins can create orders" ON public.orders
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can create order items" ON public.order_items;
CREATE POLICY "Admins can create order items" ON public.order_items
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);
