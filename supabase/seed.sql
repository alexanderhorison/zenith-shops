-- Seed Data

-- 1. Ensure 'customer' role exists (idempotent check)
INSERT INTO roles (name, description) VALUES ('customer', 'Regular customer') ON CONFLICT (name) DO NOTHING;

-- We need to fetch role IDs to use them
DO $$
DECLARE
  v_customer_role_id INTEGER;
  v_product_1_id INTEGER;
  v_product_2_id INTEGER;
  v_user_1_id UUID := '00000000-0000-0000-0000-000000000001'; -- Dummy UUIDs for seed
  v_user_2_id UUID := '00000000-0000-0000-0000-000000000002';
  v_order_id INTEGER;
BEGIN
  -- Get Role ID
  SELECT id INTO v_customer_role_id FROM roles WHERE name = 'customer';

  -- Create dummy auth users (This usually requires direct access to auth schema or enabled webhooks)
  -- FOR LOCAL SEEDING ONLY: We insert into auth.users directly if possible, or skip if restricted.
  -- Supabase `seed.sql` runs as superuser, so usually it can write to auth.users.
  
  -- Insert User 1
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_user_1_id,
    'alice@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Alice Johnson"}',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert Customer Profile 1 (Alice)
  INSERT INTO public.customers (id, email, full_name, dob, is_active)
  VALUES (
    v_user_1_id,
    'alice@example.com',
    'Alice Johnson',
    '1990-05-15',
    true
  ) ON CONFLICT (id) DO NOTHING;


  -- Insert User 2
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_user_2_id,
    'bob@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Bob Smith"}',
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert Customer Profile 2 (Bob)
  INSERT INTO public.customers (id, email, full_name, dob, is_active)
  VALUES (
    v_user_2_id,
    'bob@example.com',
    'Bob Smith',
    '1985-11-23',
    true
  ) ON CONFLICT (id) DO NOTHING;


  -- Create some Products if not exists (relying on existing migrations or creating dummy ones)
  INSERT INTO products (name, description, price, stock, is_active)
  VALUES 
  ('Espresso', 'Strong coffee', 3.50, 100, true),
  ('Latte', 'Milky coffee', 4.50, 100, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_product_1_id FROM products WHERE name = 'Espresso' LIMIT 1;
  SELECT id INTO v_product_2_id FROM products WHERE name = 'Latte' LIMIT 1;

  -- Create Orders for Alice
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (v_user_1_id, 8.00, 'completed')
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES 
  (v_order_id, v_product_1_id, 1, 3.50),
  (v_order_id, v_product_2_id, 1, 4.50);

  -- Create Orders for Bob
   INSERT INTO orders (user_id, total_amount, status)
  VALUES (v_user_2_id, 9.00, 'completed')
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, quantity, unit_price)
  VALUES 
  (v_order_id, v_product_2_id, 2, 4.50);

END $$;
