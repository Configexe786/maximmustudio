-- Fix infinite recursion in profiles RLS policies by creating security definer functions
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can view all shorts" ON public.shorts;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

-- Create security definer function to check if user is specific admin
CREATE OR REPLACE FUNCTION public.is_specific_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND email = 'tgmastergaming@gmail.com'
    AND is_admin = true
  );
$$;

-- Recreate admin policies using security definer functions
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can view all channels" ON public.channels
  FOR ALL USING (public.is_admin_user());

CREATE POLICY "Admins can view all shorts" ON public.shorts
  FOR ALL USING (public.is_admin_user());

-- Add earnings and wallet functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earnings DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0.00;

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 10.00),
  bank_account_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  routing_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID
);

-- Enable RLS on withdrawals table
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR ALL USING (public.is_admin_user());

-- Add earnings_per_view column to shorts for admin control
ALTER TABLE public.shorts ADD COLUMN IF NOT EXISTS earnings_per_view DECIMAL(10,4) DEFAULT 0.0001;

-- Create function to update user earnings when shorts views are updated
CREATE OR REPLACE FUNCTION public.update_user_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earnings_to_add DECIMAL(10,2);
  view_diff INTEGER;
BEGIN
  -- Calculate difference in views
  view_diff := COALESCE(NEW.views_count, 0) - COALESCE(OLD.views_count, 0);
  
  -- Only proceed if views increased and status is approved
  IF view_diff > 0 AND NEW.status = 'approved' THEN
    -- Calculate earnings to add
    earnings_to_add := view_diff * COALESCE(NEW.earnings_per_view, 0.0001);
    
    -- Update user earnings
    UPDATE public.profiles 
    SET 
      earnings = earnings + earnings_to_add,
      total_earnings = total_earnings + earnings_to_add
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating earnings
DROP TRIGGER IF EXISTS update_earnings_on_views_change ON public.shorts;
CREATE TRIGGER update_earnings_on_views_change
  AFTER UPDATE OF views_count ON public.shorts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_earnings();

-- Create specific admin user if not exists
INSERT INTO public.profiles (user_id, email, full_name, is_admin)
SELECT 
  auth.uid(),
  'tgmastergaming@gmail.com',
  'Max Immu Studio Admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'tgmastergaming@gmail.com'
) AND auth.email() = 'tgmastergaming@gmail.com';