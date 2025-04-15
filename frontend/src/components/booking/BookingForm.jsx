import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  CardHeader,
  Grid,
  Divider,
  CircularProgress,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  List,
  ListItem,
  ListItemText,
  Alert,
  Chip,
  Avatar,
  Rating,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { serviceApi } from '../../api/services';
import { employeeApi } from '../../api/employees';
import { appointmentApi } from '../../api/appointments';
import { useAuthContext } from '../../contexts/AuthContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay, isAfter, addDays, isValid } from 'date-fns';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = [
  { label: 'Выбор даты', description: 'Выберите удобную дату для записи' },
  { label: 'Выбор мастера', description: 'Выберите специалиста' },
  { label: 'Выбор времени', description: 'Выберите удобное время' },
  { label: 'Подтверждение', description: 'Подтвердите ваше бронирование' },
];

const BookingForm = () => {
  const { salonId, serviceId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isLoadingAuth } = useAuthContext();
  
  // Отладка: проверяем параметры URL и пользователя
  console.log('🔍 BookingForm загружен:', { 
    salonId, 
    serviceId,
    user, 
    pathname: window.location.pathname
  });
  
  // Если пользователь не авторизован или не является клиентом, перенаправляем на страницу входа
  useEffect(() => {
    if (!isLoadingAuth && (!user || user.role !== 'client')) {
      console.log('⚠️ Доступ запрещен, перенаправление на страницу входа');
      navigate('/login');
    }
  }, [user, isLoadingAuth, navigate]);
  
  // Если идет загрузка данных пользователя, показываем индикатор загрузки
  if (isLoadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Проверка авторизации...
        </Typography>
      </Box>
    );
  }
  
  // Если пользователь не авторизован или не клиент, не отображаем содержимое
  if (!user || user.role !== 'client') {
    return null; // Будет перенаправлено в useEffect
  }
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Загрузка информации об услуге
  const { 
    data: service, 
    isLoading: isLoadingService,
    error: serviceError
  } = useQuery(['service', serviceId], () => serviceApi.getById(serviceId));

  // Загрузка списка сотрудников, предоставляющих услугу
  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError
  } = useQuery(
    ['serviceEmployees', serviceId], 
    async () => {
      if (service && service.employee_ids) {
        const employeePromises = service.employee_ids.map(id => 
          employeeApi.getById(id)
        );
        return Promise.all(employeePromises);
      }
      return [];
    },
    {
      enabled: !!service && !!service.employee_ids
    }
  );

  // Загрузка доступных слотов времени
  const {
    data: availability,
    isLoading: isLoadingAvailability,
    error: availabilityError,
    refetch: refetchAvailability
  } = useQuery(
    ['serviceAvailability', serviceId, selectedEmployee?.id, selectedDate],
    () => serviceApi.getAvailability(
      serviceId, 
      selectedEmployee.id, 
      format(selectedDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!selectedEmployee && isValid(selectedDate)
    }
  );

  // Мутация для создания записи
  const bookAppointmentMutation = useMutation(
    (appointmentData) => appointmentApi.create(appointmentData),
    {
      onSuccess: () => {
        setBookingComplete(true);
        setActiveStep(steps.length);
      },
      onError: (error) => {
        setBookingError(error.message || 'Ошибка при создании записи');
      }
    }
  );

  // Обработчики навигации по шагам
  const handleNext = () => {
    if (activeStep === 1 && selectedEmployee) {
      refetchAvailability();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Обработчик подтверждения записи
  const handleConfirmBooking = () => {
    if (!selectedTime || !selectedEmployee || !service || !salonId) {
      setBookingError('Не все данные для записи выбраны');
      return;
    }

    const appointmentData = {
      service_id: parseInt(serviceId),
      employee_id: selectedEmployee.id,
      salon_id: parseInt(salonId),
      date_time: selectedTime,
      notes: note
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  // Обновление списка доступных мастеров при изменении выбранной услуги
  useEffect(() => {
    if (service && service.employee_ids && service.employee_ids.length > 0) {
      // Сбрасываем выбранного мастера при изменении услуги
      setSelectedEmployee(null);
    }
  }, [service]);

  // Обработчик завершения бронирования
  const handleFinish = () => {
    // Направляем пользователя на страницу с его записями в клиентском приложении
    console.log('✅ Перенаправление после бронирования');
    
    if (user && user.role === 'client') {
      navigate('/client/appointments');
    } else {
      // Если по какой-то причине пользователь больше не авторизован как клиент
      navigate('/');
    }
  };

  // Используем тестовые данные для услуги, если API не вернуло результаты
  const serviceData = service || {
    id: serviceId,
    name: 'Женская стрижка',
    duration: 60,
    price: 1500,
    category: 'Волосы',
    description: 'Женская стрижка любой сложности',
    employee_ids: [1, 2],
    employee_names: ['Анна Иванова', 'Елена Петрова']
  };

  // Используем тестовые данные для сотрудников, если API не вернуло результаты
  const employeeList = employees || [
    {
      id: 1,
      name: 'Анна Иванова',
      role: 'employee',
      contact_info: { phone: '+7 (999) 123-45-67' },
      working_hours: {
        1: { start: '09:00', end: '18:00' },
        2: { start: '09:00', end: '18:00' },
        3: { start: '09:00', end: '18:00' },
        4: { start: '09:00', end: '18:00' },
        5: { start: '09:00', end: '18:00' }
      }
    },
    {
      id: 2,
      name: 'Елена Петрова',
      role: 'employee',
      contact_info: { phone: '+7 (999) 765-43-21' },
      working_hours: {
        1: { start: '12:00', end: '21:00' },
        2: { start: '12:00', end: '21:00' },
        3: { start: '12:00', end: '21:00' },
        4: { start: '12:00', end: '21:00' },
        5: { start: '12:00', end: '21:00' }
      }
    }
  ];

  // Используем тестовые данные для доступных слотов времени
  const availableSlots = availability?.available_slots || [
    '2025-03-25T10:00:00Z',
    '2025-03-25T11:00:00Z',
    '2025-03-25T13:00:00Z',
    '2025-03-25T14:00:00Z',
    '2025-03-25T16:00:00Z'
  ].map(slot => new Date(slot));

  // Определение доступности кнопки "Далее" для каждого шага
  const getStepNextButtonDisabled = (step) => {
    switch (step) {
      case 0: // Выбор даты
        return !selectedDate || !isValid(selectedDate) || 
          isSameDay(selectedDate, new Date()) || 
          !isAfter(selectedDate, new Date());
      case 1: // Выбор мастера
        return !selectedEmployee;
      case 2: // Выбор времени
        return !selectedTime;
      case 3: // Подтверждение
        return bookAppointmentMutation.isLoading;
      default:
        return false;
    }
  };

  if (isLoadingService) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (serviceError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Ошибка при загрузке информации об услуге: {serviceError.message}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => navigate(-1)}>
            Вернуться назад
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Button 
        sx={{ mb: 2 }}
        onClick={() => navigate(-1)}
        startIcon={<Box sx={{ mr: -0.5, transform: 'rotate(180deg)' }}>→</Box>}
      >
        Назад
      </Button>
      
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Бронирование услуги" 
          subheader={`Салон: ${serviceData.salon_name || 'Салон красоты'}`}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6">
                {serviceData.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Длительность: {serviceData.duration} мин.
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                Стоимость: {serviceData.price} ₽
              </Typography>
              {serviceData.description && (
                <Typography variant="body2">
                  {serviceData.description}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={8}>
              {bookingComplete ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    Запись успешно создана!
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Ваша запись на {selectedTime && format(new Date(selectedTime), 'dd.MM.yyyy в HH:mm')} успешно создана.
                    Мастер {selectedEmployee?.name} будет ждать вас в указанное время.
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleFinish}
                    sx={{ mt: 2 }}
                  >
                    Перейти к моим записям
                  </Button>
                </Paper>
              ) : (
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label}>
                      <StepLabel>
                        <Typography variant="subtitle1">{step.label}</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {step.description}
                        </Typography>
                        
                        {index === 0 && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            <LocalizationProvider 
                              dateAdapter={AdapterDateFns}
                              adapterLocale={ruLocale}
                            >
                              <Box sx={{ mb: 2 }}>
                                <DatePicker 
                                  label="Выберите дату"
                                  value={selectedDate}
                                  onChange={setSelectedDate}
                                  disablePast
                                  renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                              </Box>
                              
                              {/* Отображение следующих 7 дней для быстрого выбора */}
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Быстрый выбор даты:
                              </Typography>
                              <Box 
                                sx={{ 
                                  display: 'flex', 
                                  gap: 1,
                                  flexWrap: 'wrap',
                                  justifyContent: 'center' 
                                }}
                              >
                                {Array.from({ length: 7 }, (_, i) => {
                                  const date = addDays(new Date(), i + 1);
                                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                                  
                                  // Определяем загруженность дня (пример логики)
                                  const dayOfWeek = date.getDay();
                                  let busyness = 'low'; // low, medium, high
                                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                                    busyness = 'high'; // выходные загружены сильнее
                                  } else if (dayOfWeek === 5) {
                                    busyness = 'medium'; // пятница загружена средне
                                  }
                                  
                                  // Определяем цвет индикатора загруженности
                                  const busynessColor = {
                                    low: 'success.main',
                                    medium: 'warning.main',
                                    high: 'error.main'
                                  }[busyness];
                                  
                                  // Определяем текст подсказки
                                  const busynessText = {
                                    low: 'Свободно',
                                    medium: 'Средняя загруженность',
                                    high: 'Высокая загруженность'
                                  }[busyness];
                                  
                                  return (
                                    <Paper
                                      key={i}
                                      elevation={isSelected ? 3 : 1}
                                      sx={{
                                        p: 1,
                                        width: { xs: 'calc(25% - 8px)', sm: 'calc(14.28% - 8px)' },
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        border: isSelected ? '2px solid' : '1px solid',
                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                        bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                          borderColor: 'primary.main',
                                          bgcolor: 'primary.lighter',
                                          transform: 'translateY(-2px)'
                                        }
                                      }}
                                      onClick={() => setSelectedDate(date)}
                                    >
                                      <Typography 
                                        variant="caption" 
                                        sx={{ fontWeight: 500, textTransform: 'uppercase' }}
                                      >
                                        {format(date, 'EEE', { locale: ruLocale })}
                                      </Typography>
                                      <Typography 
                                        variant="h6" 
                                        sx={{ 
                                          fontWeight: isSelected ? 600 : 400,
                                          color: isSelected ? 'primary.main' : 'text.primary'
                                        }}
                                      >
                                        {format(date, 'd')}
                                      </Typography>
                                      <Typography variant="caption">
                                        {format(date, 'MMM', { locale: ruLocale })}
                                      </Typography>
                                      <Tooltip title={busynessText}>
                                        <Box 
                                          sx={{ 
                                            mt: 0.5, 
                                            width: '50%', 
                                            height: 3, 
                                            borderRadius: 3,
                                            bgcolor: busynessColor 
                                          }} 
                                        />
                                      </Tooltip>
                                    </Paper>
                                  );
                                })}
                              </Box>
                            </LocalizationProvider>
                          </Box>
                        )}
                        
                        {index === 1 && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            {isLoadingEmployees ? (
                              <CircularProgress size={24} sx={{ mt: 1 }} />
                            ) : employeesError ? (
                              <Alert severity="error" sx={{ mb: 2 }}>
                                Ошибка при загрузке мастеров: {employeesError.message}
                              </Alert>
                            ) : employeeList.length === 0 ? (
                              <Alert severity="warning">
                                К сожалению, нет доступных мастеров для этой услуги
                              </Alert>
                            ) : (
                              <Box>
                                <FormControl component="fieldset" fullWidth>
                                  <FormLabel component="legend">Выберите мастера</FormLabel>
                                  <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {employeeList.map((employee) => (
                                      <Grid item xs={12} sm={6} md={4} key={employee.id}>
                                        <Paper 
                                          elevation={selectedEmployee?.id === employee.id ? 3 : 1} 
                                          sx={{ 
                                            p: 2, 
                                            cursor: 'pointer',
                                            border: selectedEmployee?.id === employee.id ? '2px solid' : '1px solid',
                                            borderColor: selectedEmployee?.id === employee.id ? 'primary.main' : 'divider',
                                            bgcolor: selectedEmployee?.id === employee.id ? 'primary.lighter' : 'background.paper',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                              borderColor: 'primary.main',
                                              bgcolor: 'primary.lighter',
                                              transform: 'translateY(-2px)'
                                            }
                                          }}
                                          onClick={() => setSelectedEmployee(employee)}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar 
                                              sx={{ 
                                                width: 60, 
                                                height: 60, 
                                                mr: 2,
                                                bgcolor: selectedEmployee?.id === employee.id ? 'primary.main' : 'grey.400'
                                              }}
                                            >
                                              {employee.name[0]}
                                            </Avatar>
                                            <Box>
                                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                                                {employee.name}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Стаж работы: {employee.experience || "2 года"}
                                              </Typography>
                                              {employee.rating && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                  <Rating value={employee.rating} precision={0.5} size="small" readOnly />
                                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    ({employee.reviews_count || 12})
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                          </Box>
                                        </Paper>
                                      </Grid>
                                    ))}
                                  </Grid>
                                </FormControl>
                              </Box>
                            )}
                          </Box>
                        )}
                        
                        {index === 2 && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            {isLoadingAvailability ? (
                              <CircularProgress size={24} sx={{ mt: 1 }} />
                            ) : availabilityError ? (
                              <Alert severity="error" sx={{ mb: 2 }}>
                                Ошибка при загрузке доступного времени: {availabilityError.message}
                              </Alert>
                            ) : availableSlots.length === 0 ? (
                              <Alert severity="warning">
                                К сожалению, нет доступных слотов на выбранную дату
                              </Alert>
                            ) : (
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Доступное время: {format(selectedDate, 'dd.MM.yyyy (EEEE)', { locale: ruLocale })}
                                </Typography>
                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                  {availableSlots.map((slot, idx) => {
                                    const isSelected = selectedTime && 
                                                      isSameDay(new Date(selectedTime), new Date(slot)) && 
                                                      format(new Date(selectedTime), 'HH:mm') === format(new Date(slot), 'HH:mm');
                                    return (
                                      <Grid item xs={4} sm={3} md={2} key={idx}>
                                        <Paper 
                                          elevation={isSelected ? 3 : 1}
                                          sx={{ 
                                            p: 1.5, 
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid' : '1px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            bgcolor: isSelected ? 'primary.lighter' : 'background.paper',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                              borderColor: 'primary.main',
                                              bgcolor: 'primary.lighter'
                                            }
                                          }}
                                          onClick={() => setSelectedTime(slot)}
                                        >
                                          <Typography 
                                            variant="subtitle1" 
                                            component="div"
                                            color={isSelected ? 'primary.main' : 'text.primary'}
                                            sx={{ fontWeight: isSelected ? 600 : 400 }}
                                          >
                                            {format(new Date(slot), 'HH:mm')}
                                          </Typography>
                                        </Paper>
                                      </Grid>
                                    );
                                  })}
                                </Grid>
                              </Box>
                            )}
                          </Box>
                        )}
                        
                        {index === 3 && (
                          <Box sx={{ mt: 2, mb: 2 }}>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Информация о бронировании:
                              </Typography>
                              <List dense>
                                <ListItem>
                                  <ListItemText 
                                    primary="Услуга"
                                    secondary={serviceData.name}
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Мастер"
                                    secondary={selectedEmployee?.name}
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Дата и время"
                                    secondary={selectedTime && format(new Date(selectedTime), 'dd.MM.yyyy HH:mm')}
                                  />
                                </ListItem>
                                <ListItem>
                                  <ListItemText 
                                    primary="Стоимость"
                                    secondary={`${serviceData.price} ₽`}
                                  />
                                </ListItem>
                              </List>
                              
                              <TextField
                                label="Комментарий к записи (необязательно)"
                                fullWidth
                                multiline
                                rows={3}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                variant="outlined"
                                margin="normal"
                              />
                              
                              {bookingError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                  {bookingError}
                                </Alert>
                              )}
                            </Paper>
                          </Box>
                        )}
                        
                        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                          <Button
                            disabled={index === 0}
                            onClick={handleBack}
                            variant="outlined"
                          >
                            Назад
                          </Button>
                          <Button
                            variant="contained"
                            onClick={index === steps.length - 1 ? handleConfirmBooking : handleNext}
                            disabled={getStepNextButtonDisabled(index)}
                            startIcon={index === steps.length - 1 ? <EventAvailableIcon /> : null}
                          >
                            {index === steps.length - 1 ? 'Подтвердить запись' : 'Далее'}
                          </Button>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BookingForm; 