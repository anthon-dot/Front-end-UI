// Backend API URL: prefers explicit VITE_BACKEND_URL.
// Disallows Supabase Edge Functions (/functions/v1) from being treated as the REST backend baseURL
// to prevent browser CORS preflight failures on unmapped edge routes.
const rawBackend = import.meta.env.VITE_BACKEND_URL;
const rawApi = import.meta.env.VITE_API_URL;
const isSupabaseFunctions = (url) => typeof url === 'string' && (url.includes('/functions/v1') || url.includes('.supabase.co'));

export const API_BASE_URL =
  rawBackend ||
  (rawApi && !isSupabaseFunctions(rawApi) ? rawApi : '/api');

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const EDGE_FUNCTIONS_URL =
  (rawApi && isSupabaseFunctions(rawApi)) ? rawApi : 'https://uzykxxphunglcwojoqtf.supabase.co/functions/v1';

