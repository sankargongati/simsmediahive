// --- CONFIGURATION ---
export const SUPABASE_URL = 'https://gswdqdsviqrzsoahxapc.supabase.co/';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2RxZHN2aXFyenNvYWh4YXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODM5NzcsImV4cCI6MjA3NjQ1OTk3N30.JFF6NFIdqZAE9ioHeMdfIVpN84UtN_Z0K2pZYodlpZY';
export const INVITE_USER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/invite-user`;
export const SUPABASE_ID = 'gswdqdsviqrzsoahxapc';
export const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_ID}`;
export const GALLERY_BUCKET = 'gallery-images';
export const BLOG_BUCKET = 'blog-images';
export const MEMBERS_BUCKET = 'member-images';

export const defaultPlaceholder = 'https://placehold.co/800x600/1c1917/f59e0b?text=MEDIA';
export const memberPlaceholder = 'https://placehold.co/200x200/292524/eab308?text=MEMBER';

// AI Configuration
export const DEEPSEEK_API_KEY = 'sk-3f0c4d1172444fcaa6f75063416a3f08'; // Replace with your actual DeepSeek API key
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // DeepSeek API endpoint
