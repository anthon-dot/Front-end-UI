import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
})

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('role')
      localStorage.removeItem('userId')
      localStorage.removeItem('stakeholderId')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Unable to connect to the server'

    const normalizedError = new Error(message)
    normalizedError.response = error.response

    return Promise.reject(normalizedError)
  }
)

export default api
