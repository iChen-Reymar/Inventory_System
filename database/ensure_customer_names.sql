-- ============================================
-- Ensure Customer Names Are Always Set
-- ============================================
-- This script fixes existing data and adds a trigger to prevent future issues

-- 1. Fix existing profiles without full_name
UPDATE profiles
SET full_name = COALESCE(
  NULLIF(full_name, ''),
  email,
  'Customer ' || SUBSTRING(id::text, 1, 8)
)
WHERE full_name IS NULL OR full_name = '';

-- 2. Create a function to automatically set full_name if missing
CREATE OR REPLACE FUNCTION ensure_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If full_name is NULL or empty, set it from email or a default
  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    NEW.full_name := COALESCE(
      NULLIF(NEW.email, ''),
      'Customer ' || SUBSTRING(NEW.id::text, 1, 8)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to run before INSERT or UPDATE on profiles
DROP TRIGGER IF EXISTS trigger_ensure_full_name ON profiles;
CREATE TRIGGER trigger_ensure_full_name
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_full_name();

-- 4. Verify the fix
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as profiles_with_names,
    COUNT(CASE WHEN full_name IS NULL OR full_name = '' THEN 1 END) as profiles_without_names
FROM profiles;

-- ============================================
-- END
-- ============================================





