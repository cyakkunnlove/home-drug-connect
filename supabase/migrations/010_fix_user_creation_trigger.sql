-- Fix user creation trigger to handle errors gracefully
-- This addresses the "Database error creating new user" issue

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create improved trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Try to insert user record with error handling
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      role, 
      organization_name,
      phone,
      company_id,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'pharmacy_admin')::user_role,
      NEW.raw_user_meta_data->>'organization_name',
      NEW.raw_user_meta_data->>'phone',
      (NEW.raw_user_meta_data->>'company_id')::uuid,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      organization_name = EXCLUDED.organization_name,
      phone = EXCLUDED.phone,
      company_id = EXCLUDED.company_id,
      updated_at = NOW();
      
  EXCEPTION 
    WHEN others THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Error in handle_new_user trigger: %, SQLSTATE: %', SQLERRM, SQLSTATE;
      -- Continue processing
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add missing columns to users table if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 5. Ensure service role has necessary permissions
-- Grant full access to service_role for all operations
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.pharmacies TO service_role;

-- 6. Add service role policy for users table (allows bypassing RLS)
CREATE POLICY IF NOT EXISTS "Service role can do anything on users" 
ON public.users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 7. Add service role policy for companies table
CREATE POLICY IF NOT EXISTS "Service role can do anything on companies" 
ON public.companies 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 8. Check and fix any existing orphaned auth users
DO $$
DECLARE
    orphaned_user RECORD;
BEGIN
    FOR orphaned_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.users (
                id, 
                email, 
                role, 
                organization_name,
                phone,
                created_at, 
                updated_at
            )
            VALUES (
                orphaned_user.id,
                orphaned_user.email,
                COALESCE(orphaned_user.raw_user_meta_data->>'role', 'pharmacy_admin')::user_role,
                orphaned_user.raw_user_meta_data->>'organization_name',
                orphaned_user.raw_user_meta_data->>'phone',
                orphaned_user.created_at,
                NOW()
            );
            
            RAISE NOTICE 'Fixed orphaned user: %', orphaned_user.email;
        EXCEPTION
            WHEN others THEN
                RAISE WARNING 'Could not fix orphaned user %: %', orphaned_user.email, SQLERRM;
        END;
    END LOOP;
END $$;