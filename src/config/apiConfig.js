export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '/api'

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')
