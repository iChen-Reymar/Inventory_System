-- ============================================
-- IMMEDIATE FIX: Create Missing Profiles
-- ============================================
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Create profiles for all users who have sales but no profile
INSERT INTO profiles (id, full_name, email, role, wallet_balance)
SELECT DISTINCT
    s.user_id,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.email,
        'Customer ' || SUBSTRING(s.user_id::text, 1, 8)
    ) as full_name,
    COALESCE(au.email, 'customer@example.com') as email,
    'customer' as role,
    0.00 as wallet_balance
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
LEFT JOIN auth.users au ON s.user_id = au.id
WHERE p.id IS NULL
  AND s.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Update existing profiles that have NULL or empty full_name
UPDATE profiles
SET full_name = COALESCE(
    NULLIF(full_name, ''),
    email,
    'Customer ' || SUBSTRING(id::text, 1, 8)
)
WHERE full_name IS NULL OR full_name = '';

-- Allow admins to view all profiles (RLS policy)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verify: Check how many profiles were created/updated
SELECT 
    'Total profiles' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Profiles with names' as metric,
    COUNT(*) as count
FROM profiles
WHERE full_name IS NOT NULL AND full_name != '';

-- ============================================
-- DONE! Now refresh your Admin Orders page
-- ============================================





