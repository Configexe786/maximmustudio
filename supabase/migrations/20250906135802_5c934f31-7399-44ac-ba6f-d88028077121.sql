-- Add foreign key relationships to link tables properly
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.channels 
ADD CONSTRAINT channels_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shorts 
ADD CONSTRAINT shorts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.withdrawals 
ADD CONSTRAINT withdrawals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign keys for reviewed_by fields to reference auth.users
ALTER TABLE public.channels 
ADD CONSTRAINT channels_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.shorts 
ADD CONSTRAINT shorts_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.withdrawals 
ADD CONSTRAINT withdrawals_processed_by_fkey 
FOREIGN KEY (processed_by) REFERENCES auth.users(id) ON DELETE SET NULL;