# Fix Customer Names Showing as "User [ID]"

## Problem
Customer names are showing as "User 108e7cf8" instead of actual names in the Admin Orders view.

## Solution

### Quick Fix (Recommended)

Run this SQL script in your Supabase SQL Editor:

**File: `database/fix_customer_names_simple.sql`**

```sql
-- Update profiles that have email but no full_name
UPDATE profiles
SET full_name = email
WHERE (full_name IS NULL OR full_name = '')
  AND email IS NOT NULL
  AND email != '';

-- For profiles with neither full_name nor email, set a default
UPDATE profiles
SET full_name = 'Customer ' || SUBSTRING(id::text, 1, 8)
WHERE (full_name IS NULL OR full_name = '')
  AND (email IS NULL OR email = '');
```

### Complete Fix (With Trigger)

For a more permanent solution that prevents this issue in the future:

**File: `database/ensure_customer_names.sql`**

This script:
1. Fixes all existing profiles
2. Creates a database trigger to automatically set `full_name` when profiles are created/updated

## Steps to Fix

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on "SQL Editor"

2. **Run the SQL Script**
   - Copy the contents of `database/fix_customer_names_simple.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify the Fix**
   - Check the results in the SQL output
   - Refresh your Admin Orders page
   - Customer names should now display correctly

## What Changed in Code

The display logic now:
- Shows `full_name` if available
- Falls back to `email` if `full_name` is missing
- Shows "Customer (No Profile)" if profile doesn't exist
- Never shows user IDs anymore

## Prevention

The trigger in `ensure_customer_names.sql` will automatically:
- Set `full_name` from `email` when a profile is created without a name
- Ensure all future profiles always have a name

## Verification

After running the SQL, verify with:

```sql
SELECT 
    id,
    full_name,
    email,
    CASE 
        WHEN full_name IS NOT NULL AND full_name != '' THEN 'OK'
        ELSE 'NEEDS FIX'
    END as status
FROM profiles
ORDER BY created_at DESC;
```

All profiles should show "OK" status.

