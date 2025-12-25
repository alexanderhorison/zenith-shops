-- Migration: Add categories and products tables for Coffee Shop CMS
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories table
CREATE POLICY "Super admins can manage all categories" 
  ON public.categories FOR ALL 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage categories" 
  ON public.categories FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view active categories" 
  ON public.categories FOR SELECT 
  USING (is_active = true);

-- RLS Policies for products table
CREATE POLICY "Super admins can manage all products" 
  ON public.products FOR ALL 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage products" 
  ON public.products FOR ALL 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view available products" 
  ON public.products FOR SELECT 
  USING (is_available = true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER handle_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert sample categories
INSERT INTO public.categories (name, description, slug, is_active) VALUES 
  ('Espresso', 'Rich and bold espresso-based beverages', 'espresso', true),
  ('Latte', 'Creamy milk-based coffee drinks', 'latte', true),
  ('Cold Brew', 'Refreshing cold coffee beverages', 'cold-brew', true),
  ('Pastries', 'Fresh baked goods and pastries', 'pastries', true),
  ('Seasonal', 'Limited time seasonal offerings', 'seasonal', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, price, category_id, is_available) VALUES 
  ('Americano', 'Rich espresso diluted with hot water for a smooth, bold flavor', 3.50, 1, true),
  ('Espresso Shot', 'Pure, concentrated espresso in a traditional shot', 2.25, 1, true),
  ('Cappuccino', 'Equal parts espresso, steamed milk, and frothed milk', 4.25, 1, true),
  ('Vanilla Latte', 'Smooth espresso with steamed milk and vanilla syrup', 4.75, 2, true),
  ('Caramel Latte', 'Espresso with steamed milk and rich caramel flavor', 4.75, 2, true),
  ('Matcha Latte', 'Creamy matcha green tea latte with steamed milk', 5.25, 2, true),
  ('Iced Cold Brew', 'Smooth, refreshing cold-brewed coffee served over ice', 3.75, 3, true),
  ('Cold Brew Float', 'Cold brew coffee topped with vanilla ice cream', 5.50, 3, true),
  ('Croissant', 'Buttery, flaky pastry perfect with coffee', 2.50, 4, true),
  ('Blueberry Muffin', 'Fresh baked muffin bursting with blueberries', 3.25, 4, true),
  ('Chocolate Chip Cookie', 'Warm, chewy cookie with chocolate chips', 2.75, 4, true)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;

-- Create view for products with category names (for easier querying)
CREATE OR REPLACE VIEW public.products_with_categories AS
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id;

-- Grant access to the view
GRANT SELECT ON public.products_with_categories TO authenticated;
GRANT ALL ON public.products_with_categories TO service_role;