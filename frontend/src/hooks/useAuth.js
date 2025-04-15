import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authApi } from '../api/auth';

const useAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  const hasInitializedRef = useRef(false);
  
  // Получаем данные о роли пользователя из токена
  const getUserRoleFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Токен имеет формат: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Декодируем payload
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      // Проверяем срок действия токена
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.warn('Токен истек, очищаем данные авторизации');
        localStorage.removeItem('token');
        return null;
      }
      
      return payload?.role || null;
    } catch (error) {
      console.error('Error parsing token:', error);
      // При ошибке разбора токена очищаем все данные авторизации
      localStorage.removeItem('token');
      return null;
    }
  };
  
  // Получаем текущую роль из токена - эта роль является окончательной
  const tokenRole = getUserRoleFromToken();
  
  // Check path to determine current page
  const isLoginPage = window.location.pathname === '/login';
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const isEmployeePage = window.location.pathname.startsWith('/employee');
  const isClientPage = window.location.pathname.startsWith('/client');
  const isPublicPage = !isLoginPage && !isAdminPage && !isEmployeePage && !isClientPage;
  
  // Only enable user profile query if we have a token
  const enableUserQuery = !!localStorage.getItem('token');

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
      // Если у нас есть токен, но нет role, выходим из системы
      if (tokenRole === null && !isLoginPage) {
        console.warn('No role found in token, logging out');
        removeToken();
        return null;
      }
      
      // Make a real API request
      try {
        const userData = await authApi.getProfile();
        
        // Проверяем токен на соответствие данным пользователя из API
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              
              // Проверяем и роль, и userId
              if ((payload.role && userData.role !== payload.role) || 
                  (payload.userId && userData.id !== payload.userId)) {
                console.error(`Критическое несоответствие данных API и токена: 
                  user.id=${userData.id}, token.userId=${payload.userId},
                  user.role=${userData.role}, token.role=${payload.role}`);
                
                // Полностью очищаем авторизацию и перенаправляем на страницу входа
                removeToken();
                window.location.href = '/login';
                return null;
              }
              
              // Проверяем соответствие роли в токене
              if (tokenRole && userData.role !== tokenRole) {
                console.warn(`Role mismatch detected: api.role=${userData.role}, token.role=${tokenRole}. Updating to token role.`);
                userData.role = tokenRole;
              }
            }
          }
        } catch (error) {
          console.error('Ошибка при проверке соответствия токена и данных пользователя из API:', error);
        }
        
        return userData;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error;
      }
    },
    {
      enabled: enableUserQuery,
      retry: false,
      staleTime: 300000, // 5 minutes - reduce unnecessary refetching
      onError: () => {
        // If request fails, log out
        removeToken();
      },
    }
  );

  // Profile update mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      // Make a real API request
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

  // Function to remove token and clear storage
  const removeToken = () => {
    localStorage.clear();
    window.location.href = '/';
  };
  
  // Logout function
  const logout = () => {
    // Clear ALL storage for a clean slate
    removeToken();
    // Reset query cache
    queryClient.clear();
  };

  // Проверка и исправление URL на основе роли пользователя
  useEffect(() => {
    // Запускаем перенаправление только если:
    // 1. У нас есть пользователь
    // 2. У пользователя есть роль
    // 3. Мы не находимся на странице логина
    // 4. Не происходит загрузка данных пользователя
    if (user && user.role && !isLoginPage && !isLoading && !isFetching) {
      const currentRole = user.role;
      const currentPath = window.location.pathname;
      
      // Определяем, находится ли пользователь на странице, несоответствующей его роли
      let isOnWrongPage = false;
      let correctPath = '/';
      
      switch (currentRole) {
        case 'admin':
          isOnWrongPage = isEmployeePage || isClientPage;
          correctPath = '/admin';
          break;
        case 'employee':
          isOnWrongPage = isAdminPage || isClientPage;
          correctPath = '/employee';
          break;
        case 'client':
          isOnWrongPage = isAdminPage || isEmployeePage;
          correctPath = '/';
          break;
        default:
          break;
      }
      
      // Перенаправляем только если пользователь на явно неправильной странице
      // Не перенаправляем с публичных страниц типа главной или страниц салонов
      if (isOnWrongPage) {
        console.warn(`User with role ${currentRole} is on incorrect page: ${currentPath}. Redirecting to ${correctPath}`);
        window.location.href = correctPath;
      }
    }
  }, [user, isLoginPage, isLoading, isFetching, isAdminPage, isEmployeePage, isClientPage]);

  // This effect runs once after initial render to help debug auth state
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Log auth state for debugging
      console.log('Auth state initialized:', { 
        hasToken: !!localStorage.getItem('token'), 
        tokenRole,
        user,
        isLoginPage, 
        isAdminPage, 
        isEmployeePage, 
        isClientPage,
        isPublicPage
      });
    }
  }, [isLoginPage, isAdminPage, isEmployeePage, isClientPage, isPublicPage, user, tokenRole]);

  return {
    user,
    isLoading: isLoading || isFetching || isRefetching,
    error,
    isInitialized,
    initTelegram,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isLoading,
    logout,
    removeToken,
    getUserRoleFromToken,
  };
};

export default useAuth; 