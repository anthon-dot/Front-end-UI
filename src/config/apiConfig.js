export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://uzykxxphunglcwojoqtf.supabase.co/functions/v1'

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
