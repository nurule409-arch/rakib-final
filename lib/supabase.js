import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const mediaUrl = (p) => supabase.storage.from('media').getPublicUrl(p).data.publicUrl;
export const CATEGORIES = {
  'ai-product-images': 'AI Product Images',
  'food-ads': 'Food Ads',
  'cinematic-video-ads': 'Cinematic AI Video Ads',
  'video-editing': 'Commercial Video Editing',
};
