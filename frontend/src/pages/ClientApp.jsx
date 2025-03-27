import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Paper, Avatar, Snackbar, Alert } from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

const ClientApp = () => {
  const { user, isLoading, logout } = useAuthContext();
  const [userData, setUserData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Получаем данные пользователя из контекста или из localStorage
  useEffect(() => {
    if (user) {
      setUserData(user);
    } else if (localStorage.getItem('mockUser')) {
      setUserData(JSON.parse(localStorage.getItem('mockUser')));
    }
  }, [user]);

  // Закрытие уведомления
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (isLoading && !userData) {
    return <LoadingScreen message="Загрузка профиля..." />;
  }

  return (
    <Container maxWidth="sm" className="telegram-app">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Salon Booking
        </Typography>
        
        {userData ? (
          <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}
              >
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {userData.name || 'Пользователь'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userData.role === 'client' ? 'Клиент' : 
                   userData.role === 'employee' ? 'Сотрудник' : 'Администратор'}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body1" paragraph>
              Добро пожаловать в систему бронирования салонов красоты!
            </Typography>
            
            {userData.role === 'client' && (
              <Typography variant="body2" paragraph>
                Здесь вы сможете просматривать салоны, выбирать услуги и записываться на прием.
              </Typography>
            )}
            
            <Button 
              variant="outlined" 
              color="secondary" 
              sx={{ mt: 2 }}
              onClick={logout}
            >
              Выйти
            </Button>
          </Paper>
        ) : (
          <Typography variant="body1">
            Пожалуйста, авторизуйтесь для продолжения.
          </Typography>
        )}
      </Box>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClientApp; 