import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  const hasInitializedRef = useRef(false);
  
  // Check path to determine current page
  const isLoginPage = window.location.pathname === '/login';
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const isEmployeePage = window.location.pathname.startsWith('/employee');
  const isClientPage = window.location.pathname.startsWith('/client');
  
  // Check for mock data
  const hasMockData = !!localStorage.getItem('mockUser');
  
  // Only enable user profile query if we have a token and are not on login page
  // or if we're on a protected page that requires authentication
  const enableUserQuery = 
    !!localStorage.getItem('token') && 
    (!isLoginPage || isAdminPage || isEmployeePage || isClientPage);

  // User profile query
  const { 
    data: user, 
    isLoading, 
    error,
    isFetching,
    isRefetching
  } = useQuery(
    'userProfile',
    async () => {
      // If we have mock data, use it
      if (hasMockData) {
        console.log('Using mock user data for authentication');
        return JSON.parse(localStorage.getItem('mockUser'));
      }
      // Otherwise make a real API request
      return await authApi.getProfile();
    },
    {
      enabled: enableUserQuery,
      retry: false,
      staleTime: 300000, // 5 minutes - reduce unnecessary refetching
      onError: () => {
        // If request fails, log out (only if not in test mode)
        if (!hasMockData) {
          authApi.logout();
        }
      },
    }
  );

  // Profile update mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      // If we have mock data, simulate an update
      if (hasMockData) {
        const mockUser = JSON.parse(localStorage.getItem('mockUser'));
        const updatedUser = { ...mockUser, ...data };
        localStorage.setItem('mockUser', JSON.stringify(updatedUser));
        return updatedUser;
      } 
      // Otherwise make a real API request
      return await authApi.updateProfile(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('userProfile');
      },
    }
  );

  // Initialize Telegram WebApp
  const initTelegram = async (initData) => {
    try {
      await authApi.initTelegram(initData);
      setIsInitialized(true);
      queryClient.invalidateQueries('userProfile');
    } catch (error) {
      console.error('Failed to initialize Telegram:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear ALL storage for a clean slate
    localStorage.clear();
    // Call the auth API logout (which also clears token)
    authApi.logout();
    // Reset query cache
    queryClient.clear();
  };

  // This effect runs once after initial render to help debug auth state
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Log auth state for debugging - отключено
      // console.log('Auth state initialized:', { 
      //   hasMockData,
      //   hasToken: !!localStorage.getItem('token'), 
      //   isLoginPage, 
      //   isAdminPage, 
      //   isEmployeePage, 
      //   isClientPage
      // });
    }
  }, [hasMockData, isLoginPage, isAdminPage, isEmployeePage, isClientPage]);

  return {
    user,
    isLoading: isLoading || isFetching || isRefetching,
    error,
    isInitialized,
    initTelegram,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isLoading,
    logout,
  };
}; 