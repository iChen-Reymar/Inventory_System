# Troubleshooting Image Loading Issues

## Error: 400 Bad Request when loading images

If you're seeing this error:
```
Failed to load resource: the server responded with a status of 400
pzyzoxahuaorwuswfwav.supabase.co/storage/v1/object/product-images/...
```

## Common Causes & Solutions

### 1. Storage Bucket Doesn't Exist
**Solution:** Create the bucket in Supabase
1. Go to Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Name it: `product-images`
4. Make it **Public**
5. Click "Create bucket"

### 2. Bucket is Not Public
**Solution:** Make the bucket public
1. Go to Storage → `product-images` bucket
2. Click "Settings"
3. Ensure "Public bucket" is enabled

### 3. Missing Storage Policies
**Solution:** Add storage policies (run in SQL Editor)
```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

### 4. Wrong URL Format
**Correct URL format:**
```
https://[project-id].supabase.co/storage/v1/object/public/product-images/[filename]
```

**Check:**
- URL includes `/public/` in the path
- Bucket name is `product-images`
- Filename matches what's stored in database

### 5. Environment Variable Missing
**Solution:** Check your `.env` file
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

Make sure:
- No trailing slash
- Includes `https://`
- Matches your Supabase project URL

### 6. Image Path in Database
**Check the database:**
- `image_path` should only contain the filename (e.g., `1764433774095_pi05pd.jpg`)
- Should NOT include the full URL
- Should NOT include `/product-images/` prefix

## Quick Test

1. **Check if bucket exists:**
   - Go to Supabase Dashboard → Storage
   - You should see `product-images` bucket

2. **Test URL manually:**
   - Try accessing: `https://[your-project].supabase.co/storage/v1/object/public/product-images/[filename]`
   - Should load the image in browser

3. **Check browser console:**
   - Look for exact error message
   - Check Network tab for failed requests

## Still Not Working?

1. Delete the bucket and recreate it
2. Re-upload images through the form
3. Check Supabase logs for errors
4. Verify your Supabase project URL is correct





