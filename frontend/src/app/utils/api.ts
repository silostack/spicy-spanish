'use client';

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Adding token to request:', config.url);
      } else {
        console.log('No token found for request:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Define types for auth responses
export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  timezone?: string;
  phoneNumber?: string;
}

// Auth services
export const authService = {
  testConnection: async () => {
    try {
      const response = await api.get('/auth/test');
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', error);
      throw error;
    }
  },
  login: async (email: string, password: string): Promise<LoginResponse> => {
    console.log(`Sending login request to: ${API_URL}/auth/login`);
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },
  
  registerStudent: async (data: RegisterData) => {
    console.log(`Sending registration request to: ${API_URL}/auth/register/student`);
    console.log('Registration data:', data);
    const response = await api.post('/auth/register/student', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

export default api;