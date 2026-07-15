import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import 'leaflet/dist/leaflet.css'

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css'
import { archivedApplicants, archivedStalls } from './data/archiveSamples.js'
import axios from 'axios'

axios.interceptors.request.use((config) => {
    const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

axios.interceptors.response.use(
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

        return Promise.reject(error)
    }
)

const originalFetch = window.fetch.bind(window)

window.fetch = async (input, init = {}) => {
    const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken')

    const url =
        typeof input === 'string'
            ? input
            : input?.url || ''

    const isApiRequest =
        url.includes('localhost:8083/api') ||
        url.includes('127.0.0.1:8083/api') ||
        url.startsWith('/api')

    const headers =
        new Headers(init.headers || {})

    if (token && isApiRequest) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const response =
        await originalFetch(input, {
            ...init,
            headers
        })

    if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('authToken')
        localStorage.removeItem('role')
        localStorage.removeItem('userId')
        localStorage.removeItem('stakeholderId')

        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
    }

    return response
}

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

// Load sample archive data into localStorage if keys are not already present
try {
    if (!localStorage.getItem('ms_applications')) {
        localStorage.setItem('ms_applications', JSON.stringify(archivedApplicants))
    }
    if (!localStorage.getItem('ms_stalls')) {
        localStorage.setItem('ms_stalls', JSON.stringify(archivedStalls))
    }
} catch (e) {}

app.mount('#app');
