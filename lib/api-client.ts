import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stock-management-server-q8zz.onrender.com/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Add a request interceptor to handle Auth headers
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('base44_access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh - backend returns new tokens in body
                const refresh_token_val = localStorage.getItem('base44_refresh_token');
                const response = await axios.post(
                    `${API_URL}/auth/refresh-token`,
                    { refresh_token: refresh_token_val },
                    { withCredentials: true }
                );

                const { access_token, refresh_token } = response.data;
                localStorage.setItem('base44_access_token', access_token);
                localStorage.setItem('base44_refresh_token', refresh_token);

                // Update auth header for retried request
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                // retry original request
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Refresh failed - logout
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('base44_currentUser');
                    localStorage.removeItem('base44_access_token');
                    localStorage.removeItem('base44_refresh_token');
                    // Only redirect if not already on login
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
