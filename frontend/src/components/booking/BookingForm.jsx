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
  Avatar
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
    navigate('/appointments');
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
                            ) : employeeList.length === 0 ? (
                              <Alert severity="warning">
                                К сожалению, нет доступных мастеров для этой услуги
                              </Alert>
                            ) : (
                              <FormControl component="fieldset">
                                <FormLabel component="legend">Выберите мастера</FormLabel>
                                <RadioGroup
                                  value={selectedEmployee?.id || ''}
                                  onChange={(e) => {
                                    const empId = parseInt(e.target.value);
                                    setSelectedEmployee(employeeList.find(emp => emp.id === empId));
                                  }}
                                >
                                  {employeeList.map((employee) => (
                                    <FormControlLabel
                                      key={employee.id}
                                      value={employee.id}
                                      control={<Radio />}
                                      label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Avatar sx={{ mr: 1 }}>{employee.name[0]}</Avatar>
                                          {employee.name}
                                        </Box>
                                      }
                                    />
                                  ))}
                                </RadioGroup>
                              </FormControl>
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
                                  Доступное время:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                  {availableSlots.map((slot, idx) => (
                                    <Chip
                                      key={idx}
                                      label={format(new Date(slot), 'HH:mm')}
                                      onClick={() => setSelectedTime(slot)}
                                      color={selectedTime && isSameDay(new Date(selectedTime), new Date(slot)) && 
                                             format(new Date(selectedTime), 'HH:mm') === format(new Date(slot), 'HH:mm') 
                                             ? 'primary' : 'default'}
                                      variant={selectedTime && isSameDay(new Date(selectedTime), new Date(slot)) && 
                                             format(new Date(selectedTime), 'HH:mm') === format(new Date(slot), 'HH:mm')  
                                             ? 'filled' : 'outlined'}
                                    />
                                  ))}
                                </Box>
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