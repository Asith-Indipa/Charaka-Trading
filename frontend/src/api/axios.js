//this file connect the frontend and backend
//A helper file is created to manage the backend API calls from the frontend in a standard + secure + reusable manner.


import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle global error cases (e.g. 401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // Optional: Logout user, redirect to login, etc.
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }

        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
        });

        return Promise.reject(error);
    }
);

export default api;
