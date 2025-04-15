import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  AppBar,
  Toolbar,
  Fab,
  Avatar,
  InputBase,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  ListItemIcon,
  Slider,
  Fade
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
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import SpaIcon from '@mui/icons-material/Spa';
import SettingsIcon from '@mui/icons-material/Settings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';
import EmployeeManagement from './EmployeeManagement';
import ServiceManagement from './ServiceManagement';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WeekendIcon from '@mui/icons-material/Weekend';
import EventIcon from '@mui/icons-material/Event';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';

// Tab Panel component for salon details
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`salon-manage-tabpanel-${index}`}
      aria-labelledby={`salon-manage-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `salon-manage-tab-${index}`,
    'aria-controls': `salon-manage-tabpanel-${index}`,
  };
}

const SalonManagement = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    email: '',
    website: '',
    is_active: true,
    logo: '',
    cover_image: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [openServicesDialog, setOpenServicesDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  // New state for managing salon
  const [openManageDialog, setOpenManageDialog] = useState(false);
  const [manageSalonId, setManageSalonId] = useState(null);
  const [manageSalonName, setManageSalonName] = useState('');
  const [manageTabValue, setManageTabValue] = useState(0);

  // Add a new state for the working hours dialog
  const [openWorkingHoursDialog, setOpenWorkingHoursDialog] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (file) => {
    console.log('File uploaded:', file);
    setIsUploading(true);
    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false);
      setSalonData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
    }, 2000);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      handleFileUpload(file);
    }
  };

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
        
        // Проверяем, что start и end определены и валидны
        if (!hours.start || !hours.end) {
          // Если времена не определены, помечаем как закрыто
          if (!scheduleMap['closed']) {
            scheduleMap['closed'] = [];
          }
          scheduleMap['closed'].push(daysNames[day]);
          return;
        }
        
        const schedule = `${hours.start}-${hours.end}`;
        if (!scheduleMap[schedule]) {
          scheduleMap[schedule] = [];
        }
        scheduleMap[schedule].push(daysNames[day]);
      });
      
      // Формируем строку с сгруппированными днями
      const formattedSchedule = Object.entries(scheduleMap).map(([schedule, days]) => {
        // Если это закрытые дни
        if (schedule === 'closed') {
          return `${days.join(', ')}: выходной`;
        }
        
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
        return `${formattedDays}: ${schedule}`;
      });
      
      // Добавляем выходные дни, если есть
      const closedDays = Object.entries(workingHours)
        .filter(([_, hours]) => !hours)
        .map(([day]) => daysNames[day]);
        
      if (closedDays.length > 0 && !scheduleMap['closed']) {
        formattedSchedule.push(`${closedDays.join(', ')}: выходной`);
      }
      
      return formattedSchedule.join(', ');
    } catch (error) {
      console.error('Ошибка при форматировании рабочих часов:', error);
      return String(workingHours) || 'Нет данных';
    }
  };

  // Helper function to format salon count text based on count
  const getSalonCountText = (count) => {
    if (count === 0) return 'салонов';
    if (count === 1) return 'салон';
    if (count >= 2 && count <= 4) return 'салона';
    return 'салонов';
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
      email: '',
      website: '',
      is_active: true,
      logo: '',
      cover_image: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Обработчик открытия диалога редактирования салона
  const handleOpenEditDialog = (salonId) => {
    setDialogMode('edit');
    
    // Check if we received a salon object instead of just an ID
    let salon;
    let id;
    
    if (typeof salonId === 'object' && salonId !== null && salonId.id) {
      // A salon object was passed in
      salon = salonId;
      id = salon.id;
    } else {
      // Just an ID was passed in
      id = salonId;
      salon = salons.find(s => s.id === id);
    }
    
    setSelectedSalonId(id);
    console.log('Opening edit dialog for salon:', salon);
    
    if (salon) {
      const parsedWorkingHours = typeof salon.working_hours === 'string' 
        ? parseWorkingHoursFromForm(salon.working_hours) 
        : salon.working_hours;
      
      // Задаем данные салона в форме
    setSalonData({
        name: salon.name || '',
        address: salon.address || '',
      phone: salon.contact_info?.phone || '',
        email: salon.contact_info?.email || '',
        website: salon.contact_info?.website || '',
      image_url: salon.image_url || '',
        description: salon.description || '',
        working_hours: parsedWorkingHours,
        is_active: salon.is_active !== false, // Ensure is_active is a boolean with default true
        logo: salon.logo || '',
        cover_image: salon.cover_image || ''
      });
      console.log('Setting salon data:', {
        name: salon.name || '',
        address: salon.address || '',
        phone: salon.contact_info?.phone || '',
      email: salon.contact_info?.email || '',
        website: salon.contact_info?.website || '',
        image_url: salon.image_url || '',
        description: salon.description || '',
        is_active: salon.is_active !== false
      });
    } else {
      console.error('Salon not found with ID:', id);
    }
    
    setOpenDialog(true);
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
      email: '',
      website: '',
      is_active: true,
      logo: '',
      cover_image: ''
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
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

    // Короткие названия дней для мобильной версии
    const shortDayNames = {
      '1': 'Пн',
      '2': 'Вт',
      '3': 'Ср',
      '4': 'Чт',
      '5': 'Пт',
      '6': 'Сб',
      '0': 'Вс'
    };
    
    // Порядок дней недели для отображения (начиная с понедельника)
    const daysOrder = ['1', '2', '3', '4', '5', '6', '0'];
    
    // Обработчик изменения времени
    const handleTimeChange = (day, field, value) => {
      setWorkingHours(prev => {
        const newHours = { ...prev };
        
        // Если день еще не имеет часов (был выходным), создаем объект с часами
        if (!newHours[day]) {
          newHours[day] = { start: '09:00', end: '18:00' };
        }
        
        // Обработка переключателя isOpen
        if (field === 'isOpen') {
          if (!value) {
            // Если выключаем день, устанавливаем null (выходной)
            newHours[day] = null;
          }
          // Если включаем день - оставляем текущие значения или дефолтные
        } else {
        // Обновляем конкретное значение (начало или конец)
        newHours[day] = { 
          ...newHours[day], 
          [field]: value || (field === 'start' ? '09:00' : '18:00') 
        };
        
        // Проверяем валидность - если какое-то значение undefined, ставим значение по умолчанию
        if (!newHours[day].start) newHours[day].start = '09:00';
        if (!newHours[day].end) newHours[day].end = '18:00';
        }
        
        // Вызываем коллбэк onChange, если он есть
        if (onChange) {
          onChange(newHours);
        }
        
        return newHours;
      });
    };

    // Обработчик включения/выключения рабочего дня
    const handleToggleWorkDay = (day, checked) => {
      setWorkingHours(prev => {
        const newHours = { ...prev };
        
        if (checked) {
          // Если включаем день, устанавливаем стандартное время
          newHours[day] = { start: '09:00', end: '18:00' };
        } else {
          // Если выключаем день, устанавливаем null (выходной)
          newHours[day] = null;
        }
        
        // Вызываем коллбэк onChange
        if (onChange) {
          onChange(newHours);
        }
        
        return newHours;
      });
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
    
    // Часы для выбора (с 7:00 до 24:00) с 15-минутными интервалами
    const timeOptions = [];
    for (let hour = 7; hour <= 23; hour++) {
      for (let minute of ['00', '15', '30', '45']) {
        timeOptions.push(`${hour < 10 ? '0' + hour : hour}:${minute}`);
      }
    }
    timeOptions.push('24:00');

    // Времена для отображения в визуальном слайдере
    const timeMarks = [];
    for (let hour = 7; hour <= 24; hour++) {
      timeMarks.push({
        value: (hour - 7) * 60,
        label: `${hour}:00`
      });
    }

    // Преобразует время в формате "HH:MM" в минуты от начала дня (07:00)
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return (hours - 7) * 60 + minutes;
    };

    // Преобразует минуты обратно в формат "HH:MM"
    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60) + 7;
      const mins = minutes % 60;
      return `${hours < 10 ? '0' + hours : hours}:${mins < 10 ? '0' + mins : mins}`;
    };

    // Обработчик изменения для визуального слайдера
    const handleSliderChange = (day, value) => {
      const [startMinutes, endMinutes] = value;
      const startTime = minutesToTime(startMinutes);
      const endTime = minutesToTime(endMinutes);
      
      setWorkingHours(prev => {
        const newHours = { ...prev };
        if (!newHours[day]) {
          newHours[day] = { start: startTime, end: endTime };
        } else {
          newHours[day] = { 
            ...newHours[day], 
            start: startTime,
            end: endTime
          };
        }
        
        if (onChange) {
          onChange(newHours);
        }
        
        return newHours;
      });
    };

    // Получение значений слайдера для конкретного дня
    const getSliderValue = (day) => {
      if (!workingHours[day]) return [0, 0];
      return [
        timeToMinutes(workingHours[day].start),
        timeToMinutes(workingHours[day].end)
      ];
    };
    
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
          Настройка расписания работы салона
        </Typography>
        
        <Box sx={{ 
          mb: 4, 
          p: 2, 
          borderRadius: 2, 
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(25, 118, 210, 0.08)' 
            : 'rgba(25, 118, 210, 0.05)',
          border: '1px dashed',
          borderColor: theme.palette.primary.main,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              fontWeight: 500
            }}
          >
            <InfoIcon fontSize="small" color="info" />
            Настройте рабочие часы салона для каждого дня недели
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Эти настройки влияют на доступное время для записи клиентов
          </Typography>
        </Box>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(250,250,250,0.9)',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(to right bottom, rgba(80,80,100,0.1), rgba(30,30,40,0.05))' 
              : 'linear-gradient(to right bottom, rgba(255,255,255,0.6), rgba(240,240,240,0.3))'
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 2, 
              color: theme.palette.text.secondary,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <EventNoteIcon fontSize="small" color="primary" />
            Быстрые шаблоны расписания
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1.5, 
            mb: 1,
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
          <Button 
              size="medium" 
              variant="contained" 
              color="primary"
              sx={{ 
                borderRadius: 3, 
                px: 2.5,
                py: 1,
                boxShadow: '0 4px 10px rgba(63, 81, 181, 0.25)',
                background: 'linear-gradient(45deg, #3f51b5, #5c6bc0)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 15px rgba(63, 81, 181, 0.35)',
                  background: 'linear-gradient(45deg, #303f9f, #3f51b5)'
                }
              }}
            onClick={() => handleQuickSet('weekdays')}
              startIcon={<EventNoteIcon />}
          >
              Стандартная неделя
          </Button>
          <Button 
              size="medium" 
              variant="contained"
              sx={{ 
                borderRadius: 3, 
                px: 2.5,
                py: 1,
                boxShadow: '0 4px 10px rgba(156, 39, 176, 0.25)',
                background: 'linear-gradient(45deg, #9c27b0, #ba68c8)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 15px rgba(156, 39, 176, 0.35)',
                  background: 'linear-gradient(45deg, #7b1fa2, #9c27b0)'
                }
              }}
            onClick={() => handleQuickSet('everyday')}
              startIcon={<CalendarMonthIcon />}
          >
              Ежедневно
          </Button>
          <Button 
              size="medium" 
              variant="contained"
              sx={{ 
                borderRadius: 3, 
                px: 2.5,
                py: 1,
                boxShadow: '0 4px 10px rgba(0, 150, 136, 0.25)',
                background: 'linear-gradient(45deg, #009688, #4db6ac)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 15px rgba(0, 150, 136, 0.35)',
                  background: 'linear-gradient(45deg, #00796b, #009688)'
                }
              }}
            onClick={() => handleQuickSet('weekends-short')}
              startIcon={<WeekendIcon />}
          >
              Стандарт + короткая суббота
          </Button>
        </Box>
        </Paper>
        
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5
          }}
        >
          {daysOrder.map(day => (
            <Paper 
              key={day} 
              elevation={3} 
              sx={{ 
                p: 0, 
                borderRadius: 2.5,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  transform: 'translateY(-2px)'
                },
                overflow: 'hidden',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0,0,0,0.05)',
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
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
                    background: workingHours[day] 
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
                        bgcolor: workingHours[day] 
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
                          color: workingHours[day] ? theme.palette.text.primary : theme.palette.text.secondary,
                          mb: 0.3
                        }}
                      >
                        {isMobile ? shortDayNames[day] : dayNames[day]}
                      </Typography>
                      {workingHours[day] && (
                        <Chip 
                          size="small" 
                          label={`${workingHours[day]?.start} - ${workingHours[day]?.end}`}
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
                        checked={workingHours[day] !== null}
                      onChange={(e) => handleToggleWorkDay(day, e.target.checked)}
                      color="success"
                      sx={{ mr: 0.5 }}
                      />
                    <Tooltip title="Копировать расписание">
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleCopyClick(e, day)}
                    disabled={workingHours[day] === null}
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
              
              {workingHours[day] !== null ? (
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
                            left: `${((timeToMinutes(workingHours[day].start)) / (17 * 60)) * 100}%`,
                            width: `${((timeToMinutes(workingHours[day].end) - timeToMinutes(workingHours[day].start)) / (17 * 60)) * 100}%`,
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
                            {`${workingHours[day].start} - ${workingHours[day].end}`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ px: 1, pt: 0.5, pb: 1.5 }}>
                      <Slider
                        value={getSliderValue(day)}
                        onChange={(_, newValue) => handleSliderChange(day, newValue)}
                        min={0}
                        max={17 * 60} // 17 часов с 7:00 до 24:00
                        step={15} // 15-минутный шаг
                        marks={isMobile ? [] : timeMarks.filter((_, i) => i % 3 === 0)} // На мобильных устройствах скрываем метки
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => minutesToTime(value)}
                        sx={{
                          '& .MuiSlider-thumb': {
                            height: 20,
                            width: 20,
                            backgroundColor: '#fff',
                            border: '2px solid currentColor',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                              boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                            },
                            '&:before': {
                              display: 'none',
                            },
                          },
                          '& .MuiSlider-track': {
                            height: 6,
                            borderRadius: 3
                          },
                          '& .MuiSlider-rail': {
                            height: 6,
                            borderRadius: 3,
                            opacity: 0.3,
                            backgroundColor: theme.palette.mode === 'dark' ? '#bfbfbf' : '#727272',
                          },
                          '& .MuiSlider-mark': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#bbb' : '#888',
                            height: 8,
                            width: 1,
                            marginTop: -2
                          },
                          '& .MuiSlider-markLabel': {
                            fontSize: '0.7rem',
                            color: theme.palette.text.secondary
                          }
                        }}
                      />
                    </Box>
                    
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`start-time-label-${day}`}>Начало</InputLabel>
                      <Select
                        labelId={`start-time-label-${day}`}
                        value={workingHours[day]?.start || '09:00'}
                        label="Начало"
                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                              },
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'
                            }}
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
                      <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`end-time-label-${day}`}>Конец</InputLabel>
                      <Select
                        labelId={`end-time-label-${day}`}
                        value={workingHours[day]?.end || '18:00'}
                        label="Конец"
                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                              },
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'
                            }}
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
            </Grid>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      p: 3, 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      height: '100%',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.15)' : 'rgba(244,67,54,0.08)',
                        mb: 1.5
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 28, color: theme.palette.error.main }} />
                    </Box>
                    <Typography color="text.secondary" variant="body2" align="center" sx={{ fontWeight: 500 }}>
                      Выходной день
                    </Typography>
                    <Button 
                      size="small" 
                      sx={{ 
                        mt: 2, 
                        color: theme.palette.primary.main,
                        borderColor: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(63,81,181,0.15)' : 'rgba(63,81,181,0.08)'
                        }
                      }} 
                      variant="outlined"
                      onClick={() => handleToggleWorkDay(day, true)}
                    >
                      Сделать рабочим
                    </Button>
                  </Box>
                )}
              </Box>
        </Paper>
          ))}
        </Box>
        
        {/* Меню для копирования расписания */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCopyClose}
          elevation={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { 
              borderRadius: 2,
              minWidth: 180,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 0.7 }}>
            <Typography variant="body2" fontWeight="medium">Копировать на:</Typography>
          </MenuItem>
          <Divider />
          {daysOrder
            .filter(day => day !== dayToCopyFrom)
            .map(day => (
              <MenuItem 
                key={day} 
                onClick={() => handleCopyTo(day)}
                sx={{
                  py: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ListItemIcon>
                  <EventIcon fontSize="small" color="action" />
                </ListItemIcon>
                <Typography variant="body2">{dayNames[day]}</Typography>
              </MenuItem>
            ))
          }
        </Menu>
      </Box>
    );
  };

  // Функция для парсинга строки с рабочими часами в объект
  const parseWorkingHoursFromForm = (workingHoursStr) => {
    // Если уже объект - возвращаем как есть
    if (typeof workingHoursStr === 'object' && workingHoursStr !== null) {
      return workingHoursStr;
    }
    
    // Дефолтное значение на случай ошибки
    const defaultHours = {
      '1': { start: '09:00', end: '18:00' }, // Пн
      '2': { start: '09:00', end: '18:00' }, // Вт
      '3': { start: '09:00', end: '18:00' }, // Ср
      '4': { start: '09:00', end: '18:00' }, // Чт
      '5': { start: '09:00', end: '18:00' }, // Пт
      '6': { start: '10:00', end: '16:00' }, // Сб
      '0': null  // Вс - выходной
    };
    
    try {
      // Попытка прямого парсинга JSON (на случай если это уже JSON строка)
      if (typeof workingHoursStr === 'string' && workingHoursStr.startsWith('{') && workingHoursStr.endsWith('}')) {
        return JSON.parse(workingHoursStr);
      }
      
      // Парсим из строки формата "Пн-Пт: 09:00-18:00, Сб: 10:00-16:00, Вс: выходной"
      const result = { ...defaultHours };
      const dayMapping = {
        'Пн': '1', 'Вт': '2', 'Ср': '3', 'Чт': '4', 'Пт': '5', 'Сб': '6', 'Вс': '0'
      };
      
      // Если строка пустая или не строка, возвращаем дефолт
      if (!workingHoursStr || typeof workingHoursStr !== 'string') {
        return defaultHours;
      }
      
      // Разбиваем строку на части по запятой
      const parts = workingHoursStr.split(',').map(part => part.trim());
      
      parts.forEach(part => {
        if (!part.includes(':')) return; // Пропускаем некорректные части
        
        const [daysStr, hoursStr] = part.split(':').map(s => s.trim());
        
        // Обработка выходных дней
        if (hoursStr === 'выходной') {
          processDays(daysStr).forEach(day => {
            result[day] = null;
          });
          return;
        }
        
        // Обработка рабочих дней
        const timeMatch = hoursStr.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const [, startRaw, endRaw] = timeMatch;
          
          // Нормализация времени (добавление ведущих нулей)
          const start = startRaw.length === 4 ? '0' + startRaw : startRaw;
          const end = endRaw.length === 4 ? '0' + endRaw : endRaw;
        
        processDays(daysStr).forEach(day => {
            result[day] = { start, end };
        });
        }
      });
      
      return result;
    } catch (error) {
      console.error('Ошибка при парсинге рабочих часов:', error);
      return defaultHours;
    }
  };
  
  // Вспомогательная функция для обработки строки с днями
  const processDays = (daysStr) => {
    const dayMapping = {
      'Пн': '1', 'Вт': '2', 'Ср': '3', 'Чт': '4', 'Пт': '5', 'Сб': '6', 'Вс': '0'
    };
    
    // Если входящие данные уже числа, возвращаем их как есть
    if (/^[0-6]$/.test(daysStr)) {
      return [daysStr];
    }
    
    let result = [];
    
    // Обработка диапазонов дней, например "Пн-Пт"
    if (daysStr.includes('-')) {
      const [start, end] = daysStr.split('-').map(d => d.trim());
      
      // Проверяем, что диапазон корректный
      if (dayMapping[start] && dayMapping[end]) {
        const startIdx = parseInt(dayMapping[start]);
        const endIdx = parseInt(dayMapping[end]);
        
        // Обработка диапазона, учитывая цикличность недели (0-6)
        if (startIdx <= endIdx) {
        for (let i = startIdx; i <= endIdx; i++) {
            result.push(i.toString());
          }
        } else {
          // Случай, когда диапазон переходит через воскресенье (Сб-Вт)
          for (let i = startIdx; i <= 6; i++) {
            result.push(i.toString());
          }
          for (let i = 0; i <= endIdx; i++) {
            result.push(i.toString());
          }
        }
      }
    } else {
      // Одиночный день
      const day = daysStr.trim();
      if (dayMapping[day]) {
        result.push(dayMapping[day]);
      }
    }
    
    return result;
  };
  
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
        // Преобразуем строку рабочих часов в объект
        working_hours: parseWorkingHoursFromForm(salonData.working_hours),
        // Добавляем остальные поля, если они есть
        ...(salonData.status && { status: salonData.status }),
        ...(salonData.image_url && { image_url: salonData.image_url }),
        ...(salonData.description && { description: salonData.description }),
        is_active: salonData.is_active === true, // Ensure it's a boolean value
        ...(salonData.logo && { logo: salonData.logo }),
        ...(salonData.cover_image && { cover_image: salonData.cover_image })
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
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Обработчик для перехода к странице сервисов салона
  const handleNavigateToServiceManagement = (salonId) => {
    navigate(`/admin/services?salonId=${salonId}`);
  };

  // Обработчик для перехода к странице сотрудников салона
  const handleOpenEmployees = (salonId) => {
    navigate(`/admin/employees?salonId=${salonId}`);
  };

  // Обработчик для перехода к подробной информации о салоне
  const handleOpenSalonDetails = (salonId) => {
    navigate(`/admin/salons/${salonId}`);
  };

  // Обработчик загрузки изображения
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      setSalonData(prev => ({
        ...prev,
        [type === 'logo' ? 'logo' : 'cover_image']: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Обработчик изменения рабочих часов
  const handleWorkingHoursChange = (e) => {
    const { name, value } = e.target;
    const dayIndex = name.split('.')[1];
    
    setSalonData(prev => ({
      ...prev,
      working_hours: {
        ...prev.working_hours,
        [dayIndex]: value === 'closed' ? null : value
      }
    }));
  };

  // Фильтрованные салоны согласно строке поиска
  const filteredSalons = salons ? salons.filter(salon => 
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (salon.address && salon.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (salon.phone && salon.phone.includes(searchQuery))
  ) : [];

  // Используем только реальные данные из API
  const displaySalonServices = salonServices || [];

  // New functions for salon management dialog
  const handleOpenManageDialog = (salon) => {
    setManageSalonId(salon.id);
    setManageSalonName(salon.name);
    setOpenManageDialog(true);
  };

  const handleCloseManageDialog = () => {
    setOpenManageDialog(false);
    setManageSalonId(null);
    setManageSalonName('');
    setManageTabValue(0);
  };

  const handleChangeManageTab = (event, newValue) => {
    setManageTabValue(newValue);
  };

  // Update the navigation handlers to go to the Reports tab
  const handleViewSalonRevenue = (salonId) => {
    console.log('Navigating to revenue stats for salon:', salonId);
    try {
      // Navigate to the Reports tab in the admin panel
      navigate('/admin', { state: { activeTab: 1, salonId: salonId, reportType: 'revenue' } });
      setSnackbar({
        open: true,
        message: 'Переход к финансовой статистике',
        severity: 'info'
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при переходе к странице статистики',
        severity: 'error'
      });
    }
  };

  const handleViewSalonAppointments = (salonId) => {
    console.log('Navigating to appointment stats for salon:', salonId);
    try {
      // Navigate to the Reports tab in the admin panel
      navigate('/admin', { state: { activeTab: 1, salonId: salonId, reportType: 'appointments' } });
      setSnackbar({
        open: true,
        message: 'Переход к статистике записей',
        severity: 'info'
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при переходе к странице статистики',
        severity: 'error'
      });
    }
  };

  // Add handlers for the working hours dialog
  const handleOpenWorkingHoursDialog = (salon) => {
    setDialogMode('edit');
    setSelectedSalonId(salon.id);
    // Parse working hours into proper format for the time picker
    const parsedHours = typeof salon.working_hours === 'string' 
      ? parseWorkingHoursFromForm(salon.working_hours) 
      : salon.working_hours;
    
    setSalonData(prev => ({ 
      ...prev, 
      working_hours: parsedHours 
    }));
    setOpenWorkingHoursDialog(true);
  };

  const handleCloseWorkingHoursDialog = () => {
    setOpenWorkingHoursDialog(false);
  };

  const handleSaveWorkingHours = () => {
    if (selectedSalonId && salonData.working_hours) {
      // Get the salon that's being edited
      const salon = salons.find(s => s.id === selectedSalonId);
      if (!salon) return;
      
      // Prepare data for update
      const preparedData = {
        ...salon,
        working_hours: salonData.working_hours,
      };
      
      // Update only the working hours
      updateSalonMutation.mutate({ 
        id: selectedSalonId, 
        data: preparedData 
      });
      
      // Close dialog after save
      setOpenWorkingHoursDialog(false);
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
      <Alert severity="error" sx={{ m: 2 }}>
        Ошибка при загрузке данных: {salonsError.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      {/* Header section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: 'linear-gradient(90deg, rgba(63,81,181,0.15) 0%, rgba(0,0,0,0) 100%)',
        borderRadius: 2,
        py: 2,
        px: 3
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 0.5 
            }}
          >
          Управление салонами
        </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredSalons.length} {getSalonCountText(filteredSalons.length)} в системе
          </Typography>
        </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          sx={{ 
            px: 3, 
            py: 1.2,
            borderRadius: 3,
            background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
            boxShadow: '0 3px 10px rgba(63, 81, 181, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #303f9f 30%, #3f51b5 90%)',
              boxShadow: '0 5px 14px rgba(63, 81, 181, 0.4)'
            }
          }}
          >
            Добавить салон
          </Button>
      </Box>

      {/* Improved search bar with more modern styling */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0.5, 
          mb: 4, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 6px 25px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <TextField
          placeholder="Поиск салонов"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="standard"
          size="medium"
          fullWidth
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'primary.main', ml: 2, fontSize: 24 }} />
              </InputAdornment>
            ),
            sx: { 
              py: 1.2, 
              fontSize: '1.05rem',
              '& input::placeholder': {
                color: 'text.secondary',
                opacity: 0.7
              }
            }
          }}
        />
      </Paper>

      {/* Content area */}
      {isLoadingSalons ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        </Box>
      ) : salonsError ? (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
          }}
        >
          Ошибка при загрузке данных. Пожалуйста, попробуйте обновить страницу.
        </Alert>
      ) : (
        <Box>
      {filteredSalons.length > 0 ? (
        <Grid container spacing={3}>
          {filteredSalons.map((salon) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={salon.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        height: 180,
                        overflow: 'hidden'
                      }}
                    >
                      {/* Decorative background pattern if no cover image - more vibrant colors */}
                      {!salon.cover_image && (
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: salon.is_active 
                              ? 'linear-gradient(135deg, #5c6bc0 0%, #3949ab 100%)' 
                              : 'linear-gradient(135deg, #78909c 0%, #546e7a 100%)',
                            opacity: 1,
                            zIndex: 0
                          }}
                        />
                      )}
                      
                      {/* Cover image */}
                      {salon.cover_image && (
                        <Box 
                          component="img"
                          src={salon.cover_image}
                          alt={salon.name}
                          sx={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      )}
                      
                      {/* Improved dark overlay for text legibility */}
                      <Box sx={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.75) 100%)',
                        zIndex: 1
                      }} />
                      
                      {/* Status badge - top right corner - improved colors */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: salon.is_active ? '#4caf50' : '#f44336',
                          color: '#fff',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 6,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        {salon.is_active ? (
                          <>
                            <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Активен</Typography>
                          </>
                        ) : (
                          <>
                            <ErrorIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Неактивен</Typography>
                          </>
                        )}
                      </Box>
                      
                      {/* Salon name - on bottom of image - improved typography */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          px: 2,
                          pb: 2,
                          zIndex: 2
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          component="h2" 
                          sx={{ 
                            color: 'white',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            fontWeight: 700,
                            mb: 0.5,
                            letterSpacing: '0.02em'
                          }}
                        >
                      {salon.name}
                    </Typography>
                      </Box>
                  </Box>
                  
                    <CardContent sx={{ pt: 3, pb: 1, px: 2.5, flexGrow: 1 }}>
                      {/* Address - improved icon colors */}
                      <Box sx={{ 
                        display: 'flex', 
                        mb: 1.5,
                        alignItems: 'flex-start', 
                        mt: 1,
                        px: 0.5
                      }}>
                        <LocationOnIcon sx={{ color: '#f06292', mr: 1.5, fontSize: 20, mt: 0.3 }} />
                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.4, fontSize: '0.925rem' }}>
                      {salon.address}
                    </Typography>
                  </Box>
                  
                      {/* Phone - improved icon colors */}
                      <Box sx={{ 
                        display: 'flex', 
                        mb: 1.5, 
                        alignItems: 'flex-start',
                        px: 0.5
                      }}>
                        <PhoneIcon sx={{ color: '#64b5f6', mr: 1.5, fontSize: 20, mt: 0.3 }} />
                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.4, fontSize: '0.925rem' }}>
                      {salon.contact_info?.phone || salon.phone || 'Не указан'}
                    </Typography>
                  </Box>
                  
                      {/* Working hours - improved icon colors */}
                      <Box sx={{ 
                        display: 'flex', 
                        mb: 2.5, 
                        alignItems: 'flex-start',
                        px: 0.5
                      }}>
                        <AccessTimeIcon sx={{ color: '#ffb74d', mr: 1.5, fontSize: 20, mt: 0.3 }} />
                        <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.4, fontSize: '0.925rem' }}>
                          {typeof salon.working_hours === 'object' ? formatWorkingHours(salon.working_hours) : (salon.working_hours || 'Не указан')}
                    </Typography>
                  </Box>
                  
                      {/* Updated Stats boxes - Revenue and Daily Appointments - clickable */}
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                    <Grid item xs={6}>
                            <Paper
                              elevation={0}
                              onClick={() => handleViewSalonRevenue(salon.id)}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundImage: 'linear-gradient(45deg, rgba(66, 179, 70, 0.12), rgba(124, 211, 117, 0.25))',
                                textAlign: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                },
                                '&:active': {
                                  backgroundColor: 'rgba(66, 179, 70, 0.3)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MonetizationOnIcon fontSize="small" sx={{ color: '#4caf50', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Выручка
                      </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: '#4caf50' }}>
                                {salon.revenue ? `${salon.revenue} ₽` : '0 ₽'}
                              </Typography>
                            </Paper>
                    </Grid>
                          
                    <Grid item xs={6}>
                            <Paper
                              elevation={0}
                              onClick={() => handleViewSalonAppointments(salon.id)}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                backgroundImage: 'linear-gradient(45deg, rgba(63, 81, 181, 0.12), rgba(92, 107, 192, 0.25))',
                                textAlign: 'center',
                                transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                                cursor: 'pointer',
                                '&:hover': {
                                  transform: 'scale(1.03)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                },
                                '&:active': {
                                  backgroundColor: 'rgba(63, 81, 181, 0.3)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <EventNoteIcon fontSize="small" sx={{ color: '#5c6bc0', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Записи/день
                      </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: '#5c6bc0' }}>
                                {salon.daily_appointments || '0'}
                              </Typography>
                            </Paper>
                    </Grid>
                  </Grid>
                      </Box>
                </CardContent>
                
                    <CardActions 
                      sx={{ 
                        p: 2, 
                        pt: 0.5, 
                        pb: 2,
                        px: 2.5,
                        justifyContent: 'center',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                        mt: 'auto'
                      }}
                    >
                      <Button
                        variant="contained"
                        size="medium"
                      color="primary"
                        onClick={() => handleOpenManageDialog(salon)}
                        startIcon={<ManageAccountsIcon />}
                        sx={{ 
                          borderRadius: 12,
                          px: 4,
                          py: 1.2,
                          background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
                          boxShadow: '0 3px 10px rgba(63, 81, 181, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #303f9f 30%, #3f51b5 90%)',
                            boxShadow: '0 5px 14px rgba(63, 81, 181, 0.4)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Управление
                      </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
            <Alert 
              severity="info" 
              variant="filled"
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
              }}
            >
          {searchQuery 
            ? "Салоны по вашему запросу не найдены. Попробуйте изменить параметры поиска." 
            : "Список салонов пуст. Нажмите 'Добавить салон', чтобы создать новый салон."
          }
        </Alert>
          )}
        </Box>
      )}

      {/* Salon Management Dialog */}
      <Dialog
        open={openManageDialog}
        onClose={handleCloseManageDialog}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, rgba(26, 32, 48, 0.4) 0%, rgba(10, 15, 24, 0.3) 100%)' 
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(240, 242, 245, 0.7) 100%)'
          }
        }}
      >
        <AppBar 
          position="sticky" 
          elevation={4} 
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundImage: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, rgba(49, 58, 115, 0.8) 0%, rgba(63, 81, 181, 0.6) 100%)'
              : 'linear-gradient(90deg, rgba(86, 101, 210, 0.8) 0%, rgba(121, 134, 203, 0.6) 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(63, 81, 181, 0.15)'
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseManageDialog}
              aria-label="close"
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                transition: 'background-color 0.3s ease',
                mr: 2
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                flex: 1, 
                fontWeight: 700,
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <StoreIcon sx={{ mr: 1.5, fontSize: 28 }} />
              {manageSalonName}
            </Typography>
          </Toolbar>
        </AppBar>
        
        {/* Redesigned tabs with cards instead of traditional tabs */}
        <Box sx={{ px: 3, py: 2.5, background: 'rgba(63, 81, 181, 0.03)' }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={4} sm={4}>
              <Card 
                onClick={() => setManageTabValue(0)}
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: manageTabValue === 0 
                    ? (theme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.25)' : 'rgba(63, 81, 181, 0.1)')
                    : 'background.paper',
                  boxShadow: manageTabValue === 0
                    ? '0 8px 20px rgba(63, 81, 181, 0.2)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid',
                  borderColor: manageTabValue === 0
                    ? 'primary.main'
                    : 'divider',
                  transform: manageTabValue === 0 ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease',
                  height: { xs: 120, sm: 150 },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(63, 81, 181, 0.2)' 
                      : 'rgba(63, 81, 181, 0.08)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 15px rgba(63, 81, 181, 0.15)'
                  }
                }}
              >
                <Box 
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5 },
                    mb: { xs: 0.5, sm: 1.5 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <StoreIcon fontSize={isMobile ? "medium" : "large"} />
                </Box>
                <Typography 
                  variant={isMobile ? "body1" : "h6"}
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: manageTabValue === 0 
                      ? 'primary.main' 
                      : 'text.primary',
                    fontSize: { xs: '0.85rem', sm: '1rem' }
                  }}
                >
                  Информация
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={4} sm={4}>
              <Card 
                onClick={() => setManageTabValue(1)}
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: manageTabValue === 1 
                    ? (theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.25)' : 'rgba(103, 58, 183, 0.1)')
                    : 'background.paper',
                  boxShadow: manageTabValue === 1
                    ? '0 8px 20px rgba(103, 58, 183, 0.2)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid',
                  borderColor: manageTabValue === 1
                    ? '#673ab7'
                    : 'divider',
                  transform: manageTabValue === 1 ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease',
                  height: { xs: 120, sm: 150 },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(103, 58, 183, 0.2)' 
                      : 'rgba(103, 58, 183, 0.08)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 15px rgba(103, 58, 183, 0.15)'
                  }
                }}
              >
                <Box 
                  sx={{
                    bgcolor: '#673ab7',
                    color: '#fff',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5 },
                    mb: { xs: 0.5, sm: 1.5 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <SpaIcon fontSize={isMobile ? "medium" : "large"} />
                </Box>
                <Typography 
                  variant={isMobile ? "body1" : "h6"}
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: manageTabValue === 1 
                      ? '#673ab7' 
                      : 'text.primary',
                    fontSize: { xs: '0.85rem', sm: '1rem' }
                  }}
                >
                  Услуги
                </Typography>
              </Card>
            </Grid>
            
            <Grid item xs={4} sm={4}>
              <Card 
                onClick={() => setManageTabValue(2)}
                sx={{
                  p: { xs: 1, sm: 2 },
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  bgcolor: manageTabValue === 2 
                    ? (theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.25)' : 'rgba(0, 150, 136, 0.1)')
                    : 'background.paper',
                  boxShadow: manageTabValue === 2
                    ? '0 8px 20px rgba(0, 150, 136, 0.2)'
                    : '0 2px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid',
                  borderColor: manageTabValue === 2
                    ? '#009688'
                    : 'divider',
                  transform: manageTabValue === 2 ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.3s ease',
                  height: { xs: 120, sm: 150 },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(0, 150, 136, 0.2)' 
                      : 'rgba(0, 150, 136, 0.08)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 15px rgba(0, 150, 136, 0.15)'
                  }
                }}
              >
                <Box 
                  sx={{
                    bgcolor: '#009688',
                    color: '#fff',
                    borderRadius: '50%',
                    p: { xs: 1, sm: 1.5 },
                    mb: { xs: 0.5, sm: 1.5 },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <PeopleIcon fontSize={isMobile ? "medium" : "large"} />
                </Box>
                <Typography 
                  variant={isMobile ? "body1" : "h6"}
                  sx={{ 
                    textAlign: 'center',
                    fontWeight: 600,
                    color: manageTabValue === 2 
                      ? '#009688' 
                      : 'text.primary',
                    fontSize: { xs: '0.85rem', sm: '1rem' }
                  }}
                >
                  Сотрудники
                </Typography>
              </Card>
            </Grid>
            </Grid>
        </Box>
        
        <Box 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            height: 'calc(100% - 200px)', 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
            }
          }}
        >
          {/* Main content area based on selected tab */}
          {manageTabValue === 0 && manageSalonId && (
            <Box>
              {isLoadingSalons ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                  <CircularProgress size={60} thickness={5} sx={{ color: 'primary.main' }} />
                </Box>
              ) : (
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      mb: 4, 
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(to right, rgba(103, 58, 183, 0.15), rgba(63, 81, 181, 0.05))'
                        : 'linear-gradient(to right, rgba(103, 58, 183, 0.1), rgba(63, 81, 181, 0.02))',
                        borderRadius: 2,
                      py: 2,
                      px: 3
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoIcon sx={{ 
                        fontSize: '2rem', 
                        color: theme.palette.primary.main,
                        mr: 2
                      }} />
                      <Box>
                        <Typography 
                          variant="h5" 
                          component="h2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: theme.palette.mode === 'dark' ? '#9575cd' : '#673ab7',
                    }}
                  >
                    Информация о салоне
                  </Typography>
                        {salons && manageSalonId && (
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                            {salons.find(s => s.id === manageSalonId)?.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  {salons && manageSalonId && (
                    (() => {
                      const salon = salons.find(s => s.id === manageSalonId);
                      if (!salon) return null;
                      
                      return (
                        <Grid container spacing={3}>
                          {/* Salon main info card */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: 3, 
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                height: '100%'
                              }}
                            >
                              <CardContent sx={{ p: 0 }}>
                                <Box sx={{
                                  p: 2.5,
                                  backgroundImage: salon.cover_image 
                                    ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${salon.cover_image})`
                                    : theme.palette.mode === 'dark'
                                      ? 'linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)'
                                      : 'linear-gradient(135deg, #5c6bc0 0%, #3f51b5 100%)',
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                  color: '#fff',
                                  position: 'relative'
                                }}>
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 16,
                                      right: 16,
                                      display: 'flex',
                                      alignItems: 'center',
                                      backgroundColor: salon.is_active ? '#4caf50' : '#f44336',
                                      color: '#fff',
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 6,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                    }}
                                  >
                                    {salon.is_active ? (
                                      <>
                                        <CheckCircleIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Активен</Typography>
                                      </>
                                    ) : (
                                      <>
                                        <ErrorIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Неактивен</Typography>
                                      </>
                                    )}
                                  </Box>
                                  
                                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {salon.name}
                                  </Typography>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    ID: {salon.id}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ p: 3 }}>
                                  <Box sx={{ mb: 3 }}>
                                    <Button
                                      variant="contained"
                                      startIcon={<EditIcon />}
                                      fullWidth
                                      onClick={() => handleOpenEditDialog(salon)}
                                      sx={{
                                        backgroundImage: 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)',
                                        borderRadius: 2,
                                        py: 1.2,
                                        boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)',
                                        '&:hover': {
                                          boxShadow: '0 6px 16px rgba(103, 58, 183, 0.4)',
                                          transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      Редактировать информацию
                                    </Button>
                                  </Box>
                                  
                                  <Divider sx={{ mb: 3 }} />
                                  
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      mb: 2, 
                                      fontWeight: 600, 
                                      color: 'primary.main',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <LocationOnIcon sx={{ mr: 1 }} />
                                    Адрес
                                  </Typography>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      mb: 3,
                                      px: 1,
                                      pb: 1,
                                      borderBottom: '1px dashed',
                                      borderColor: 'divider'
                                    }}
                                  >
                                    {salon.address || 'Не указан'}
                                  </Typography>
                                  
                                  <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                      mb: 2, 
                                      fontWeight: 600, 
                                      color: '#673ab7',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <PhoneIcon sx={{ mr: 1 }} />
                                    Контактная информация
                                  </Typography>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      mb: 1,
                                      px: 1
                                    }}
                                  >
                                    <strong>Телефон:</strong> {salon.contact_info?.phone || salon.phone || 'Не указан'}
                                  </Typography>
                                  {(salon.contact_info?.email || salon.email) && (
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        mb: 1,
                                        px: 1
                                      }}
                                    >
                                      <strong>Email:</strong> {salon.contact_info?.email || salon.email}
                                    </Typography>
                                  )}
                                  {(salon.contact_info?.website || salon.website) && (
                                    <Typography 
                                      variant="body1" 
                                      sx={{ 
                                        mb: 3,
                                        px: 1,
                                        pb: 1,
                                        borderBottom: '1px dashed',
                                        borderColor: 'divider'
                                      }}
                                    >
                                      <strong>Веб-сайт:</strong> {salon.contact_info?.website || salon.website}
                                    </Typography>
                                  )}
                                  {!salon.contact_info?.email && !salon.email && !salon.contact_info?.website && !salon.website && (
                                    <Box sx={{ mb: 3, pb: 1, borderBottom: '1px dashed', borderColor: 'divider' }} />
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
            </Grid>
                          
                          {/* Working hours card */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: 3, 
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                height: '100%'
                              }}
                            >
                              <CardContent sx={{ p: 0 }}>
                                <Box sx={{
                                  p: 2.5,
                                  backgroundImage: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #ff9800 0%, #ed6c02 100%)'
                                    : 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)',
                                  color: '#fff'
                                }}>
                                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ mr: 1.5 }} />
                                    Режим работы
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ p: 3 }}>
                                  {typeof salon.working_hours === 'object' && salon.working_hours ? (
                                    <Box sx={{ mb: 2 }}>
                                      <List>
                                        {[
                                          ['1', 'Понедельник'],
                                          ['2', 'Вторник'],
                                          ['3', 'Среда'],
                                          ['4', 'Четверг'],
                                          ['5', 'Пятница'],
                                          ['6', 'Суббота'],
                                          ['0', 'Воскресенье']
                                        ].map(([dayIndex, dayName]) => {
                                          const dayHours = salon.working_hours[dayIndex];
                                          return (
                                            <ListItem 
                                              key={dayIndex}
                                              sx={{ 
                                                borderBottom: '1px solid', 
                                                borderColor: 'divider',
                                                py: 1.5 
                                              }}
                                            >
                                              <ListItemText 
                                                primary={
                                                  <Typography 
                                                    variant="subtitle1" 
                                                    sx={{ 
                                                      fontWeight: 600,
                                                      color: !dayHours ? 'text.secondary' : 'text.primary'
                                                    }}
                                                  >
                                                    {dayName}
                                                  </Typography>
                                                } 
                                              />
                                              <Typography 
                                                variant="body1"
                                                sx={{ 
                                                  color: !dayHours ? 'error.light' : 'success.main',
                                                  fontWeight: 500
                                                }}
                                              >
                                                {!dayHours ? 'Выходной' : `${dayHours.start} - ${dayHours.end}`}
                                              </Typography>
                                            </ListItem>
                                          );
                                        })}
                                      </List>
                                    </Box>
                                  ) : (
                                    <Typography variant="body1" sx={{ py: 2, opacity: 0.8 }}>
                                      {salon.working_hours || 'Информация о режиме работы отсутствует'}
                                    </Typography>
                                  )}
                                  
                                  <Box sx={{ mt: 3 }}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<EditIcon />}
                                      onClick={() => handleOpenWorkingHoursDialog(salon)}
                fullWidth
                                      sx={{
                                        borderColor: '#ff9800',
                                        color: '#ff9800',
                                        '&:hover': {
                                          borderColor: '#ed6c02',
                                          backgroundColor: 'rgba(255, 152, 0, 0.08)'
                                        }
                                      }}
                                    >
                                      Изменить режим работы
                                    </Button>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
            </Grid>
                          
                          {/* Statistics card */}
            <Grid item xs={12}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                borderRadius: 3, 
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                              }}
                            >
                              <CardContent sx={{ p: 0 }}>
                                <Box sx={{
                                  p: 2.5,
                                  backgroundImage: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #009688 0%, #00796b 100%)'
                                    : 'linear-gradient(135deg, #4db6ac 0%, #009688 100%)',
                                  color: '#fff'
                                }}>
                                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Краткая статистика
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ p: 3 }}>
                                  <Grid container spacing={3}>
                                    <Grid item xs={12} sm={4}>
                                      <Box
                                        sx={{
                                          p: 2.5,
                                          textAlign: 'center',
                                          borderRadius: 3,
                                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          backgroundImage: 'linear-gradient(45deg, rgba(63, 81, 181, 0.05), rgba(63, 81, 181, 0.1))'
                                        }}
                                      >
                                        <SpaIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                          {salon.services_count || '?'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Услуг
                                        </Typography>
                                      </Box>
            </Grid>
                                    
                                    <Grid item xs={12} sm={4}>
                                      <Box
                                        sx={{
                                          p: 2.5,
                                          textAlign: 'center',
                                          borderRadius: 3,
                                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          backgroundImage: 'linear-gradient(45deg, rgba(0, 150, 136, 0.05), rgba(0, 150, 136, 0.1))'
                                        }}
                                      >
                                        <PeopleIcon sx={{ fontSize: 40, color: '#009688', mb: 1 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#009688' }}>
                                          {salon.employees_count || '?'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Сотрудников
                                        </Typography>
                                      </Box>
          </Grid>
                                    
                                    <Grid item xs={12} sm={4}>
                                      <Box
                                        sx={{
                                          p: 2.5,
                                          textAlign: 'center',
                                          borderRadius: 3,
                                          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                          backgroundImage: 'linear-gradient(45deg, rgba(233, 30, 99, 0.05), rgba(233, 30, 99, 0.1))'
                                        }}
                                      >
                                        <MonetizationOnIcon sx={{ fontSize: 40, color: '#e91e63', mb: 1 }} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#e91e63' }}>
                                          {salon.revenue ? `${salon.revenue} ₽` : '0 ₽'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Выручка
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                  
                                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
                                      onClick={() => navigate('/admin', { state: { activeTab: 1, salonId: salon.id } })}
                                      sx={{
                                        px: 3,
                                        py: 1.2,
                                        backgroundImage: 'linear-gradient(45deg, #009688 30%, #4db6ac 90%)',
                                        boxShadow: '0 4px 12px rgba(0, 150, 136, 0.3)',
                                        '&:hover': {
                                          boxShadow: '0 6px 16px rgba(0, 150, 136, 0.4)',
                                          transform: 'translateY(-2px)'
                                        },
                                        transition: 'all 0.3s ease'
                                      }}
                                    >
                                      Подробная статистика
          </Button>
                                  </Box>
                                  
                                  <Divider sx={{ mt: 4, mb: 3 }} />
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      startIcon={<DeleteIcon />}
                                      onClick={() => handleOpenDeleteDialog(salon.id)}
                                      sx={{
                                        borderColor: '#f44336',
                                        color: '#f44336',
                                        '&:hover': {
                                          backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                          borderColor: '#d32f2f',
                                        }
                                      }}
                                    >
                                      Удалить салон
                                    </Button>
            </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      );
                    })()
                  )}
                </Box>
              )}
            </Box>
          )}
          
          {manageTabValue === 1 && manageSalonId && (
            <ServiceManagement defaultSalonId={manageSalonId} singleSalonMode={true} />
          )}
          
          {manageTabValue === 2 && manageSalonId && (
            <EmployeeManagement defaultSalonId={manageSalonId} singleSalonMode={true} />
          )}
        </Box>
      </Dialog>

      {/* Existing dialogs (add/edit salon, delete confirmation, etc.) */}

      {/* Add/Edit Salon Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)',
            color: '#fff',
            py: 2,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          {dialogMode === 'add' ? 'Добавить новый салон' : 'Редактировать данные салона'}
          </Typography>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Название салона"
                value={salonData.name}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="address"
                label="Адрес"
                value={salonData.address}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                error={!!validationErrors.address}
                helperText={validationErrors.address}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Телефон"
                value={salonData.phone}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                value={salonData.email}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="website"
                label="Веб-сайт"
                value={salonData.website}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
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
                rows={3}
                margin="normal"
                InputProps={{
                  sx: { 
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(103, 58, 183, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.4)' : 'rgba(103, 58, 183, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#673ab7'
                    }
                  }
                }}
                InputLabelProps={{
                  sx: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                Логотип салона
              </Typography>
              <Box sx={{ 
                mb: 2,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 2
              }}>
                {salonData.logo ? (
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={salonData.logo}
                      alt={salonData.name}
                      sx={{
                        width: 120,
                        height: 120,
                    borderRadius: 2,
                        objectFit: 'cover',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setSalonData(prev => ({ ...prev, logo: '' }))}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: theme.palette.error.main,
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: theme.palette.error.dark
                        },
                        zIndex: 1
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="salon-logo-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <label htmlFor="salon-logo-upload">
                      <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px dashed',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        p: 3,
                        minWidth: { xs: '100%', sm: 350 },
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.1)' : 'rgba(103, 58, 183, 0.05)'
                        }
                      }}>
                        <AddPhotoAlternateIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Загрузить логотип
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Формат JPG, PNG. Максимальный размер 5MB
                        </Typography>
                        {isUploading && (
                          <CircularProgress size={24} sx={{ mt: 2 }} />
                        )}
                      </Box>
                    </label>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={salonData.is_active}
                      onChange={(e) => {
                        const isActive = e.target.checked;
                        setSalonData({...salonData, is_active: isActive});
                      }}
                      color="primary"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4caf50',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#81c784',
                        }
                      }}
                    />
                  }
                  label="Салон активен"
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
                  }}
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: salonData.is_active 
                    ? theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)'
                    : theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.08)',
                  border: '1px solid',
                  borderColor: salonData.is_active 
                    ? theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.15)'
                    : theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.15)',
                }}>
                  {salonData.is_active 
                    ? <CheckCircleIcon color="success" /> 
                    : <ErrorIcon color="error" />
                  }
                  <Typography variant="body2" sx={{ fontWeight: 500, color: salonData.is_active ? 'success.main' : 'error.main' }}>
                    {salonData.is_active ? 'Активен' : 'Неактивен'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <Box sx={{ 
          px: 3, 
          py: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.9)' : 'rgba(249, 249, 250, 0.9)',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{
              borderRadius: 2,
              px: 3,
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            }}
          >
            Отмена
          </Button>
          
          <Button 
            variant="contained" 
            onClick={handleSaveSalon}
            disabled={createSalonMutation.isLoading || updateSalonMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)',
              boxShadow: '0 3px 10px rgba(103, 58, 183, 0.3)',
              '&:hover': {
                boxShadow: '0 5px 14px rgba(103, 58, 183, 0.4)',
                background: 'linear-gradient(135deg, #5e35b1 20%, #8e24aa 90%)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {dialogMode === 'add' ? 'Добавить' : 'Сохранить'}
            {(createSalonMutation.isLoading || updateSalonMutation.isLoading) && <CircularProgress size={20} sx={{ ml: 1, color: 'white' }} />}
          </Button>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            px: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {"Подтверждение удаления"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот салон? Это действие невозможно отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button 
            onClick={handleDeleteSalon}
            color="error" 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #f44336 20%, #e91e63 90%)',
              boxShadow: '0 3px 10px rgba(233, 30, 99, 0.3)',
              '&:hover': {
                boxShadow: '0 5px 14px rgba(233, 30, 99, 0.4)',
              },
              borderRadius: 2
            }}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Working Hours Dialog */}
      <Dialog 
        open={openWorkingHoursDialog} 
        onClose={handleCloseWorkingHoursDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(59, 59, 79, 0.8) 0%, rgba(42, 42, 56, 0.9) 100%)' 
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 245, 0.95) 100%)'
          }
        }}
      >
        <AppBar 
          position="sticky" 
          elevation={0} 
          color="inherit" 
          sx={{ 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            backgroundImage: 'linear-gradient(135deg, #ff9800 0%, #fb8c00 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          <Toolbar>
            <IconButton 
              edge="start" 
              onClick={handleCloseWorkingHoursDialog} 
              aria-label="close"
              sx={{
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                transition: 'background-color 0.3s ease'
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography 
              sx={{ 
                ml: 2, 
                flex: 1, 
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} 
              variant="h6"
            >
              Настройка режима работы салона
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleSaveWorkingHours}
              startIcon={<SaveIcon />}
              sx={{
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.2) 90%)',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
                py: 1.2,
                px: 3,
                '&:hover': {
                  boxShadow: '0 5px 14px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Сохранить изменения
            </Button>
          </Toolbar>
        </AppBar>

        <DialogContent 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'radial-gradient(circle at 90% 90%, rgba(66, 66, 86, 0.3) 0%, transparent 70%)' 
              : 'radial-gradient(circle at 90% 90%, rgba(245, 245, 245, 0.5) 0%, transparent 70%)'
          }}
        >
          <Fade in={openWorkingHoursDialog} timeout={300}>
            <Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1 
                }}
              >
                <InfoIcon fontSize="small" color="info" />
                Настройте рабочие часы салона. Изменения будут применены ко всем новым записям.
              </Typography>
            
          <TimeRangePicker 
            value={salonData.working_hours} 
            onChange={(hours) => setSalonData(prev => ({ ...prev, working_hours: hours }))} 
          />
            </Box>
          </Fade>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SalonManagement; 