import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stock-management-server-q8zz.onrender.com/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

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

            if (typeof window !== 'undefined') {
                try {
                    // Refresh token is in HttpOnly cookie, so we just make the request
                    await axios.post(
                        `${API_URL}/auth/refresh-token`,
                        null,
                        { withCredentials: true }
                    );

                    // retry original request
                    return apiClient(originalRequest);

                } catch (refreshError) {
                    // Refresh failed - logout
                    localStorage.removeItem('base44_currentUser');
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
