-- Migration: Add Product Variants and Tags
-- Created: 2025-12-27

-- 1. Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(20) DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Product Tags Junction Table
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- 3. Create Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  price_override DECIMAL(10,2), -- Optional, overrides product base price
  sku VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Tags: Everyone can view, Admins can manage
CREATE POLICY "Everyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.tags 
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Product Tags: Everyone can view, Admins can manage
CREATE POLICY "Everyone can view product tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage product tags" ON public.product_tags 
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Product Variants: Everyone can view, Admins can manage
CREATE POLICY "Everyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants 
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 6. Updated At Triggers
CREATE TRIGGER handle_updated_at_tags
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER handle_updated_at_product_variants
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Seed some default tags
INSERT INTO public.tags (name, color) VALUES 
('Best Seller', 'orange'),
('New', 'blue'),
('Vegan', 'green'),
('Seasonal', 'purple')
ON CONFLICT (name) DO NOTHING;
