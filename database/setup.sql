-- This file contains the complete database schema for the Coffee Shops CMS
-- Run these commands in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user');

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role DEFAULT 'user',
  role_id INTEGER REFERENCES public.roles(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES 
  ('super_admin', 'Super Administrator with full access', '{"all": true}'),
  ('admin', 'Administrator with limited access', '{"manage_users": true, "manage_content": true}'),
  ('user', 'Regular user with basic access', '{"view_content": true}')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Enable RLS on tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role = 'super_admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role IN ('super_admin', 'admin') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.user_profiles 
  WHERE user_id = user_uuid AND is_active = true;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for roles table
CREATE POLICY "Super admins can manage all roles" 
  ON public.roles FOR ALL 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view roles" 
  ON public.roles FOR SELECT 
  USING (public.is_admin(auth.uid()));

-- RLS Policies for user_profiles table
CREATE POLICY "Super admins can manage all user profiles" 
  ON public.user_profiles FOR ALL 
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view and update user profiles" 
  ON public.user_profiles FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update non-super-admin profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (
    public.is_admin(auth.uid()) AND 
    role != 'super_admin'
  );

CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (
    user_id = auth.uid() AND
    role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Trigger to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  default_role_id INTEGER;
BEGIN
  -- Get the default 'user' role id
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
  
  INSERT INTO public.user_profiles (
    user_id, 
    email, 
    full_name,
    role,
    role_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    default_role_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update function for timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at_roles
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();