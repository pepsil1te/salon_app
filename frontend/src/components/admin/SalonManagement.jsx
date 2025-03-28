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
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  InputAdornment,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Table, 
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControlLabel,
  Switch,
  Menu
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { salonApi } from '../../api/salons';
import { serviceApi } from '../../api/services';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const SalonManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [salonData, setSalonData] = useState({
    name: '',
    address: '',
    phone: '',
    working_hours: '',
    description: '',
    status: 'active',
    image_url: '',
    email: '',
    website: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [openServicesDialog, setOpenServicesDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const navigate = useNavigate();

  // Получение списка салонов
  const {
    data: salons,
    isLoading: isLoadingSalons,
    error: salonsError,
    refetch: refetchSalons
  } = useQuery(
    'salons', // Фиксированный ключ
    () => salonApi.getAll(),
    {
      staleTime: 300000, // 5 минут
      refetchOnMount: false, // Не обновлять при монтировании
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    }
  );

  // Добавляем эффект для принудительного перерендеринга при изменении данных
  useEffect(() => {
    // Эффект для обновления UI при изменении данных салонов
    // Отключаем вывод в консоль
    // if (salons) {
    //   console.log('Данные салонов обновлены:', salons);
    // }
  }, [salons]);

  // Форматирование рабочих часов для отображения в карточке
  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return 'Нет данных';
    
    // Если это уже строка, возвращаем её
    if (typeof workingHours === 'string') {
      return workingHours;
    }
    
    // Преобразуем индексы дней в названия
    const daysNames = {
      '0': 'Вс',
      '1': 'Пн',
      '2': 'Вт',
      '3': 'Ср',
      '4': 'Чт',
      '5': 'Пт',
      '6': 'Сб'
    };
    
    try {
      // Группируем дни по одинаковому расписанию
      const scheduleMap = {};
      
      Object.entries(workingHours).forEach(([day, hours]) => {
        if (!hours) return; // Пропускаем выходные
        
        const schedule = `${hours.start}-${hours.end}`;
        if (!scheduleMap[schedule]) {
          scheduleMap[schedule] = [];
        }
        scheduleMap[schedule].push(daysNames[day]);
      });
      
      // Формируем строку с сгруппированными днями
      const formattedSchedule = Object.entries(scheduleMap).map(([schedule, days]) => {
        // Находим непрерывные последовательности дней
        let formattedDays = '';
        let current = [];
        
        days.sort((a, b) => {
          const dayIndices = { 'Пн': 0, 'Вт': 1, 'Ср': 2, 'Чт': 3, 'Пт': 4, 'Сб': 5, 'Вс': 6 };
          return dayIndices[a] - dayIndices[b];
        });
        
        for (let i = 0; i < days.length; i++) {
          const dayIndex = Object.keys(daysNames).find(key => daysNames[key] === days[i]);
          const nextDayIndex = i < days.length - 1 ? 
            Object.keys(daysNames).find(key => daysNames[key] === days[i + 1]) : null;
          
          if (current.length === 0) {
            current.push(days[i]);
          } else if (nextDayIndex && parseInt(dayIndex) + 1 === parseInt(nextDayIndex)) {
            current.push(days[i + 1]);
            i++;
          } else {
            if (current.length > 2) {
              formattedDays += `${formattedDays ? ', ' : ''}${current[0]}-${current[current.length - 1]}`;
            } else {
              formattedDays += `${formattedDays ? ', ' : ''}${current.join(', ')}`;
            }
            current = [];
            i--;
          }
        }
        
        if (current.length > 0) {
          if (current.length > 2) {
            formattedDays += `${formattedDays ? ', ' : ''}${current[0]}-${current[current.length - 1]}`;
          } else {
            formattedDays += `${formattedDays ? ', ' : ''}${current.join(', ')}`;
          }
        }
        
        // Форматируем итоговую строку
        const [start, end] = schedule.split('-');
        return `${formattedDays}: ${start}-${end}`;
      });
      
      // Добавляем выходные дни, если есть
      const closedDays = Object.entries(workingHours)
        .filter(([_, hours]) => !hours)
        .map(([day]) => daysNames[day]);
        
      if (closedDays.length > 0) {
        formattedSchedule.push(`${closedDays.join(', ')}: выходной`);
      }
      
      return formattedSchedule.join(', ');
    } catch (error) {
      console.error('Ошибка при форматировании рабочих часов:', error);
      return String(workingHours) || 'Нет данных';
    }
  };

  // Получение списка сервисов для конкретного салона
  const {
    data: salonServices,
    isLoading: isLoadingSalonServices,
    error: salonServicesError
  } = useQuery(
    ['salonServices', selectedSalonId],
    () => serviceApi.getBySalon(selectedSalonId),
    {
      enabled: !!selectedSalonId && openServicesDialog,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );

  // Мутация для создания салона
  const createSalonMutation = useMutation(
    (salonData) => salonApi.create(salonData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salons']);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Салон успешно создан',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при создании салона: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для обновления салона
  const updateSalonMutation = useMutation(
    ({ id, data }) => salonApi.update(id, data),
    {
      onSuccess: async (updatedSalon) => {
        // Закрываем диалог
        handleCloseDialog();
        
        // Показываем индикатор загрузки данных
        setSnackbar({
          open: true,
          message: 'Салон обновлен',
          severity: 'info'
        });
        
        // Инвалидируем кеш и обновляем данные салона в кеше
        queryClient.setQueryData('salons', (oldData) => {
          if (!oldData) return [updatedSalon];
          
          // Заменяем обновленный салон в массиве данных
          return oldData.map(salon => 
            salon.id === updatedSalon.id ? updatedSalon : salon
          );
        });
        
        // Инвалидируем кеш для последующих запросов
        queryClient.invalidateQueries('salons');
        
        setSnackbar({
          open: true,
          message: 'Салон успешно обновлен',
          severity: 'success'
        });
      },
      onError: (error) => {
        console.error('Ошибка обновления салона:', error);
        setSnackbar({
          open: true,
          message: `Ошибка при обновлении салона: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для удаления салона
  const deleteSalonMutation = useMutation(
    (id) => salonApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salons']);
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: 'Салон успешно удален',
          severity: 'success'
        });
      },
      onError: (error) => {
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: `Ошибка при удалении салона: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSalonData(prev => ({ ...prev, [name]: value }));
    
    // Сброс ошибки валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!salonData.name.trim()) {
      errors.name = 'Название салона обязательно';
    }
    
    if (!salonData.address.trim()) {
      errors.address = 'Адрес салона обязателен';
    }
    
    if (!salonData.phone.trim()) {
      errors.phone = 'Телефон салона обязателен';
    } else if (!/^\+?[0-9\s-()]{10,17}$/.test(salonData.phone)) {
      errors.phone = 'Неверный формат телефона';
    }
    
    // Проверяем рабочие часы - теперь это объект, а не строка
    if (typeof salonData.working_hours === 'string') {
      // Если по какой-то причине это всё еще строка, проверяем как раньше
      if (!salonData.working_hours.trim()) {
        errors.working_hours = 'Часы работы обязательны';
      }
    } else if (!salonData.working_hours || typeof salonData.working_hours !== 'object') {
      // Проверка на null/undefined или неверный тип
      errors.working_hours = 'Часы работы обязательны';
    } else {
      // Проверяем, есть ли хотя бы один рабочий день
      const hasWorkingDay = Object.values(salonData.working_hours).some(hours => hours !== null);
      if (!hasWorkingDay) {
        errors.working_hours = 'Должен быть указан хотя бы один рабочий день';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Обработчик открытия диалога добавления салона
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setSalonData({
      name: '',
      address: '',
      phone: '',
      working_hours: '',
      description: '',
      status: 'active',
      image_url: '',
      email: '',
      website: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Обработчик открытия диалога редактирования салона
  const handleOpenEditDialog = (salon) => {
    setDialogMode('edit');
    setOpenDialog(true);
    // Подготавливаем данные для формы, преобразуя JSON объект working_hours в строку
    setSalonData({
      name: salon.name,
      phone: salon.contact_info?.phone || '',
      address: salon.address,
      // Форматируем рабочие часы для отображения в форме
      working_hours: formatWorkingHoursForForm(salon.working_hours),
      description: salon.description || '',
      status: salon.status || 'active',
      image_url: salon.image_url || '',
      email: salon.contact_info?.email || '',
      website: salon.contact_info?.website || ''
    });
    setSelectedSalonId(salon.id);
  };

  // Функция для форматирования рабочих часов для формы
  const formatWorkingHoursForForm = (workingHours) => {
    if (typeof workingHours === 'string') {
      return workingHours;
    }

    try {
      // Обратное преобразование из JSON в строку для редактирования
      const daysNames = {
        '0': 'Вс',
        '1': 'Пн',
        '2': 'Вт',
        '3': 'Ср',
        '4': 'Чт',
        '5': 'Пт',
        '6': 'Сб'
      };

      // Группируем дни по расписанию
      const scheduleGroups = {};
      
      Object.entries(workingHours).forEach(([day, hours]) => {
        if (!hours) {
          // Обрабатываем выходные дни отдельно
          if (!scheduleGroups['closed']) {
            scheduleGroups['closed'] = [];
          }
          scheduleGroups['closed'].push(daysNames[day]);
          return;
        }
        
        const schedule = `${hours.start}-${hours.end}`;
        if (!scheduleGroups[schedule]) {
          scheduleGroups[schedule] = [];
        }
        scheduleGroups[schedule].push(daysNames[day]);
      });
      
      // Сортируем дни в каждой группе
      Object.values(scheduleGroups).forEach(days => {
        days.sort((a, b) => {
          const dayOrder = { 'Пн': 0, 'Вт': 1, 'Ср': 2, 'Чт': 3, 'Пт': 4, 'Сб': 5, 'Вс': 6 };
          return dayOrder[a] - dayOrder[b];
        });
      });
      
      // Формируем строку для каждой группы
      const parts = [];
      
      // Сначала добавляем рабочие дни
      Object.entries(scheduleGroups).forEach(([schedule, days]) => {
        if (schedule === 'closed') return; // Пропускаем выходные
        
        // Определяем непрерывные диапазоны дней
        let formattedDays = '';
        let currentRange = [];
        
        for (let i = 0; i < days.length; i++) {
          const currentDay = days[i];
          const dayOrder = { 'Пн': 0, 'Вт': 1, 'Ср': 2, 'Чт': 3, 'Пт': 4, 'Сб': 5, 'Вс': 6 };
          
          if (currentRange.length === 0) {
            currentRange.push(currentDay);
          } else {
            const lastDay = currentRange[currentRange.length - 1];
            if (dayOrder[currentDay] === dayOrder[lastDay] + 1) {
              currentRange.push(currentDay);
            } else {
              // Завершаем текущий диапазон
              if (currentRange.length > 1) {
                formattedDays += (formattedDays ? ', ' : '') + 
                               `${currentRange[0]}-${currentRange[currentRange.length - 1]}`;
              } else {
                formattedDays += (formattedDays ? ', ' : '') + currentRange[0];
              }
              currentRange = [currentDay];
            }
          }
        }
        
        // Обрабатываем последний диапазон
        if (currentRange.length > 0) {
          if (currentRange.length > 1) {
            formattedDays += (formattedDays ? ', ' : '') + 
                           `${currentRange[0]}-${currentRange[currentRange.length - 1]}`;
          } else {
            formattedDays += (formattedDays ? ', ' : '') + currentRange[0];
          }
        }
        
        parts.push(`${formattedDays}: ${schedule}`);
      });
      
      // Добавляем выходные дни
      if (scheduleGroups['closed'] && scheduleGroups['closed'].length > 0) {
        const closedDays = scheduleGroups['closed'];
        let formattedClosedDays = '';
        
        if (closedDays.length > 1) {
          if (closedDays.length === 7) {
            return 'Ежедневно: выходной';
          } else {
            formattedClosedDays = `${closedDays.join(', ')}: выходной`;
          }
        } else {
          formattedClosedDays = `${closedDays[0]}: выходной`;
        }
        
        parts.push(formattedClosedDays);
      }
      
      return parts.join(', ');
    } catch (error) {
      console.error('Ошибка при форматировании рабочих часов для формы:', error);
      return 'Пн-Пт: 09:00-18:00, Сб: 10:00-16:00, Вс: выходной';
    }
  };

  // Обработчик закрытия диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSalonData({
      name: '',
      address: '',
      phone: '',
      working_hours: '',
      description: '',
      status: 'active',
      image_url: '',
      email: '',
      website: ''
    });
    setValidationErrors({});
  };

  // Обработчик открытия диалога услуг салона
  const handleOpenServicesDialog = (salonId) => {
    setSelectedSalonId(salonId);
    setOpenServicesDialog(true);
  };

  // Обработчик закрытия диалога услуг
  const handleCloseServicesDialog = () => {
    setOpenServicesDialog(false);
    setSelectedSalonId(null);
  };

  // Обработчик открытия диалога удаления
  const handleOpenDeleteDialog = (salonId) => {
    setSelectedSalonId(salonId);
    setOpenDeleteDialog(true);
  };

  // Обработчик закрытия диалога удаления
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedSalonId(null);
  };

  // Добавим новый компонент для выбора времени работы
  const TimeRangePicker = ({ value, onChange }) => {
    // Состояние для хранения рабочих часов по дням недели
    const [workingHours, setWorkingHours] = useState(() => {
      try {
        // Пробуем распарсить значение, если оно передано как объект
        if (typeof value === 'object' && value !== null) {
          return value;
        }
        
        // Если передано как строка и в JSON формате
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          return JSON.parse(value);
        }
        
        // Иначе используем значение по умолчанию
        return {
          '1': { start: '09:00', end: '18:00' }, // Пн
          '2': { start: '09:00', end: '18:00' }, // Вт
          '3': { start: '09:00', end: '18:00' }, // Ср
          '4': { start: '09:00', end: '18:00' }, // Чт
          '5': { start: '09:00', end: '18:00' }, // Пт
          '6': { start: '10:00', end: '16:00' }, // Сб
          '0': null  // Вс - выходной
        };
      } catch (error) {
        console.error('Ошибка при парсинге рабочих часов:', error);
        
        // Возвращаем дефолтное значение в случае ошибки
        return {
          '1': { start: '09:00', end: '18:00' }, // Пн
          '2': { start: '09:00', end: '18:00' }, // Вт
          '3': { start: '09:00', end: '18:00' }, // Ср
          '4': { start: '09:00', end: '18:00' }, // Чт
          '5': { start: '09:00', end: '18:00' }, // Пт
          '6': { start: '10:00', end: '16:00' }, // Сб
          '0': null  // Вс - выходной
        };
      }
    });
    
    // Названия дней недели
    const dayNames = {
      '1': 'Понедельник',
      '2': 'Вторник',
      '3': 'Среда',
      '4': 'Четверг',
      '5': 'Пятница',
      '6': 'Суббота',
      '0': 'Воскресенье'
    };
    
    // Порядок дней недели для отображения (начиная с понедельника)
    const daysOrder = ['1', '2', '3', '4', '5', '6', '0'];
    
    // Обработчик изменения времени работы
    const handleTimeChange = (day, field, value) => {
      const updatedHours = { ...workingHours };
      
      // Если день был закрыт (null), создаем новую запись с дефолтными значениями
      if (!updatedHours[day] && field !== 'isOpen') {
        updatedHours[day] = { start: '09:00', end: '18:00' };
      }
      
      // Обрабатываем переключение выходного дня
      if (field === 'isOpen') {
        updatedHours[day] = value ? { start: '09:00', end: '18:00' } : null;
      } else {
        updatedHours[day][field] = value;
      }
      
      setWorkingHours(updatedHours);
      onChange(updatedHours);
    };
    
    // Быстрое копирование расписания
    const [anchorEl, setAnchorEl] = useState(null);
    const [dayToCopyFrom, setDayToCopyFrom] = useState(null);
    
    const handleCopyClick = (event, day) => {
      setAnchorEl(event.currentTarget);
      setDayToCopyFrom(day);
    };
    
    const handleCopyClose = () => {
      setAnchorEl(null);
      setDayToCopyFrom(null);
    };
    
    const handleCopyTo = (targetDay) => {
      if (dayToCopyFrom !== null && targetDay !== dayToCopyFrom) {
        const updatedHours = { ...workingHours };
        updatedHours[targetDay] = workingHours[dayToCopyFrom] 
          ? { ...workingHours[dayToCopyFrom] } 
          : null;
        
        setWorkingHours(updatedHours);
        onChange(updatedHours);
      }
      handleCopyClose();
    };
    
    // Быстрая установка рабочих дней будни/выходные
    const handleQuickSet = (preset) => {
      const updatedHours = { ...workingHours };
      
      if (preset === 'weekdays') {
        // Рабочие дни - Пн-Пт: 9:00-18:00, выходные - Сб, Вс
        for (let i = 1; i <= 5; i++) {
          updatedHours[i] = { start: '09:00', end: '18:00' };
        }
        updatedHours['6'] = null;
        updatedHours['0'] = null;
      } else if (preset === 'everyday') {
        // Рабочие дни - каждый день 9:00-18:00
        for (let i = 0; i <= 6; i++) {
          updatedHours[i] = { start: '09:00', end: '18:00' };
        }
      } else if (preset === 'weekends-short') {
        // Рабочие дни - Пн-Пт: 9:00-18:00, Сб: 10:00-16:00, Вс: выходной
        for (let i = 1; i <= 5; i++) {
          updatedHours[i] = { start: '09:00', end: '18:00' };
        }
        updatedHours['6'] = { start: '10:00', end: '16:00' };
        updatedHours['0'] = null;
      }
      
      setWorkingHours(updatedHours);
      onChange(updatedHours);
    };
    
    // Часы для выбора (с 7:00 до 24:00)
    const timeOptions = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute of ['00', '30']) {
        timeOptions.push(`${hour < 10 ? '0' + hour : hour}:${minute}`);
      }
    }
    timeOptions.push('24:00');
    
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Установите время работы салона для каждого дня недели
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickSet('weekdays')}
          >
            Пн-Пт (9-18)
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickSet('everyday')}
          >
            Ежедневно (9-18)
          </Button>
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleQuickSet('weekends-short')}
          >
            Пн-Пт (9-18), Сб (10-16)
          </Button>
        </Box>
        
        <Paper variant="outlined" sx={{ p: 2 }}>
          {daysOrder.map(day => (
            <Grid container spacing={2} key={day} sx={{ mb: 1.5, alignItems: 'center' }}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={workingHours[day] !== null}
                        onChange={(e) => handleTimeChange(day, 'isOpen', e.target.checked)}
                      />
                    }
                    label={dayNames[day]}
                  />
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleCopyClick(e, day)}
                    disabled={workingHours[day] === null}
                    title="Копировать расписание"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
              
              {workingHours[day] !== null ? (
                <>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`start-time-label-${day}`}>Начало</InputLabel>
                      <Select
                        labelId={`start-time-label-${day}`}
                        value={workingHours[day]?.start || '09:00'}
                        label="Начало"
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <MenuItem 
                            key={time} 
                            value={time}
                            disabled={time >= (workingHours[day]?.end || '18:00')}
                          >
                            {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`end-time-label-${day}`}>Конец</InputLabel>
                      <Select
                        labelId={`end-time-label-${day}`}
                        value={workingHours[day]?.end || '18:00'}
                        label="Конец"
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                      >
                        {timeOptions.map(time => (
                          <MenuItem 
                            key={time} 
                            value={time}
                            disabled={time <= (workingHours[day]?.start || '09:00')}
                          >
                            {time}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" color="text.secondary">
                    Выходной день
                  </Typography>
                </Grid>
              )}
            </Grid>
          ))}
        </Paper>
        
        {/* Меню для копирования расписания */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCopyClose}
        >
          <MenuItem disabled>
            <Typography variant="caption">Копировать на:</Typography>
          </MenuItem>
          {daysOrder
            .filter(day => day !== dayToCopyFrom)
            .map(day => (
              <MenuItem key={day} onClick={() => handleCopyTo(day)}>
                {dayNames[day]}
              </MenuItem>
            ))
          }
        </Menu>
      </Box>
    );
  };

  // Обработчик сохранения салона
  const handleSaveSalon = () => {
    if (validateForm()) {
      // Преобразование данных в формат, ожидаемый сервером
      const preparedData = {
        name: salonData.name,
        address: salonData.address,
        // Формируем объект контактной информации
        contact_info: {
          phone: salonData.phone,
          email: salonData.email || '',
          website: salonData.website || ''
        },
        // Используем объект рабочих часов, а не строку
        working_hours: salonData.working_hours,
        // Добавляем остальные поля, если они есть
        ...(salonData.status && { status: salonData.status }),
        ...(salonData.image_url && { image_url: salonData.image_url }),
        ...(salonData.description && { description: salonData.description })
      };

      console.log('Отправляемые данные:', preparedData);

      if (dialogMode === 'add') {
        createSalonMutation.mutate(preparedData);
      } else {
        updateSalonMutation.mutate({ id: selectedSalonId, data: preparedData });
      }
    }
  };

  // Обработчик удаления салона
  const handleDeleteSalon = () => {
    if (selectedSalonId) {
      deleteSalonMutation.mutate(selectedSalonId);
    }
  };

  // Обработчик закрытия snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Фильтрация салонов по поисковому запросу
  const filteredSalons = salons?.filter(salon => 
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Тестовые данные для услуг салона
  const mockSalonServices = [
    {
      id: 1,
      name: 'Женская стрижка',
      category: 'Волосы',
      price: 1500,
      duration: 60,
      description: 'Профессиональная женская стрижка с учетом типа волос и формы лица'
    },
    {
      id: 2,
      name: 'Маникюр',
      category: 'Ногти',
      price: 1000,
      duration: 45,
      description: 'Профессиональный маникюр с обработкой кутикулы'
    },
    {
      id: 3,
      name: 'Окрашивание волос',
      category: 'Волосы',
      price: 3000,
      duration: 120,
      description: 'Окрашивание волос профессиональными красителями'
    }
  ];

  // Используем реальные данные из API или тестовые, если API не вернуло результат
  const displayFilteredSalons = searchQuery
    ? filteredSalons
    : salons || [];

  const displaySalonServices = salonServices || mockSalonServices;

  // Обработчик перехода к управлению услугами для конкретного салона
  const handleNavigateToServiceManagement = (salonId) => {
    // Закрываем текущий диалог
    handleCloseServicesDialog();
    
    // Установим выбранный салон в глобальном состоянии, сохранив его в localStorage
    localStorage.setItem('selectedSalonIdForServices', salonId);
    
    // Получаем родительский элемент (TabPanel), который содержит вкладки
    const tabsElement = document.querySelector('[role="tablist"]');
    
    if (tabsElement) {
      // Находим вкладку "Услуги" (индекс 1) и программно кликаем по ней
      const servicesTab = tabsElement.children[1]; // Вкладка "Услуги" (индекс 1)
      if (servicesTab) {
        servicesTab.click();
      }
    }
  };

  if (isLoadingSalons) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (salonsError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка при загрузке салонов: {salonsError.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Управление салонами
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Добавить салон
          </Button>
        </Box>
      </Box>

      {/* Поиск салонов */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск по названию или адресу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Список салонов */}
      {displayFilteredSalons.length > 0 ? (
        <Grid container spacing={3}>
          {displayFilteredSalons.map((salon) => (
            <Grid item xs={12} md={6} lg={4} key={salon.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {salon.name}
                    </Typography>
                    <Chip 
                      label={salon.status === 'maintenance' ? 'На обслуживании' : 'Активен'} 
                      color={salon.status === 'maintenance' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <LocationOnIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {salon.address}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <PhoneIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {salon.contact_info?.phone || salon.phone || 'Не указан'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <AccessTimeIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatWorkingHours(salon.working_hours)}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Услуг: {salon.services_count || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Сотрудников: {salon.employees_count || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {salon.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      {salon.description}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleOpenServicesDialog(salon.id)}
                  >
                    Услуги
                  </Button>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenEditDialog(salon)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDeleteDialog(salon.id)}
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          {searchQuery 
            ? "Салоны по вашему запросу не найдены. Попробуйте изменить параметры поиска." 
            : "Список салонов пуст. Нажмите 'Добавить салон', чтобы создать новый салон."
          }
        </Alert>
      )}

      {/* Диалог добавления/редактирования салона */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Добавить новый салон' : 'Редактировать данные салона'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Название салона"
                value={salonData.name}
                onChange={handleInputChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Телефон"
                value={salonData.phone}
                onChange={handleInputChange}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Адрес"
                value={salonData.address}
                onChange={handleInputChange}
                error={!!validationErrors.address}
                helperText={validationErrors.address}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Часы работы</Typography>
              <TimeRangePicker 
                value={salonData.working_hours} 
                onChange={(hours) => setSalonData(prev => ({ ...prev, working_hours: hours }))} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Статус</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={salonData.status}
                  label="Статус"
                  onChange={handleInputChange}
                >
                  <MenuItem value="active">Активен</MenuItem>
                  <MenuItem value="maintenance">На обслуживании</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="image_url"
                label="URL изображения"
                value={salonData.image_url}
                onChange={handleInputChange}
                fullWidth
                placeholder="https://example.com/salon.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                value={salonData.email}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="website"
                label="Website"
                value={salonData.website}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Описание"
                value={salonData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveSalon}
            disabled={createSalonMutation.isLoading || updateSalonMutation.isLoading}
          >
            {dialogMode === 'add' ? 'Добавить' : 'Сохранить'}
            {(createSalonMutation.isLoading || updateSalonMutation.isLoading) && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра услуг салона */}
      <Dialog open={openServicesDialog} onClose={handleCloseServicesDialog} maxWidth="md" fullWidth>
        <DialogTitle>Услуги салона</DialogTitle>
        <DialogContent>
          {isLoadingSalonServices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : salonServicesError ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Ошибка при загрузке услуг: {salonServicesError.message}
            </Alert>
          ) : (
            <>
              {displaySalonServices.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Название</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell align="right">Цена (₽)</TableCell>
                        <TableCell align="right">Длительность (мин)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displaySalonServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>
                            <Chip label={service.category} size="small" />
                          </TableCell>
                          <TableCell align="right">{service.price}</TableCell>
                          <TableCell align="right">{service.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ my: 2 }}>
                  В этом салоне пока нет услуг.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServicesDialog}>Закрыть</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleNavigateToServiceManagement(selectedSalonId);
            }}
          >
            Управление услугами
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот салон? Это действие невозможно отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button 
            color="error" 
            onClick={handleDeleteSalon}
            disabled={deleteSalonMutation.isLoading}
          >
            Удалить
            {deleteSalonMutation.isLoading && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default SalonManagement; 