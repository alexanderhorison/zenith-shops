-- Add selected_variants column to order_items table to store JSON snapshot of chosen options
ALTER TABLE "order_items" 
ADD COLUMN IF NOT EXISTS "selected_variants" JSONB DEFAULT NULL;

COMMENT ON COLUMN "order_items"."selected_variants" IS 'Stores a JSON object of selected variant names and values (e.g. {"Size": "L", "Milk": "Oat"})';
