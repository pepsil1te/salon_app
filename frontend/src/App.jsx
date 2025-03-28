import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeLanguageProvider } from './contexts/ThemeLanguageContext';
import AppRoutes from './Routes';
import { QUERY_CONFIG } from './config/app.config';

// Создаем экземпляр клиента для React Query с настройками против дублирования запросов
const queryClient = new QueryClient(QUERY_CONFIG);

/**
 * Главный компонент приложения
 * @returns {React.ReactNode}
 */
const App = () => {
  return (
    <BrowserRouter>
      <ThemeLanguageProvider>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeLanguageProvider>
    </BrowserRouter>
  );
};

export default App; 