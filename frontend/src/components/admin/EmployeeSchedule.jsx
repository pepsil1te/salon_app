import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay, parse, parseISO, isToday } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import SaveIcon from '@mui/icons-material/Save';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';

// Компонент расписания сотрудника для админ-панели
const EmployeeSchedule = ({ employeeId, onClose }) => {
  const queryClient = useQueryClient();
  
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(() => endOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [editMode, setEditMode] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    working_hours: {},
    time_off: [],
    showSunday: true
  });
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [selectedDayForTimeOff, setSelectedDayForTimeOff] = useState(null);
  const [timeOffReason, setTimeOffReason] = useState('');

  // Получение информации о сотруднике
  const {
    data: employee,
    isLoading: isLoadingEmployee,
    error: employeeError
  } = useQuery(
    ['employee', employeeId],
    () => employeeApi.getById(employeeId),
    {
      enabled: !!employeeId,
      onSuccess: (data) => {
        setEmployeeInfo(data);
      }
    }
  );

  // Получение расписания сотрудника
  const {
    data: schedule,
    isLoading: isLoadingSchedule,
    error: scheduleError,
    refetch: refetchSchedule
  } = useQuery(
    ['employeeSchedule', employeeId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    () => employeeApi.getSchedule(
      employeeId,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!employeeId,
      staleTime: 5 * 60 * 1000, // 5 минут
      onSuccess: (data) => {
        setScheduleData(data);
      }
    }
  );

  // Мутация для обновления расписания сотрудника
  const updateScheduleMutation = useMutation(
    (newSchedule) => employeeApi.updateSchedule(employeeId, newSchedule),
    {
      onSuccess: (data) => {
        console.log('Расписание успешно обновлено:', data);
        setEditMode(false);
        queryClient.invalidateQueries([
          'employeeSchedule',
          employeeId,
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        ]);
      },
      onError: (error) => {
        console.error('Ошибка при обновлении расписания:', error);
        alert('Не удалось сохранить расписание. Пожалуйста, проверьте консоль для дополнительной информации.');
      }
    }
  );

  // Обработчик изменения даты
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setStartDate(startOfWeek(date, { weekStartsOn: 1 }));
    setEndDate(endOfWeek(date, { weekStartsOn: 1 }));
  };

  // Тестовые данные для расписания, если API не вернуло результаты
  const mockSchedule = {
    employee_id: employeeId || 1,
    working_hours: {
      1: { start: '09:00', end: '18:00' },
      2: { start: '09:00', end: '18:00' },
      3: { start: '09:00', end: '18:00' },
      4: { start: '09:00', end: '18:00' },
      5: { start: '09:00', end: '18:00' },
      6: { start: '10:00', end: '16:00' }
    },
    time_off: [
      { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), reason: 'Отпуск' }
    ],
    appointments: [
      { date: format(new Date(), 'yyyy-MM-dd'), count: 5 },
      { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), count: 3 }
    ]
  };

  // Обновляем функцию при инициализации данных для предварительной очистки некорректных записей
  useEffect(() => {
    if (!schedule) {
      setScheduleData({
        working_hours: mockSchedule.working_hours,
        time_off: mockSchedule.time_off || []
      });
    } else {
      // Очищаем объект working_hours от некорректных записей
      const cleanedWorkingHours = {};
      
      if (schedule.working_hours) {
        // Перебираем все записи и добавляем только корректные
        Object.entries(schedule.working_hours).forEach(([day, hours]) => {
          if (hours && typeof hours === 'object' && hours.start && hours.end) {
            cleanedWorkingHours[day] = hours;
          }
        });
      }
      
      const updatedSchedule = {
        ...schedule,
        working_hours: cleanedWorkingHours,
        time_off: schedule.time_off || []
      };
      
      setScheduleData(updatedSchedule);
    }
  }, [schedule]);

  // Обработчик переключения в режим редактирования
  const handleEditMode = () => {
    setEditMode(true);
  };

  // Улучшаем обработчик сохранения для фильтрации некорректных записей
  const handleSaveSchedule = () => {
    // Очищаем объект working_hours от некорректных записей
    const cleanedWorkingHours = {};
    
    if (scheduleData.working_hours) {
      // Перебираем все записи и добавляем только корректные
      Object.entries(scheduleData.working_hours).forEach(([day, hours]) => {
        if (hours && typeof hours === 'object' && hours.start && hours.end) {
          cleanedWorkingHours[day] = hours;
        }
      });
    }
    
    // Подготавливаем данные с очищенными записями
    const dataToSave = {
      ...scheduleData,
      working_hours: cleanedWorkingHours,
      time_off: scheduleData.time_off || []
    };
    
    console.log('Отправка данных расписания:', dataToSave);
    updateScheduleMutation.mutate(dataToSave);
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditMode(false);
    // Вернуть исходные данные
    if (schedule) {
      setScheduleData({
        ...schedule,
        working_hours: schedule.working_hours || {},
        time_off: schedule.time_off || []
      });
    } else {
      setScheduleData({
        working_hours: mockSchedule.working_hours,
        time_off: mockSchedule.time_off || []
      });
    }
  };

  // Обработчик изменения рабочего времени
  const handleWorkingHoursChange = (day, field, value) => {
    if (!editMode) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      if (!newData.working_hours[day]) {
        newData.working_hours[day] = { start: '09:00', end: '18:00' };
      }
      
      newData.working_hours[day][field] = value;
      
      return newData;
    });
  };

  // Обработчик изменения статуса рабочего дня
  const handleWorkingDayChange = (day, isWorking) => {
    if (!editMode) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      if (isWorking) {
        // Если день становится рабочим
        if (!newData.working_hours[day]) {
          newData.working_hours[day] = { start: '09:00', end: '18:00' };
        }
      } else {
        // Если день становится выходным
        if (newData.working_hours[day]) {
          delete newData.working_hours[day];
        }
      }
      
      return newData;
    });
  };

  // Обработчик открытия диалога для выбора выходного дня
  const handleOpenTimeOffDialog = () => {
    setSelectedDayForTimeOff(new Date());
    setTimeOffDialogOpen(true);
  };

  // Обработчик изменения даты выходного
  const handleTimeOffDateChange = (date) => {
    setSelectedDayForTimeOff(date);
  };

  // Обработчик добавления выходного дня
  const handleAddTimeOff = () => {
    if (!selectedDayForTimeOff) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.time_off) {
        newData.time_off = [];
      }
      
      newData.time_off.push({
        date: format(selectedDayForTimeOff, 'yyyy-MM-dd'),
        reason: timeOffReason || 'Личные причины'
      });
      
      return newData;
    });

    setTimeOffDialogOpen(false);
    setSelectedDayForTimeOff(null);
    setTimeOffReason('');
  };

  // Функция проверки, является ли день выходным
  const isDayOff = (date) => {
    if (!scheduleData || !scheduleData.time_off) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduleData.time_off.some(timeOff => timeOff.date === dateStr);
  };

  // Функция получения причины выходного
  const getTimeOffReason = (date) => {
    if (!scheduleData || !scheduleData.time_off) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeOff = scheduleData.time_off.find(item => item.date === dateStr);
    return timeOff ? timeOff.reason : null;
  };

  // Функция проверки, является ли день рабочим
  const isWorkingDay = (day) => {
    // Make sure to handle the case where scheduleData or working_hours might be undefined
    if (!scheduleData || !scheduleData.working_hours) return false;
    
    // Convert day to string to match the keys in working_hours object
    const dayKey = day.toString();
    // Проверяем не только наличие ключа, но и что значение не null и содержит start и end
    return dayKey in scheduleData.working_hours && 
           scheduleData.working_hours[dayKey] != null && 
           scheduleData.working_hours[dayKey].start && 
           scheduleData.working_hours[dayKey].end;
  };

  // Подготовка данных для отображения
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const workDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  // Используем тестовые данные, если API не вернуло результаты
  const displaySchedule = schedule || mockSchedule;
  
  // Улучшаем функцию получения рабочих дней, удаляя дубликаты воскресенья
  const getValidWorkingDays = () => {
    if (!displaySchedule || !displaySchedule.working_hours) {
      return [];
    }
    
    // Создаем объект для хранения уникальных дней недели
    const uniqueDays = {};
    
    // Фильтруем, нормализуем и преобразуем ключи к числовому формату
    Object.entries(displaySchedule.working_hours)
      .filter(([dayKey, hours]) => 
        hours && 
        typeof hours === 'object' && 
        hours.start && 
        hours.end && 
        typeof hours.start === 'string' && 
        typeof hours.end === 'string'
      )
      .forEach(([dayKey, hours]) => {
        // Преобразуем ключ к стандартному числовому формату (0-6)
        let dayNum = parseInt(dayKey);
        
        // Проверяем, является ли день некорректным числом, для безопасности
        if (isNaN(dayNum) || dayNum < 0 || dayNum > 7) {
          return; // Пропускаем некорректные дни
        }
        
        // Нормализуем день недели: 0 и 7 - это воскресенье
        if (dayNum === 7) dayNum = 0;
        
        // Добавляем день только если он еще не существует
        // или если это воскресенье (0) и мы не хотим его показывать
        if (!uniqueDays[dayNum] && (editMode || dayNum !== 0 || scheduleData.showSunday !== false)) {
          uniqueDays[dayNum] = hours;
        }
      });
    
    // Преобразуем обратно в массив и сортируем
    const validEntries = Object.entries(uniqueDays)
      .map(([day, hours]) => [parseInt(day), hours])
      .sort((a, b) => {
        // Особая сортировка: 0 (воскресенье) должно быть в конце
        const dayA = a[0] === 0 ? 7 : a[0];
        const dayB = b[0] === 0 ? 7 : b[0];
        return dayA - dayB;
      });
    
    return validEntries;
  };

  // Добавляем новую функцию-обработчик для скрытия/отображения воскресенья
  const handleToggleSunday = () => {
    if (!editMode) return;
    
    setScheduleData(prev => {
      const newData = { ...prev };
      
      // Если воскресенье есть в расписании, удаляем его
      if (newData.working_hours && newData.working_hours['0']) {
        delete newData.working_hours['0'];
        newData.showSunday = false;
      } else {
        // Иначе добавляем его с дефолтным расписанием
        if (!newData.working_hours) {
          newData.working_hours = {};
        }
        newData.working_hours['0'] = { start: '10:00', end: '16:00' };
        newData.showSunday = true;
      }
      
      return newData;
    });
  };

  // Отображение загрузки
  if (isLoadingEmployee || isLoadingSchedule) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Отображение ошибки
  if (employeeError || scheduleError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка при загрузке данных: {(employeeError || scheduleError).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          mb: 2,
          gap: 1
        }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={onClose}
            sx={{ mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }}
            fullWidth={false}
            size="medium"
          >
            Назад
          </Button>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main', 
              flex: 1,
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}
          >
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {employee ? `${employee.first_name} ${employee.last_name}` : 'Сотрудник'} - Расписание
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            mt: { xs: 1, sm: 0 }
          }}>
            {!editMode && (
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={handleEditMode}
                fullWidth={false}
                size="medium"
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Редактировать
              </Button>
            )}
            {editMode && (
              <>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSchedule}
                  disabled={updateScheduleMutation.isLoading}
                  sx={{ fontWeight: 'bold', width: { xs: '100%', sm: 'auto' } }}
                  size="medium"
                >
                  {updateScheduleMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleCancelEdit}
                  disabled={updateScheduleMutation.isLoading}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                  size="medium"
                >
                  Отмена
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 2,
          mt: { xs: 2, sm: 1 },
          gap: 1
        }}>
          <Typography variant="body1" sx={{ mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }}>
            Выберите неделю:
          </Typography>
          <LocalizationProvider 
            dateAdapter={AdapterDateFns}
            adapterLocale={ruLocale}
          >
            <DatePicker 
              label="Дата"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{ textField: { size: "small" } }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
          </LocalizationProvider>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              ml: { xs: 0, sm: 2 },
              mt: { xs: 1, sm: 0 }
            }}
          >
            Период: {format(startDate, 'dd.MM.yyyy')} — {format(endDate, 'dd.MM.yyyy')}
          </Typography>
        </Box>

        {editMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Настройте рабочее расписание сотрудника на каждый день недели и укажите выходные дни.
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ 
          display: { xs: 'flex', md: 'none' }, 
          mt: 2,
          justifyContent: 'center' 
        }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<EventBusyIcon />}
            onClick={handleOpenTimeOffDialog}
            size="medium"
            fullWidth
          >
            Добавить выходной день
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'primary.main',
                  borderBottom: '1px solid #eee',
                  pb: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}>
                  <AccessTimeIcon sx={{ mr: 1 }} />
                  Стандартное расписание
                </Typography>
                
                <Box>
                  {editMode ? (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          Укажите стандартное рабочее время для каждого дня недели:
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          color={isWorkingDay(0) ? "error" : "success"}
                          onClick={handleToggleSunday}
                        >
                          {isWorkingDay(0) ? "Убрать воскресенье" : "Добавить воскресенье"}
                        </Button>
                      </Box>
                      <FormGroup>
                        {[1, 2, 3, 4, 5, 6].map((day) => (
                          <Paper 
                            key={day} 
                            sx={{ 
                              p: 1.5, 
                              mb: 1, 
                              display: 'flex', 
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1,
                              bgcolor: isWorkingDay(day) ? 'rgba(0, 230, 118, 0.08)' : 'inherit'
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isWorkingDay(day)}
                                  onChange={(e) => handleWorkingDayChange(day, e.target.checked)}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: 100 }}>
                                  {workDays[day - 1]}
                                </Typography>
                              }
                              sx={{ m: 0, width: { xs: '100%', sm: 'auto' } }}
                            />
                            
                            {isWorkingDay(day) && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                width: '100%',
                                justifyContent: 'space-between'
                              }}>
                                <TextField
                                  label="Начало"
                                  type="time"
                                  value={scheduleData.working_hours[day]?.start || '09:00'}
                                  onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                  size="small"
                                  sx={{ width: '45%' }}
                                />
                                <Typography variant="body2" sx={{ mx: 1 }}>—</Typography>
                                <TextField
                                  label="Конец"
                                  type="time"
                                  value={scheduleData.working_hours[day]?.end || '18:00'}
                                  onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ step: 300 }}
                                  size="small"
                                  sx={{ width: '45%' }}
                                />
                              </Box>
                            )}
                          </Paper>
                        ))}
                        
                        {/* Отдельная карточка для воскресенья, если оно должно отображаться */}
                        {isWorkingDay(0) && (
                          <Paper 
                            key={0} 
                            sx={{ 
                              p: 1.5, 
                              mb: 1, 
                              display: 'flex', 
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1,
                              bgcolor: 'rgba(0, 230, 118, 0.08)'
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={true}
                                  onChange={() => handleToggleSunday()}
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: 100 }}>
                                  {workDays[6]} {/* Воскресенье */}
                                </Typography>
                              }
                              sx={{ m: 0, width: { xs: '100%', sm: 'auto' } }}
                            />
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              width: '100%',
                              justifyContent: 'space-between'
                            }}>
                              <TextField
                                label="Начало"
                                type="time"
                                value={scheduleData.working_hours[0]?.start || '10:00'}
                                onChange={(e) => handleWorkingHoursChange(0, 'start', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                size="small"
                                sx={{ width: '45%' }}
                              />
                              <Typography variant="body2" sx={{ mx: 1 }}>—</Typography>
                              <TextField
                                label="Конец"
                                type="time"
                                value={scheduleData.working_hours[0]?.end || '16:00'}
                                onChange={(e) => handleWorkingHoursChange(0, 'end', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                size="small"
                                sx={{ width: '45%' }}
                              />
                            </Box>
                          </Paper>
                        )}
                      </FormGroup>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      {getValidWorkingDays().length > 0 ? (
                        getValidWorkingDays().map(([day, hours]) => (
                          <Box 
                            key={day} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 1,
                              p: 1.5,
                              borderLeft: '4px solid',
                              borderColor: 'primary.main',
                              bgcolor: 'rgba(0, 230, 118, 0.08)',
                              borderRadius: 1,
                              width: '100%'
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              minWidth: '140px'
                            }}>
                              <AccessTimeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {workDays[day === 0 ? 6 : (day > 0 && day <= 7 ? day - 1 : 0)]}
                              </Typography>
                            </Box>
                            <Typography variant="body1" color="text.primary" sx={{ 
                              fontWeight: 'medium',
                              ml: 'auto'
                            }}>
                              {`${hours.start} — ${hours.end}`}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Alert severity="warning">
                          Рабочее расписание не настроено. Нажмите "Редактировать расписание" для настройки.
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  color: 'primary.main',
                  borderBottom: '1px solid #eee',
                  pb: 1 
                }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, display: 'flex', alignItems: 'center' }}>
                    <EventBusyIcon sx={{ mr: 1 }} />
                    Выходные дни
                  </Typography>
                  
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<EventBusyIcon />}
                      onClick={handleOpenTimeOffDialog}
                    >
                      Добавить выходной
                    </Button>
                  </Box>
                </Box>
                
                {scheduleData.time_off && scheduleData.time_off.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {scheduleData.time_off.map((timeOff, index) => (
                      <Paper 
                        key={index} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          mb: 1,
                          p: 1.5,
                          bgcolor: 'rgba(244, 67, 54, 0.08)',
                          borderRadius: 1,
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 1, sm: 0 }
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {format(parseISO(timeOff.date), 'dd.MM.yyyy')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {timeOff.reason}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Выходной" 
                          color="error" 
                          size="small" 
                          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                        />
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                    Нет отмеченных выходных дней
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.main',
                borderBottom: '1px solid #eee',
                pb: 1,
                px: { xs: 1, sm: 0 },
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}>
                Расписание по дням
              </Typography>
              
              <TableContainer sx={{ 
                maxWidth: '100%', 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                }
              }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>День</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>Дата</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>Статус</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Рабочее время</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Записи</TableCell>
                      {editMode && <TableCell sx={{ fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>Действия</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map((day) => {
                      const dayOfWeek = getDay(day);
                      const dayNumber = dayOfWeek === 0 ? 0 : dayOfWeek;
                      const isWorking = isWorkingDay(dayNumber);
                      const isOff = isDayOff(day);
                      const timeOffReasonText = getTimeOffReason(day);
                      const dayAppointments = displaySchedule.appointments?.find(
                        a => a.date === format(day, 'yyyy-MM-dd')
                      );
                      
                      return (
                        <TableRow 
                          key={format(day, 'yyyy-MM-dd')}
                          sx={{ 
                            bgcolor: isToday(day) 
                              ? 'rgba(33, 150, 243, 0.08)' 
                              : isOff 
                                ? 'rgba(244, 67, 54, 0.08)' 
                                : isWorking 
                                  ? 'rgba(0, 230, 118, 0.08)' 
                                  : 'inherit',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                            },
                            '& .MuiTableCell-root': {
                              p: { xs: 1, sm: 2 },
                            }
                          }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {workDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1].substring(0, 3)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                              <Typography 
                                variant="body2"
                                sx={{ fontWeight: isToday(day) ? 'bold' : 'normal' }}
                              >
                                {format(day, 'dd.MM')}
                              </Typography>
                              {isToday(day) && (
                                <Chip
                                  label="Сегодня"
                                  size="small"
                                  color="primary"
                                  sx={{ 
                                    height: '20px', 
                                    '& .MuiChip-label': { 
                                      px: 0.5, 
                                      fontSize: '0.625rem'
                                    } 
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {isOff ? (
                              <Chip
                                label="Выходной"
                                size="small"
                                color="error"
                                title={timeOffReasonText}
                                sx={{ 
                                  height: '20px', 
                                  '& .MuiChip-label': { 
                                    px: 0.5, 
                                    fontSize: '0.625rem'
                                  } 
                                }}
                              />
                            ) : isWorking ? (
                              <Chip
                                label="Рабочий"
                                size="small"
                                color="success"
                                sx={{ 
                                  height: '20px', 
                                  '& .MuiChip-label': { 
                                    px: 0.5, 
                                    fontSize: '0.625rem'
                                  } 
                                }}
                              />
                            ) : (
                              <Chip
                                label="Выходной"
                                size="small"
                                color="default"
                                sx={{ 
                                  height: '20px', 
                                  '& .MuiChip-label': { 
                                    px: 0.5, 
                                    fontSize: '0.625rem'
                                  } 
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
                            {isWorking && !isOff ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', color: 'success.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {displaySchedule.working_hours && 
                                   displaySchedule.working_hours[dayNumber] && 
                                   displaySchedule.working_hours[dayNumber].start && 
                                   displaySchedule.working_hours[dayNumber].end ? 
                                    `${displaySchedule.working_hours[dayNumber].start} — ${displaySchedule.working_hours[dayNumber].end}` : 
                                    'Не указано'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Выходной
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
                            {dayAppointments ? (
                              <Chip
                                label={`${dayAppointments.count} записей`}
                                size="small"
                                color="primary"
                                sx={{ 
                                  height: '20px', 
                                  '& .MuiChip-label': { 
                                    px: 0.5, 
                                    fontSize: '0.625rem'
                                  } 
                                }}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Нет записей
                              </Typography>
                            )}
                          </TableCell>
                          {editMode && (
                            <TableCell sx={{ p: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                onClick={handleOpenTimeOffDialog}
                                sx={{ 
                                  minWidth: 'unset',
                                  p: '4px 8px',
                                  '& .MuiButton-startIcon': {
                                    m: 0
                                  },
                                  '& .MuiButton-startIcon > svg': {
                                    fontSize: '1rem'
                                  }
                                }}
                              >
                                <EventBusyIcon fontSize="small" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={timeOffDialogOpen}
        onClose={() => setTimeOffDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 1.5 }}>
          Добавить выходной день
        </DialogTitle>
        <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" gutterBottom>
            Выберите дату выходного дня:
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <DatePicker
              label="Дата выходного"
              value={selectedDayForTimeOff}
              onChange={handleTimeOffDateChange}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 3 } } }}
              minDate={new Date()}
            />
          </LocalizationProvider>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Укажите причину:
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Причина"
            type="text"
            fullWidth
            value={timeOffReason}
            onChange={(e) => setTimeOffReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setTimeOffDialogOpen(false)}
            variant="outlined"
            fullWidth={false}
          >
            Отмена
          </Button>
          <Button
            onClick={handleAddTimeOff}
            color="primary"
            variant="contained"
            startIcon={<EventBusyIcon />}
            fullWidth={false}
          >
            Добавить выходной
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSchedule; 