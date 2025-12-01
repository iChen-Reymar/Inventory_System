-- ============================================
-- Create Missing Profiles for Users with Sales
-- ============================================
-- This script creates profiles for users who have sales but no profile

-- Step 1: Check which users have sales but no profiles
SELECT 
    s.user_id,
    COUNT(s.id) as sales_count,
    p.id as profile_exists
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.user_id IS NOT NULL
GROUP BY s.user_id, p.id
ORDER BY sales_count DESC;

-- Step 2: Create profiles for users who have sales but no profile
-- Get email from auth.users if available
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

-- Step 3: Update RLS policy to allow admins to view all profiles
-- First, drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 4: Verify the fix
SELECT 
    COUNT(DISTINCT s.user_id) as users_with_sales,
    COUNT(DISTINCT p.id) as users_with_profiles,
    COUNT(DISTINCT s.user_id) - COUNT(DISTINCT p.id) as missing_profiles
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE s.user_id IS NOT NULL;

-- Step 5: Show all profiles with their names
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- ============================================
-- END
-- ============================================

