-- Fix RLS policies to ensure admin can see all data

-- First, let's check if there are issues with the admin function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
$function$;

-- Update profiles policies to ensure admin can see all users
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
);

-- Ensure admin can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
);

-- Fix channels policies
DROP POLICY IF EXISTS "Admins can view all channels" ON public.channels;
CREATE POLICY "Admins can view all channels" ON public.channels
FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
);

-- Fix shorts policies  
DROP POLICY IF EXISTS "Admins can view all shorts" ON public.shorts;
CREATE POLICY "Admins can view all shorts" ON public.shorts
FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
);

-- Fix withdrawals policies
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
FOR ALL USING (
  (auth.uid() = user_id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
);

-- Add IFSC code column to withdrawals table
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS ifsc_code text;