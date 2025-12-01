-- ============================================
-- Fix Customer Names in Orders View
-- ============================================
-- This script helps identify and fix issues with customer names showing as "Unknown"

-- 1. Check which sales have missing profile data
SELECT 
    s.id as sale_id,
    s.user_id,
    s.created_at,
    p.full_name,
    p.email,
    CASE 
        WHEN p.id IS NULL THEN 'No Profile'
        WHEN p.full_name IS NULL OR p.full_name = '' THEN 'No Full Name'
        ELSE 'OK'
    END as status
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC;

-- 2. Update profiles that have NULL or empty full_name
-- First, try to get email from auth.users if profiles.email is missing
UPDATE profiles p
SET email = COALESCE(
  NULLIF(p.email, ''),
  (SELECT email FROM auth.users WHERE id = p.id LIMIT 1),
  'customer@example.com'
)
WHERE p.email IS NULL OR p.email = '';

-- Then, set full_name from email if full_name is missing
UPDATE profiles
SET full_name = COALESCE(
  NULLIF(full_name, ''),
  email,
  'Customer'
)
WHERE full_name IS NULL OR full_name = '';

-- 3. Create profiles for users who have sales but no profile
-- (This should rarely happen, but just in case)
INSERT INTO profiles (id, full_name, email, role, wallet_balance)
SELECT DISTINCT
    s.user_id,
    COALESCE(auth.users.email, 'User ' || SUBSTRING(s.user_id::text, 1, 8)),
    auth.users.email,
    'customer',
    0.00
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
LEFT JOIN auth.users ON s.user_id = auth.users.id
WHERE p.id IS NULL
  AND s.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 4. Verify the fix
SELECT 
    COUNT(*) as total_sales,
    COUNT(p.id) as sales_with_profiles,
    COUNT(CASE WHEN p.full_name IS NOT NULL AND p.full_name != '' THEN 1 END) as sales_with_names,
    COUNT(CASE WHEN p.full_name IS NULL OR p.full_name = '' THEN 1 END) as sales_without_names
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id;

-- ============================================
-- END OF SCRIPT
-- ============================================

