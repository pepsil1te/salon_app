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
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay, parse, parseISO, isToday } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { ru } from 'date-fns/locale';
import SaveIcon from '@mui/icons-material/Save';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Slider } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Компонент расписания сотрудника для админ-панели
const EmployeeSchedule = ({ employeeId, onClose }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  const [copyMenuAnchor, setCopyMenuAnchor] = useState(null);
  const [selectedDayToCopy, setSelectedDayToCopy] = useState(null);
  const primaryGradient = 'linear-gradient(45deg, #ff9800, #ff5722)';

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

  // Значения по умолчанию для расписания
  const defaultEmptySchedule = {
    employee_id: employeeId,
    working_hours: {
      'Понедельник': { start: '09:00', end: '18:00', is_working: true },
      'Вторник': { start: '09:00', end: '18:00', is_working: true },
      'Среда': { start: '09:00', end: '18:00', is_working: true },
      'Четверг': { start: '09:00', end: '18:00', is_working: true },
      'Пятница': { start: '09:00', end: '18:00', is_working: true },
      'Суббота': { start: '10:00', end: '16:00', is_working: true },
      'Воскресенье': { start: '00:00', end: '00:00', is_working: false }
    },
    time_off: []
  };

  // Используем данные только из API или пустое расписание с дефолтными значениями
  const displaySchedule = schedule || defaultEmptySchedule;

  // Обновляем функцию при инициализации данных для предварительной очистки некорректных записей
  useEffect(() => {
    if (!schedule) {
      setScheduleData({
        working_hours: defaultEmptySchedule.working_hours,
        time_off: defaultEmptySchedule.time_off || []
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
        working_hours: defaultEmptySchedule.working_hours,
        time_off: defaultEmptySchedule.time_off || []
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
        newData.working_hours[day] = { 
          start: '09:00', 
          end: '18:00',
          is_working: true // Явно указываем булево значение
        };
      } else {
        // Если день становится выходным
        newData.working_hours[day] = {
          start: '00:00',
          end: '00:00',
          is_working: false // Явно указываем булево значение
        };
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
    if (!scheduleData || !scheduleData.working_hours) return false;
    
    const dayKey = day.toString();
    const daySchedule = scheduleData.working_hours[dayKey];
    
    return daySchedule && daySchedule.is_working === true;
  };

  // Подготовка данных для отображения
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const workDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

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
  const handleToggleSunday = (checked) => {
    if (!editMode) return;
    
    setScheduleData(prev => {
      const newData = { ...prev };
      
      // Если воскресенье есть в расписании, удаляем его
      if (newData.working_hours && newData.working_hours['0']) {
        delete newData.working_hours['0'];
        newData.showSunday = checked ? true : false;
      } else {
        // Иначе добавляем его с дефолтным расписанием
        if (!newData.working_hours) {
          newData.working_hours = {};
        }
        newData.working_hours['0'] = { start: '10:00', end: '16:00' };
        newData.showSunday = checked ? true : true;
      }
      
      return newData;
    });
  };

  // Функция получения времени начала/конца для дня недели
  const getWorkingHours = (day) => {
    if (!scheduleData || !scheduleData.working_hours || !scheduleData.working_hours[day]) {
      return { start: '', end: '' };
    }
    return {
      start: scheduleData.working_hours[day].start,
      end: scheduleData.working_hours[day].end
    };
  };

  // Функция для преобразования времени в минуты от 7:00
  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours - 7) * 60 + minutes;
  };

  // Функция для преобразования минут обратно в формат времени
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60) + 7;
    const mins = minutes % 60;
    return `${hours < 10 ? '0' + hours : hours}:${mins < 10 ? '0' + mins : mins}`;
  };

  // Получение значения для слайдера
  const getSliderValue = (day) => {
    const hours = getWorkingHours(day);
    return [
      timeToMinutes(hours.start || '09:00'),
      timeToMinutes(hours.end || '18:00')
    ];
  };

  // Обработчик изменения слайдера времени
  const handleSliderChange = (day, newValue) => {
    if (!editMode) return;
    
    const [startMinutes, endMinutes] = newValue;
    const startTime = minutesToTime(startMinutes);
    const endTime = minutesToTime(endMinutes);
    
    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      newData.working_hours[day] = {
        start: startTime,
        end: endTime
      };
      
      return newData;
    });
  };

  // Обработчик изменения времени через селект
  const handleTimeSelectChange = (day, field, value) => {
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

  // Создание временных опций для селект
  const timeOptions = [];
  for (let hour = 7; hour <= 23; hour++) {
    for (let minute of ['00', '15', '30', '45']) {
      timeOptions.push(`${hour < 10 ? '0' + hour : hour}:${minute}`);
    }
  }
  timeOptions.push('24:00');

  // Метки для слайдера времени
  const timeMarks = [];
  for (let hour = 7; hour <= 24; hour++) {
    timeMarks.push({
      value: (hour - 7) * 60,
      label: `${hour}:00`
    });
  }

  // Обработчик открытия меню копирования
  const handleCopyClick = (event, day) => {
    setSelectedDayToCopy(day);
    setCopyMenuAnchor(event.currentTarget);
  };

  // Обработчик закрытия меню копирования
  const handleCopyClose = () => {
    setCopyMenuAnchor(null);
  };

  // Обработчик копирования расписания в другой день
  const handleCopyTo = (targetDay) => {
    if (!editMode) return;
    
    if (scheduleData.working_hours && scheduleData.working_hours[selectedDayToCopy]) {
      setScheduleData(prev => {
        const newData = { ...prev };
        if (!newData.working_hours) {
          newData.working_hours = {};
        }
        newData.working_hours[targetDay] = { ...newData.working_hours[selectedDayToCopy] };
        return newData;
      });
    }
    handleCopyClose();
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

  // Сокращенные имена дней недели
  const shortDayNames = {
    'Понедельник': 'Пн',
    'Вторник': 'Вт',
    'Среда': 'Ср',
    'Четверг': 'Чт',
    'Пятница': 'Пт',
    'Суббота': 'Сб',
    'Воскресенье': 'Вс'
  };

  // Полные имена дней недели
  const dayNames = {
    'Понедельник': 'Понедельник',
    'Вторник': 'Вторник',
    'Среда': 'Среда',
    'Четверг': 'Четверг',
    'Пятница': 'Пятница',
    'Суббота': 'Суббота',
    'Воскресенье': 'Воскресенье'
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        mb: 2, 
        background: primaryGradient,
        color: 'white',
        borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={onClose}
            sx={{ 
              color: '#ffffff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Настройка расписания сотрудника
            </Typography>
        </Box>
        
        <Box>
          {!editMode ? (
            <Button
              variant="contained"
              onClick={handleEditMode}
              startIcon={<EditIcon />}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                mr: 1
              }}
            >
              Редактировать
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleCancelEdit}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  mr: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Отмена
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSchedule}
                startIcon={<SaveIcon />}
                sx={{ 
                  bgcolor: '#008080',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    bgcolor: '#006666',
                  }
                }}
              >
                Сохранить
              </Button>
            </>
          )}
        </Box>
        </Box>

      {/* Информация о сотруднике */}
      {employeeInfo && (
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          borderRadius: 3,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 35, 0.95)' : 'rgba(250, 250, 250, 0.95)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                              border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={employeeInfo.profile_image} 
              sx={{ width: 56, height: 56, mr: 2 }}
            >
              {employeeInfo.first_name?.charAt(0)}{employeeInfo.last_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {employeeInfo.first_name} {employeeInfo.last_name}
                              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employeeInfo.position || 'Специалист'} • {employeeInfo.salon_name || 'Салон не указан'}
                                </Typography>
                              </Box>
                            </Box>
        </Paper>
      )}

      {/* Быстрые шаблоны расписания */}
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        borderRadius: 3,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 35, 0.95)' : 'rgba(250, 250, 250, 0.95)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
          mb: 2 
        }}>
          <ScheduleIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Быстрые шаблоны расписания
                    </Typography>
        </Box>
                  
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Button
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => {
              if (editMode) {
                const standardWeek = {
                  'Понедельник': { start: '09:00', end: '18:00', is_working: true },
                  'Вторник': { start: '09:00', end: '18:00', is_working: true },
                  'Среда': { start: '09:00', end: '18:00', is_working: true },
                  'Четверг': { start: '09:00', end: '18:00', is_working: true },
                  'Пятница': { start: '09:00', end: '18:00', is_working: true },
                  'Суббота': { start: '00:00', end: '00:00', is_working: false },
                  'Воскресенье': { start: '00:00', end: '00:00', is_working: false },
                };
                setScheduleData(prev => ({ ...prev, working_hours: standardWeek }));
              }
            }}
            disabled={!editMode}
                        sx={{ 
              bgcolor: '#3f51b5',
                          '&:hover': {
                bgcolor: '#303f9f',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(63, 81, 181, 0.5)',
                color: 'rgba(255, 255, 255, 0.6)',
              }
            }}
          >
            Стандартная неделя
                      </Button>
          
          <Button 
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => {
              if (editMode) {
                const dailySchedule = {
                  'Понедельник': { start: '09:00', end: '18:00', is_working: true },
                  'Вторник': { start: '09:00', end: '18:00', is_working: true },
                  'Среда': { start: '09:00', end: '18:00', is_working: true },
                  'Четверг': { start: '09:00', end: '18:00', is_working: true },
                  'Пятница': { start: '09:00', end: '18:00', is_working: true },
                  'Суббота': { start: '09:00', end: '18:00', is_working: true },
                  'Воскресенье': { start: '09:00', end: '18:00', is_working: true },
                };
                setScheduleData(prev => ({ ...prev, working_hours: dailySchedule }));
              }
            }}
            disabled={!editMode}
                          sx={{ 
              bgcolor: '#9c27b0',
                            '&:hover': {
                bgcolor: '#7b1fa2',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(156, 39, 176, 0.5)',
                color: 'rgba(255, 255, 255, 0.6)',
              }
            }}
          >
            Ежедневно
          </Button>
          
          <Button 
            variant="contained"
            startIcon={<CalendarMonthIcon />}
            onClick={() => {
              if (editMode) {
                const weekendSchedule = {
                  'Понедельник': { start: '09:00', end: '18:00', is_working: true },
                  'Вторник': { start: '09:00', end: '18:00', is_working: true },
                  'Среда': { start: '09:00', end: '18:00', is_working: true },
                  'Четверг': { start: '09:00', end: '18:00', is_working: true },
                  'Пятница': { start: '09:00', end: '18:00', is_working: true },
                  'Суббота': { start: '10:00', end: '15:00', is_working: true },
                  'Воскресенье': { start: '00:00', end: '00:00', is_working: false },
                };
                setScheduleData(prev => ({ ...prev, working_hours: weekendSchedule }));
              }
            }}
            disabled={!editMode}
                            sx={{ 
              bgcolor: '#009688',
              '&:hover': {
                bgcolor: '#00796b',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(0, 150, 136, 0.5)',
                color: 'rgba(255, 255, 255, 0.6)',
              }
            }}
          >
            Стандарт + короткая суббота
          </Button>
                    </Box>
      </Paper>

      {/* Дни недели */}
      {!isLoadingSchedule && !scheduleError && !isLoadingEmployee && !employeeError && scheduleData && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map((day) => {
            const daySchedule = scheduleData.working_hours[day] || { start: '09:00', end: '18:00', is_working: false };
            const isWorkDay = daySchedule.is_working !== false && daySchedule.start && daySchedule.end;

            return (
                <Paper 
                key={day} 
                  elevation={0} 
                  sx={{ 
                  borderRadius: 3,
                    overflow: 'hidden',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  },
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 35, 0.95)' : 'rgba(250, 250, 250, 0.95)',
                    border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
              >
                <Box 
                            sx={{ 
                    p: 2, 
                    pb: 1.5, 
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    background: isWorkDay 
                      ? theme.palette.mode === 'dark' 
                        ? 'linear-gradient(to right, rgba(46, 125, 50, 0.2), rgba(46, 125, 50, 0.05))' 
                        : 'linear-gradient(to right, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.02))'
                      : theme.palette.mode === 'dark'
                        ? 'linear-gradient(to right, rgba(211, 47, 47, 0.2), rgba(211, 47, 47, 0.05))'
                        : 'linear-gradient(to right, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.02))'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                            sx={{ 
                        width: 38, 
                        height: 38, 
                        mr: 2,
                        bgcolor: isWorkDay 
                          ? theme.palette.success.main 
                          : theme.palette.error.main,
                        color: '#fff',
                              fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                    >
                      {shortDayNames[day]}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                            sx={{ 
                          fontWeight: 600,
                          color: isWorkDay ? theme.palette.text.primary : theme.palette.text.secondary,
                          mb: 0.3
                        }}
                      >
                        {isMobile ? shortDayNames[day] : dayNames[day]}
                      </Typography>
                      {isWorkDay && (
                        <Chip 
                          size="small" 
                          label={`${daySchedule.start} - ${daySchedule.end}`}
                            sx={{ 
                            height: 24, 
                            fontSize: '0.75rem',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                            borderRadius: 1,
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    <Switch
                      checked={isWorkDay}
                      onChange={(e) => editMode && handleWorkingDayChange(day, e.target.checked)}
                      disabled={!editMode}
                      color="success"
                      sx={{ mr: 0.5 }}
                    />
                    <Tooltip title="Копировать расписание">
                      <IconButton 
                        size="small" 
                        onClick={(e) => editMode && handleCopyClick(e, day)}
                        disabled={!editMode || !isWorkDay}
                              sx={{ 
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                          },
                          ml: 1
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {isWorkDay && (
                  <Box sx={{ p: 2, pt: 2 }}>
                    <Box 
                                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        px: 1.5
                      }}
                    >
                      <AccessTimeIcon 
                        fontSize="small" 
                                      sx={{ 
                          color: theme.palette.text.secondary,
                          mr: 2 
                        }} 
                      />
                      <Box
                                    sx={{ 
                          width: '100%',
                          height: 28,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                          borderRadius: 1.5,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Time scale background */}
                        <Box 
                                    sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            px: 1,
                            '& > span': {
                              flex: 1,
                              textAlign: 'center',
                              fontSize: '0.65rem',
                              color: theme.palette.text.disabled,
                              fontWeight: 500
                            }
                          }}
                        >
                          {[7, 10, 13, 16, 19, 22].map(hour => (
                            <span key={hour}>{hour}:00</span>
                          ))}
                        </Box>
                        
                        {/* Active hours highlight */}
                        <Box 
                                    sx={{ 
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: `${((timeToMinutes(daySchedule.start)) / (17 * 60)) * 100}%`,
                            width: `${((timeToMinutes(daySchedule.end) - timeToMinutes(daySchedule.start)) / (17 * 60)) * 100}%`,
                            background: 'linear-gradient(90deg, rgba(76,175,80,0.5) 0%, rgba(76,175,80,0.7) 100%)',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#fff', 
                              fontWeight: 'bold', 
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              fontSize: '0.75rem'
                            }}
                          >
                            {`${daySchedule.start} - ${daySchedule.end}`}
                                    </Typography>
                                  </Box>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 2, 
                      gap: 2 
                    }}>
                      <Box sx={{ width: '48%' }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Начало
                                  </Typography>
                        <TextField
                          select
                          value={daySchedule.start}
                          onChange={(e) => editMode && handleTimeSelectChange(day, 'start', e.target.value)}
                          disabled={!editMode}
                          fullWidth
                          variant="outlined"
                                    size="small"
                          SelectProps={{
                            MenuProps: {
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                },
                              },
                            },
                          }}
                                    sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                            }
                          }}
                        >
                          {timeOptions.map(time => (
                            <MenuItem key={time} value={time}>
                              {time}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                      
                      <Box sx={{ width: '48%' }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Конец
                                  </Typography>
                        <TextField
                          select
                          value={daySchedule.end}
                          onChange={(e) => editMode && handleTimeSelectChange(day, 'end', e.target.value)}
                          disabled={!editMode}
                          fullWidth
                                    variant="outlined"
                                    size="small"
                          SelectProps={{
                            MenuProps: {
                              PaperProps: {
                                style: {
                                  maxHeight: 300,
                                },
                              },
                            },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                            }
                          }}
                        >
                          {timeOptions.map(time => (
                            <MenuItem key={time} value={time}>
                              {time}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
                          );
                        })}
        </Box>
      )}

      {/* Menu for copy to other days */}
      <Menu
        anchorEl={copyMenuAnchor}
        open={Boolean(copyMenuAnchor)}
        onClose={handleCopyClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: 'text.secondary' }}>
          Скопировать в день:
        </Typography>
        {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'].map((day) => (
          <MenuItem 
            key={day} 
            onClick={() => handleCopyTo(day)}
            disabled={day === selectedDayToCopy}
            sx={{
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none'
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28, 
                mr: 2,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.75rem'
              }}
            >
              {shortDayNames[day]}
            </Avatar>
            <ListItemText primary={day} />
          </MenuItem>
        ))}
      </Menu>
      
      {/* Time off dialog */}
      <Dialog open={timeOffDialogOpen} onClose={() => setTimeOffDialogOpen(false)}>
        <DialogTitle>Добавить выходной день</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Выберите дату и укажите причину выходного:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} locale={ruLocale}>
            <DatePicker
              label="Дата"
              value={selectedDayForTimeOff}
              onChange={handleTimeOffDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
          </Box>
          <TextField
            margin="normal"
            label="Причина"
            fullWidth
            value={timeOffReason}
            onChange={(e) => setTimeOffReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeOffDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleAddTimeOff} variant="contained" color="primary">
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSchedule; 