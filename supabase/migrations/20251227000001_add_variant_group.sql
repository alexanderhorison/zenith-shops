-- Add variant_group column to product_variants
ALTER TABLE product_variants ADD COLUMN variant_group TEXT NOT NULL DEFAULT 'Default';

-- Update comment for clarity
COMMENT ON COLUMN product_variants.variant_group IS 'The group name for the variant (e.g., Size, Sugar Level)';
