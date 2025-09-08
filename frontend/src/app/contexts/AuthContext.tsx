'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'tutor' | 'student';
  profilePicture?: string;
  bio?: string;
  timezone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  profession?: string;
  address?: string;
  isActive?: boolean;
  tutorExperience?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem('token');
    console.log('Looking for stored token on initial load');
    
    if (storedToken) {
      try {
        // Validate token and set user
        const decoded: any = jwtDecode(storedToken);
        console.log('Token decoded:', decoded);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp > currentTime) {
          console.log('Token is valid, expires at:', new Date(decoded.exp * 1000).toLocaleString());
          setToken(storedToken);
          // Fetch user data to get full profile
          fetchUserData(storedToken);
        } else {
          // Token expired
          console.log('Token expired, removing from storage');
          localStorage.removeItem('token');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      console.log('No token found in localStorage');
      setIsLoading(false);
    }
  }, []);

  const fetchUserData = async (authToken: string) => {
    try {
      console.log('Fetching user profile with token');
      // Let the interceptor add the token instead of adding it here
      const response = await api.get('/auth/profile');
      
      console.log('User profile fetched successfully:', response.data);
      setUser(response.data);
      
      // Also save user to localStorage for other components
      localStorage.setItem('user', JSON.stringify(response.data));
      console.log('User saved to localStorage with role:', response.data.role);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Clear token and user on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', { email });
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;

      console.log('Login successful, received token');
      
      // Store token in localStorage and state
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Decode token to get basic user data
      const decoded: any = jwtDecode(access_token);
      console.log('Token decoded, role:', decoded.role);
      
      // Fetch user data with the new token
      await fetchUserData(access_token);
      
      // All users go to dashboard regardless of role for now
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      // Determine which registration endpoint to use based on role
      const endpoint = userData.role === 'tutor' 
        ? '/auth/register/tutor' 
        : '/auth/register/student';
      
      console.log(`Registering user with endpoint: ${endpoint}`);
      const response = await api.post(endpoint, userData);
      
      // Check if the response has access_token (for consistency with login)
      // or token (old implementation)
      const newToken = response.data.access_token || response.data.token;
      
      if (!newToken) {
        console.error('No token received from registration!', response.data);
        throw new Error('Registration successful but no token received');
      }
      
      console.log('Registration successful, received token');
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Fetch user data with the new token
      await fetchUserData(newToken);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      
      // Transform date string to Date object if dateOfBirth is provided
      const transformedData = { ...userData };
      
      // Remove empty strings and null values to avoid validation issues
      Object.keys(transformedData).forEach(key => {
        const value = transformedData[key as keyof typeof transformedData];
        if (value === '' || value === null || value === undefined) {
          delete transformedData[key as keyof typeof transformedData];
        }
      });
      
      // Handle dateOfBirth: convert to proper ISO string format for backend
      if (transformedData.dateOfBirth && typeof transformedData.dateOfBirth === 'string') {
        // Only keep if it's a valid date string
        if (transformedData.dateOfBirth.trim() !== '') {
          // Ensure it's in ISO format for the backend
          const date = new Date(transformedData.dateOfBirth);
          if (!isNaN(date.getTime())) {
            transformedData.dateOfBirth = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          } else {
            delete transformedData.dateOfBirth;
          }
        } else {
          delete transformedData.dateOfBirth;
        }
      }
      
      console.log('Sending user update data:', transformedData);
      console.log('Data keys:', Object.keys(transformedData));
      
      const response = await api.patch(`/users/${user.id}`, transformedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Update local user state with the response data
      setUser(response.data);
      
      // Also update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};