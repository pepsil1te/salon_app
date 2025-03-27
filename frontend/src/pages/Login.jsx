import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  CircularProgress, 
  Button, 
  TextField, 
  Paper,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { authApi } from '../api/auth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation } from 'react-query';

// Валидация номера телефона
const isValidPhoneNumber = (phone) => {
  // Проверка на соответствие любому из форматов российского номера
  // Принимает форматы:
  // +79991234567, +7 999 123-45-67, +7(999)123-45-67, 89991234567 и т.д.
  const formattedPhone = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+7|7|8)\d{10}$/.test(formattedPhone);
};

// Нормализация номера телефона к формату +7XXXXXXXXXX
const normalizePhoneNumber = (phone) => {
  // Удаляем все не цифры кроме +
  let digits = phone.replace(/[^\d+]/g, '');
  
  // Если номер начинается с 8, заменяем на +7
  if (digits.startsWith('8')) {
    digits = '+7' + digits.substring(1);
  }
  
  // Если номер начинается с 7, но без +, добавляем +
  if (digits.startsWith('7') && !digits.startsWith('+')) {
    digits = '+' + digits;
  }
  
  return digits;
};

const Login = () => {
  const { user, isLoading: isAuthLoading } = useAuthContext();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: null,
    role: 'client' // Всегда клиент, так как сотрудников добавляет администратор
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Очистка существующих данных входа при прямой загрузке страницы входа
  useEffect(() => {
    if (window.location.pathname === '/login') {
      if (localStorage.getItem('token')) {
        console.log('Очистка предыдущих данных аутентификации');
        localStorage.clear();
        queryClient.clear();
      }
    }
  }, [queryClient]);

  // Перенаправление при успешной аутентификации
  useEffect(() => {
    if (user && !isRedirecting && !isAuthLoading) {
      console.log('Пользователь аутентифицирован через эффект, перенаправление:', user);
      setIsRedirecting(true);
      
      // Используем navigate вместо window.location
      let redirectPath;
      if (user.role === 'admin') {
        redirectPath = '/admin';
      } else if (user.role === 'employee') {
        redirectPath = '/employee';
      } else if (user.role === 'client') {
        // Клиентов перенаправляем на главную страницу с салонами
        redirectPath = '/';
      } else {
        redirectPath = '/';
      }
      
      // Используем navigate для SPA-навигации
      setTimeout(() => {
        navigate(redirectPath);
      }, 100);
    }
  }, [user, isAuthLoading, isRedirecting, navigate]);

  // Мутация для входа по телефону
  const phoneLoginMutation = useMutation(authApi.phoneLogin, {
    onSuccess: (data) => {
      if (data.exists === false) {
        // Если пользователь не найден, перейти к шагу регистрации
        setActiveStep(1);
      } else {
        // Установить данные пользователя напрямую в кэш
        // Это вызовет немедленное обновление состояния user
        if (data.user && data.token) {
          console.log('Авторизация успешна, устанавливаем пользователя:', data.user);
          
          // Токен устанавливается в auth.js, здесь не дублируем
          
          // Устанавливаем данные пользователя в кэш
          queryClient.setQueryData('userProfile', data.user);
          
          // Инициируем перенаправление
          setIsRedirecting(true);
          
          // Определяем путь редиректа
          let redirectPath;
          if (data.user.role === 'admin') {
            redirectPath = '/admin';
          } else if (data.user.role === 'employee') {
            redirectPath = '/employee';
          } else { 
            // Клиентов редиректим на главную
            redirectPath = '/';
          }
          
          // Используем navigate вместо window.location для SPA-навигации
          // (без перезагрузки страницы)
          setTimeout(() => {
            navigate(redirectPath);
          }, 100);
        } else {
          // Если по какой-то причине user или token отсутствуют
          // Инвалидируем кэш для перезапроса
          queryClient.invalidateQueries('userProfile');
        }
      }
    },
    onError: (error) => {
      setError(error.message || 'Ошибка при попытке входа. Пожалуйста, попробуйте снова.');
    }
  });

  // Мутация для регистрации
  const registerMutation = useMutation(authApi.register, {
    onSuccess: (data) => {
      // Установить данные пользователя напрямую в кэш
      if (data.user && data.token) {
        console.log('Регистрация успешна, устанавливаем пользователя:', data.user);
        
        // Токен устанавливается в auth.js, здесь не дублируем
        
        // Устанавливаем данные пользователя в кэш
        queryClient.setQueryData('userProfile', data.user);
        
        // Инициируем перенаправление
        setIsRedirecting(true);
        
        // Для клиентов всегда редиректим на главную
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        // Инвалидируем кэш для перезапроса
        queryClient.invalidateQueries('userProfile');
      }
    },
    onError: (error) => {
      setError(error.message || 'Ошибка при регистрации. Пожалуйста, попробуйте снова.');
    }
  });

  // Обработчик отправки формы телефона
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidPhoneNumber(phone)) {
      setError('Пожалуйста, введите корректный российский номер телефона');
      return;
    }

    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Проверка на специальный номер для админа
    if (normalizedPhone === '+79999999999') {
      // Создаем фиктивного пользователя-администратора
      console.log('Администратор: вход с номером +79999999999');
      const mockAdminData = {
        id: 999,
        role: 'admin',
        name: 'Администратор',
        phoneNumber: normalizedPhone
      };
      
      // Функция для корректного Base64 кодирования с поддержкой UTF-8
      const base64UrlEncode = (str) => {
        // Сначала преобразуем строку в URL-safe base64
        const base64 = window.btoa(unescape(encodeURIComponent(str)));
        // Затем заменяем символы для соответствия формату JWT (base64url)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      };
      
      // Создаем правильный JWT токен вместо простой строки
      // JWT структура: header.payload.signature
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = base64UrlEncode(JSON.stringify({ 
        userId: 999, 
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 дней
      }));
      const signature = base64UrlEncode('mock-signature'); // В реальности должна быть настоящая подпись
      
      // Формируем JWT токен
      const token = `${header}.${payload}.${signature}`;
      
      localStorage.setItem('token', token);
      localStorage.setItem('mockUser', JSON.stringify(mockAdminData));
      queryClient.setQueryData('userProfile', mockAdminData);
      
      // Запускаем индикатор загрузки
      setIsRedirecting(true);
      
      // Используем navigate для SPA-навигации
      setTimeout(() => {
        navigate('/admin');
      }, 100);
      
      return;
    }

    // Отладочный лог для проверки вызова API
    console.log('Вызываем API phoneLogin с номером:', normalizedPhone);
    
    // Вызываем API с нормализованным номером
    phoneLoginMutation.mutate(normalizedPhone);
  };

  // Обработчик отправки формы регистрации
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!userData.firstName || !userData.lastName) {
      setError('Пожалуйста, заполните имя и фамилию');
      return;
    }

    if (!userData.email) {
      setError('Пожалуйста, укажите электронную почту');
      return;
    }

    if (!userData.birthDate) {
      setError('Пожалуйста, укажите дату рождения');
      return;
    }

    // Собираем данные для регистрации
    const newUser = {
      phoneNumber: phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      birthDate: userData.birthDate.toISOString().split('T')[0],
      role: 'client' // Всегда регистрируем как клиентов
    };

    registerMutation.mutate(newUser);
  };

  // Обработчик возврата на шаг ввода телефона
  const handleBackToPhone = () => {
    setActiveStep(0);
    setError('');
  };

  // Обработчик возврата на главную страницу
  const handleBackToMain = () => {
    navigate('/');
  };

  // Показываем индикатор загрузки во время загрузки/перенаправления
  if (isAuthLoading || isRedirecting || phoneLoginMutation.isLoading || registerMutation.isLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom align="center">
            {isRedirecting ? 'Перенаправление...' : 'Загрузка...'}
          </Typography>
          <CircularProgress sx={{ mt: 4 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <IconButton sx={{ alignSelf: 'flex-start', mb: 2 }} onClick={handleBackToMain}>
          <ArrowBackIcon /> 
        </IconButton>
        
        <Typography component="h1" variant="h4" gutterBottom>
          Beauty Salon
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 3, width: '100%' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Вход</StepLabel>
            </Step>
            <Step>
              <StepLabel>Регистрация</StepLabel>
            </Step>
          </Stepper>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {activeStep === 0 ? (
            // Шаг 1: Ввод номера телефона
            <form onSubmit={handlePhoneSubmit}>
              <Typography variant="h6" gutterBottom>
                Вход или регистрация
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Введите номер телефона для входа или регистрации
              </Typography>
              
              <TextField
                label="Номер телефона"
                fullWidth
                margin="normal"
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7XXXXXXXXXX"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      📱
                    </InputAdornment>
                  ),
                }}
                helperText="Например: +79031234567"
              />
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                type="submit"
              >
                Продолжить
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  * Для входа администратором используйте номер +79999999999
                </Typography>
              </Box>
            </form>
          ) : (
            // Шаг 2: Регистрация нового пользователя
            <form onSubmit={handleRegisterSubmit}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handleBackToPhone}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">
                  Регистрация
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Заполните данные для создания аккаунта
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Имя"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    value={userData.firstName}
                    onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Фамилия"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    value={userData.lastName}
                    onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                    required
                  />
                </Grid>
              </Grid>
              
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                variant="outlined"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                required
              />
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <DatePicker
                  label="Дата рождения"
                  value={userData.birthDate}
                  onChange={(newValue) => setUserData({...userData, birthDate: newValue})}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      required: true
                    }
                  }}
                />
              </Box>
              
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                type="submit"
              >
                Зарегистрироваться
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 