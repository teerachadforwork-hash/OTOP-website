import axios from 'axios';

const api = axios.create({
  baseURL: 'https://otop-website-api-hujf.onrender.com',
});

api.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.startsWith('/api') && !config.url.startsWith('http')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
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
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto logout if 401 response returned from api
      localStorage.removeItem('token');
      localStorage.removeItem('otop_current_user_email');
      // If we are not already on the home page, redirect or reload
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
