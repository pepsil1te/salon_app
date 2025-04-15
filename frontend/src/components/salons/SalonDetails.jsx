import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia,
  CardHeader,
  Grid,
  Rating,
  Chip,
  Divider,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Paper,
  Stepper, 
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { salonApi } from '../../api/salons';
import { serviceApi } from '../../api/services';
import { employeeApi } from '../../api/employees';
import { appointmentApi } from '../../api/appointments';
import { useAuthContext } from '../../contexts/AuthContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay, isAfter, addDays, isValid } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = [
  { label: 'Выбор даты', description: 'Выберите удобную дату для записи' },
  { label: 'Выбор мастера', description: 'Выберите специалиста' },
  { label: 'Выбор времени', description: 'Выберите удобное время' },
  { label: 'Подтверждение', description: 'Подтвердите ваше бронирование' },
];

const SalonDetails = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  // Состояние для процесса бронирования
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  
  // Новые состояния для улучшенного выбора услуг
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  // Отладка: проверка состояния авторизации
  console.log('🔐 Состояние авторизации:', { 
    isAuthorized: !!user, 
    userDetails: user ? { id: user.id, role: user.role, name: user.name } : 'Не авторизован'
  });

  // Запрос данных о салоне
  const { 
    data: salon, 
    isLoading: isLoadingSalon, 
    error: salonError 
  } = useQuery(['salon', salonId], () => salonApi.getById(salonId));

  // Запрос данных об услугах салона
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError
  } = useQuery(['salonServices', salonId], () => serviceApi.getBySalon(salonId));

  // Загрузка списка сотрудников, предоставляющих выбранную услугу
  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError
  } = useQuery(
    ['serviceEmployees', selectedService?.id], 
    async () => {
      if (selectedService && selectedService.employee_ids) {
        const employeePromises = selectedService.employee_ids.map(id => 
          employeeApi.getById(id)
        );
        return Promise.all(employeePromises);
      }
      return [];
    },
    {
      enabled: !!selectedService && !!selectedService.employee_ids
    }
  );

  // Загрузка доступных слотов времени
  const {
    data: availability,
    isLoading: isLoadingAvailability,
    error: availabilityError,
    refetch: refetchAvailability
  } = useQuery(
    ['serviceAvailability', selectedService?.id, selectedEmployee?.id, selectedDate],
    () => serviceApi.getAvailability(
      selectedService.id, 
      selectedEmployee.id, 
      format(selectedDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!selectedService && !!selectedEmployee && isValid(selectedDate)
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

  // Обработчик для кнопки записи на услугу
  const handleBookService = (service) => {
    console.log('🔍 handleBookService вызван:', { 
      serviceId: service.id, 
      salonId, 
      user,
      isAuthorized: !!user,
      userRole: user?.role
    });
    
    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!user) {
      console.log('ℹ️ Пользователь не авторизован, перенаправление на страницу входа');
      navigate('/login');
      return;
    }
    
    // Проверяем, является ли пользователь клиентом
    if (user.role === 'client') {
      // Включаем режим бронирования и сохраняем выбранную услугу
      console.log('✅ Пользователь является клиентом, включаем режим бронирования');
      setSelectedService(service);
      setIsBookingMode(true);
      setActiveStep(0);
      setSelectedDate(addDays(new Date(), 1));
      setSelectedEmployee(null);
      setSelectedTime(null);
      setNote('');
      setBookingComplete(false);
      setBookingError(null);
      
      // Скроллим к форме бронирования
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // Если пользователь авторизован, но не как клиент
      console.error('⚠️ Пользователь авторизован с ролью, отличной от клиента:', user.role);
      alert('Для записи на услугу вам необходимо войти как клиент. Текущая роль: ' + user.role);
    }
  };

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
    if (!selectedTime || !selectedEmployee || !selectedService || !salonId) {
      setBookingError('Не все данные для записи выбраны');
      return;
    }

    const appointmentData = {
      service_id: selectedService.id,
      employee_id: selectedEmployee.id,
      salon_id: parseInt(salonId),
      date_time: selectedTime,
      notes: note
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  // Обработчик завершения бронирования
  const handleFinishBooking = () => {
    setIsBookingMode(false);
    if (user && user.role === 'client') {
      navigate('/client/appointments');
    }
  };

  // Отмена режима бронирования
  const handleCancelBooking = () => {
    setIsBookingMode(false);
  };

  // Форматирование данных о рабочих часах
  const getWorkingHoursFormatted = (workingHours) => {
    if (!workingHours) return [];
    
    const days = [
      'Воскресенье', 'Понедельник', 'Вторник', 
      'Среда', 'Четверг', 'Пятница', 'Суббота'
    ];
    
    return Object.entries(workingHours).map(([day, hours]) => ({
      day: days[day],
      hours: hours ? hours.start + ' - ' + hours.end : 'Выходной'
    }));
  };

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

  // Доступные слоты времени
  const availableSlots = availability?.available_slots || [];

  if (isLoadingSalon) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (salonError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" variant="h6" align="center">
          Ошибка при загрузке информации о салоне: {salonError.message}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/salons')}>
            Вернуться к списку салонов
          </Button>
        </Box>
      </Box>
    );
  }

  if (!salon) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Салон не найден</Typography>
      </Box>
    );
  }

  if (!services) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Услуги не найдены</Typography>
      </Box>
    );
  }

  // Группировка услуг по категориям
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  const workingHours = getWorkingHoursFormatted(salon.working_hours);

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button 
          startIcon={<Box sx={{ mr: -0.5, transform: 'rotate(180deg)' }}>→</Box>} 
          onClick={() => navigate('/')}
        >
          Назад к списку салонов
        </Button>
        
        {user && user.role === 'client' && (
          <Button 
            variant="outlined"
            color="primary"
            onClick={() => navigate('/client')}
          >
            Личный кабинет
          </Button>
        )}
      </Box>
      
      {/* Форма бронирования, если включен режим бронирования */}
      {isBookingMode && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Бронирование услуги" 
            subheader={`${salon.name} - ${selectedService?.name}`}
            action={
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCancelBooking}
              >
                Отмена
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6">
                  {selectedService?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Длительность: {selectedService?.duration} мин.
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Стоимость: {selectedService?.price} ₽
                </Typography>
                {selectedService?.description && (
                  <Typography variant="body2">
                    {selectedService.description}
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
                      onClick={handleFinishBooking}
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
                                <DatePicker 
                                  label="Выберите дату"
                                  value={selectedDate}
                                  onChange={setSelectedDate}
                                  disablePast
                                  renderInput={(params) => <TextField {...params} fullWidth />}
                                />
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
                              ) : employees.length === 0 ? (
                                <Alert severity="warning">
                                  К сожалению, нет доступных мастеров для этой услуги
                                </Alert>
                              ) : (
                                <Box>
                                  <FormControl component="fieldset" fullWidth>
                                    <FormLabel component="legend">Выберите мастера</FormLabel>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                      {employees.map((employee) => (
                                        <Grid item xs={12} sm={6} key={employee.id}>
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                  <Rating value={employee.rating || 4.5} precision={0.5} size="small" readOnly />
                                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                    ({employee.reviews_count || 15} отзывов)
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ mt: 1 }}>
                                                  <Chip 
                                                    size="small" 
                                                    label={selectedService?.category || "Специалист"} 
                                                    color="primary"
                                                    variant="outlined"
                                                  />
                                                </Box>
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
                                    Доступное время: {format(selectedDate, 'dd MMMM yyyy (EEEE)', { locale: ruLocale })}
                                  </Typography>
                                  
                                  {/* Группировка времени по частям дня */}
                                  {['Утро', 'День', 'Вечер'].map((timeOfDay, idx) => {
                                    // Фильтруем слоты по времени дня
                                    const filteredSlots = availableSlots.filter(slot => {
                                      const hour = new Date(slot).getHours();
                                      if (timeOfDay === 'Утро') return hour >= 8 && hour < 12;
                                      if (timeOfDay === 'День') return hour >= 12 && hour < 17;
                                      return hour >= 17 && hour <= 22;
                                    });
                                    
                                    // Если нет слотов в этой группе, не отображаем группу
                                    if (filteredSlots.length === 0) return null;
                                    
                                    return (
                                      <Box key={idx} sx={{ mb: 2 }}>
                                        <Typography 
                                          variant="subtitle2" 
                                          sx={{ 
                                            mt: 2, 
                                            mb: 1, 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            color: 'primary.main' 
                                          }}
                                        >
                                          {timeOfDay}
                                          <Divider sx={{ ml: 1, flexGrow: 1 }} />
                                        </Typography>
                                        <Grid container spacing={1}>
                                          {filteredSlots.map((slot, slotIdx) => {
                                            const isSelected = selectedTime && 
                                              isSameDay(new Date(selectedTime), new Date(slot)) && 
                                              format(new Date(selectedTime), 'HH:mm') === format(new Date(slot), 'HH:mm');
                                            
                                            return (
                                              <Grid item xs={4} sm={3} md={2} key={slotIdx}>
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
                                                      bgcolor: 'primary.lighter',
                                                      transform: 'translateY(-2px)'
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
                                    );
                                  })}
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
                                      secondary={selectedService?.name}
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
                                      secondary={`${selectedService?.price} ₽`}
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
      )}
      
      {/* Основная информация о салоне */}
      <Card sx={{ mb: 3 }}>
        <CardMedia
          component="img"
          height="200"
          image={`https://source.unsplash.com/random/800x200/?salon,beauty,spa&sig=${salonId}`}
          alt={salon.name}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" component="div" gutterBottom>
                {salon.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Rating value={4.7} precision={0.1} size="small" readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  4.7 (124 отзыва)
                </Typography>
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {salon.description}
              </Typography>
            </Box>
            
            <Chip 
              label="Популярный" 
              color="primary" 
            />
          </Box>
        </CardContent>
      </Card>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Контактная информация
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <LocationOnIcon />
                </ListItemIcon>
                <ListItemText primary={salon.address} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={salon.contact_info.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={salon.contact_info.email} />
              </ListItem>
            </List>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Часы работы
            </Typography>
            <List dense>
              {workingHours.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.day} 
                    secondary={item.hours} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Услуги
            </Typography>
            
            {isLoadingServices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            ) : servicesError ? (
              <Typography color="error">
                Ошибка при загрузке услуг: {servicesError.message}
              </Typography>
            ) : (
              <>
                {/* Фильтры по категориям и поиск */}
                <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <TextField
                    placeholder="Поиск услуг..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                          🔍
                        </Box>
                      ),
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label="Все"
                      color={selectedCategory === 'all' ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory('all')}
                      variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
                    />
                    {Object.keys(groupedServices).map(category => (
                      <Chip 
                        key={category}
                        label={category}
                        color={selectedCategory === category ? 'primary' : 'default'}
                        onClick={() => setSelectedCategory(category)}
                        variant={selectedCategory === category ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
                
                {/* Список услуг с фильтрацией */}
                {Object.entries(groupedServices)
                  .filter(([category]) => selectedCategory === 'all' || selectedCategory === category)
                  .map(([category, services]) => {
                    // Фильтрация по поисковому запросу
                    const filteredServices = services.filter(service => 
                      service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                    
                    // Если после фильтрации нет услуг в категории, не отображаем категорию
                    if (filteredServices.length === 0) return null;
                    
                    return (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {category}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        {filteredServices.map((service) => (
                          <Card 
                            key={service.id} 
                            sx={{ 
                              mb: 2,
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: 3,
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <CardContent sx={{ pb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" sx={{ mr: 1 }}>
                                      {service.name}
                                    </Typography>
                                    <Chip 
                                      size="small"
                                      label={`${service.duration} мин`}
                                      color="secondary"
                                      variant="outlined"
                                    />
                                  </Box>
                                  
                                  {service.description && (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                      {expandedServiceId === service.id ? 
                                        service.description : 
                                        (service.description.length > 100 ? 
                                          `${service.description.substring(0, 100)}...` : 
                                          service.description)
                                      }
                                      {service.description.length > 100 && (
                                        <Button 
                                          size="small" 
                                          onClick={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)}
                                          sx={{ ml: 1, minWidth: 'auto', p: '0 4px' }}
                                        >
                                          {expandedServiceId === service.id ? 'Свернуть' : 'Подробнее'}
                                        </Button>
                                      )}
                                    </Typography>
                                  )}
                                  
                                  {service.employee_names && service.employee_names.length > 0 && (
                                    <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                        Мастера:
                                      </Typography>
                                      {service.employee_names.slice(0, 3).map((name, idx) => (
                                        <Chip
                                          key={idx}
                                          avatar={<Avatar>{name[0]}</Avatar>}
                                          label={name}
                                          size="small"
                                          variant="outlined"
                                          sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                      ))}
                                      {service.employee_names.length > 3 && (
                                        <Chip
                                          size="small"
                                          label={`+${service.employee_names.length - 3}`}
                                          sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                      )}
                                    </Box>
                                  )}
                                </Box>
                                
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                    {service.price} ₽
                                  </Typography>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    startIcon={<EventAvailableIcon />}
                                    sx={{ mt: 1 }}
                                    onClick={() => handleBookService(service)}
                                  >
                                    Записаться
                                  </Button>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    );
                  })}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalonDetails; 