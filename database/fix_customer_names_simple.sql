-- ============================================
-- Simple Fix for Customer Names
-- ============================================
-- Run this in Supabase SQL Editor to fix customer names

-- Step 1: Update profiles that have email but no full_name
UPDATE profiles
SET full_name = email
WHERE (full_name IS NULL OR full_name = '')
  AND email IS NOT NULL
  AND email != '';

-- Step 2: For profiles with neither full_name nor email, 
-- set a default based on the user ID
UPDATE profiles
SET full_name = 'Customer ' || SUBSTRING(id::text, 1, 8)
WHERE (full_name IS NULL OR full_name = '')
  AND (email IS NULL OR email = '');

-- Step 3: Verify the results
SELECT 
    id,
    full_name,
    email,
    role,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 'OK'
        ELSE 'NEEDS FIX'
    END as status
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- END
-- ============================================





