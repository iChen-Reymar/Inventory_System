/**
 * Get the full URL for a product image from Supabase Storage
 * @param {string} imagePath - The image path stored in the database
 * @returns {string} Full URL to the image or placeholder
 */
export function getProductImageUrl(imagePath) {
  if (!imagePath) {
    return '/placeholder.png'
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL is not set')
    return '/placeholder.png'
  }

  // Ensure the path doesn't already include the full URL
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Construct the full URL
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  const url = `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`
  
  return url
}

/**
 * Handle image load errors
 */
export function handleImageError(e) {
  // Replace with placeholder if image fails to load
  e.target.src = '/placeholder.png'
  e.target.onerror = null // Prevent infinite loop
}





