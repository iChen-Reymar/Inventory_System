# Quick Fix: Customer Names Not Showing

## Problem
All customers show as "Customer (No Profile)" in the Admin Orders view.

## Root Cause
Users who made purchases don't have profiles in the `profiles` table, or RLS policies are blocking admin access to profiles.

## Solution

### Step 1: Run This SQL Script

Go to **Supabase SQL Editor** and run:

**File: `database/create_missing_profiles.sql`**

This script will:
1. ✅ Create missing profiles for all users who have sales
2. ✅ Set their names from email or create a default name
3. ✅ Update RLS policies to allow admins to view all profiles
4. ✅ Verify the fix worked

### Step 2: Refresh the Page

After running the SQL:
1. Go back to your Admin Orders page
2. Refresh the browser
3. Customer names should now appear!

## What the SQL Does

```sql
-- Creates profiles for users with sales but no profile
INSERT INTO profiles (id, full_name, email, role, wallet_balance)
SELECT DISTINCT
    s.user_id,
    COALESCE(au.email, 'Customer ' || SUBSTRING(s.user_id::text, 1, 8)) as full_name,
    COALESCE(au.email, 'customer@example.com') as email,
    'customer' as role,
    0.00 as wallet_balance
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id
LEFT JOIN auth.users au ON s.user_id = au.id
WHERE p.id IS NULL
  AND s.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
```

## Verification

After running, check the results:

```sql
SELECT 
    COUNT(DISTINCT s.user_id) as users_with_sales,
    COUNT(DISTINCT p.id) as users_with_profiles
FROM sales s
LEFT JOIN profiles p ON s.user_id = p.id;
```

Both numbers should match!

## If Still Not Working

1. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

2. **Manually check profiles:**
   ```sql
   SELECT id, full_name, email FROM profiles LIMIT 10;
   ```

3. **Check browser console** for any errors when loading Admin Orders page

## Prevention

The registration process already creates profiles. This fix is only for existing data created before profiles were properly set up.

