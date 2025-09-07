-- Fix infinite recursion by using security definer functions
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all channels" ON public.channels;
DROP POLICY IF EXISTS "Admins can view all shorts" ON public.shorts;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$function$;

-- Recreate profiles policies using the security definer function
CREATE POLICY "Users can view own profile and admins can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id OR public.current_user_is_admin()
);

CREATE POLICY "Users can update own profile and admins can update all" ON public.profiles
FOR UPDATE USING (
  auth.uid() = user_id OR public.current_user_is_admin()
);

-- Recreate channels policies
CREATE POLICY "Users can view own channels and admins can view all" ON public.channels
FOR ALL USING (
  auth.uid() = user_id OR public.current_user_is_admin()
);

-- Recreate shorts policies
CREATE POLICY "Users can view own shorts and admins can view all" ON public.shorts
FOR ALL USING (
  auth.uid() = user_id OR public.current_user_is_admin()
);

-- Recreate withdrawals policies
CREATE POLICY "Users can view own withdrawals and admins can view all" ON public.withdrawals
FOR ALL USING (
  auth.uid() = user_id OR public.current_user_is_admin()
);