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
  Avatar,
  SwipeableDrawer,
  Fab,
  Checkbox,
  FormGroup,
  Paper as MuiPaper,
  useMediaQuery,
  useTheme,
  TablePagination
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { salonApi } from '../../api/salons';
import { serviceApi } from '../../api/services';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SpaIcon from '@mui/icons-material/Spa';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import EmployeeSchedule from './EmployeeSchedule';

const EmployeeManagement = ({ defaultSalonId, singleSalonMode = false }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [openServicesDialog, setOpenServicesDialog] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openFiltersDrawer, setOpenFiltersDrawer] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    salon_id: singleSalonMode && defaultSalonId ? defaultSalonId.toString() : '',
    position: '',
    active_only: false,
    has_services: false
  });
  const [employeeData, setEmployeeData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    salon_id: singleSalonMode && defaultSalonId ? defaultSalonId.toString() : '',
    is_active: true,
    service_ids: [],
    working_hours: {},
    photo_url: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loadingEmployeeServices, setLoadingEmployeeServices] = useState(false);
  const [employeeServicesError, setEmployeeServicesError] = useState(null);
  const [filteredServices, setFilteredServices] = useState([]);
  const isSyncingServicesRef = useRef(false);
  const navigate = useNavigate();

  // Set default salon_id when in single salon mode
  useEffect(() => {
    if (singleSalonMode && defaultSalonId) {
      setEmployeeData(prev => ({ ...prev, salon_id: String(defaultSalonId) }));
    }
  }, [singleSalonMode, defaultSalonId]);

  // Загрузка списка сотрудников
  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
    refetch: refetchEmployees
  } = useQuery(
    ['employees'],
    () => employeeApi.getAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      onSuccess: (data) => {
        // Синхронизация услуг только при первой загрузке данных и не во время текущей синхронизации
        if (!isSyncingServicesRef.current && data) {
          syncEmployeeServices(data);
        }
      },
      onError: (err) => {
        setSnackbar({
          open: true,
          message: `Ошибка при загрузке сотрудников: ${err.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Функция для синхронизации услуг
  const syncEmployeeServices = async (employeesList) => {
    if (isSyncingServicesRef.current || !employeesList || employeesList.length === 0) {
      return;
    }
    
    console.log('Синхронизация услуг для всех сотрудников...');
    
    isSyncingServicesRef.current = true;
    
    try {
      // Создаем копию списка сотрудников для обновления
      const updatedEmployees = [...employeesList];
      
      // Обновляем только первые 5 сотрудников за раз, чтобы не перегружать систему
      const employeesToUpdate = updatedEmployees.slice(0, 5);
      
      // Для каждого сотрудника загружаем его услуги
      for (const employee of employeesToUpdate) {
        try {
          const services = await employeeApi.getServices(employee.id);
          // Обновляем service_ids в объекте сотрудника
          employee.service_ids = services.map(s => s.id);
        } catch (error) {
          console.error(`Ошибка при загрузке услуг для сотрудника ${employee.id}:`, error);
        }
      }
      
      // Обновляем кэш React Query без вызова ре-рендера (не вызывает новую синхронизацию)
      queryClient.setQueryData(['employees'], (oldData) => {
        if (!oldData) return updatedEmployees;
        
        // Обновляем только обработанных сотрудников
        const result = oldData.map(emp => {
          const updated = employeesToUpdate.find(e => e.id === emp.id);
          return updated || emp;
        });
        
        return result;
      });
      
      console.log('Синхронизация услуг завершена');
    } catch (error) {
      console.error('Ошибка при синхронизации услуг:', error);
    } finally {
      // Важно: сбрасываем флаг синхронизации с задержкой
      setTimeout(() => {
        isSyncingServicesRef.current = false;
      }, 2000); // Более длительная задержка
    }
  };

  // Загрузка списка салонов для формы
  const {
    data: salons,
    isLoading: isLoadingSalons,
    error: salonsError
  } = useQuery(
    ['salons'],
    () => salonApi.getAll(),
    {
      staleTime: 10 * 60 * 1000 // 10 минут
    }
  );

  // Загрузка списка услуг для формы
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError
  } = useQuery(
    ['services'],
    () => serviceApi.getAll(),
    {
      staleTime: 10 * 60 * 1000 // 10 минут
    }
  );

  // Мутация для создания сотрудника
  const createEmployeeMutation = useMutation(
    (data) => employeeApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['employees']);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Сотрудник успешно добавлен',
          severity: 'success'
        });
        
        // Вместо перезагрузки страницы просто обновим данные
        refetchEmployees();
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при создании сотрудника: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для обновления сотрудника
  const updateEmployeeMutation = useMutation(
    ({ id, data }) => employeeApi.update(id, data),
    {
      onSuccess: async (_, variables) => {
        // Предотвращаем автоматическую синхронизацию
        isSyncingServicesRef.current = true;
        
        try {
          // Сохраняем отправленные service_ids
          const sentServiceIds = [...variables.data.service_ids];
          console.log('Отправленные ID услуг:', sentServiceIds);
          
          // Используем новый метод для обновления списка услуг одним запросом
          console.log(`Обновление услуг сотрудника ID ${variables.id} через новый метод API`);
          const updatedServices = await employeeApi.updateServices(variables.id, sentServiceIds);
          console.log('Результат обновления услуг:', updatedServices);
          
          // Получаем финальный список ID услуг
          const updatedServiceIds = updatedServices.map(s => s.id);
          console.log('Финальные ID услуг после синхронизации:', updatedServiceIds);
          
          // Проверяем, все ли услуги были обновлены правильно
          const missingSentServices = sentServiceIds.filter(id => !updatedServiceIds.includes(id));
          
          if (missingSentServices.length > 0) {
            console.warn('Обнаружены недостающие услуги после обновления:', missingSentServices);
            
            // Информируем пользователя о проблеме
            setSnackbar({
              open: true,
              message: `Не удалось добавить некоторые услуги: ${missingSentServices.join(', ')}`,
              severity: 'warning'
            });
          }
          
          // Принудительно инвалидируем кеш и перезагружаем данные
          await queryClient.invalidateQueries(['employees']);
          
          // Обновляем кеш в React Query с обновленными данными
          queryClient.setQueryData(['employees'], (oldData) => {
            if (!oldData) return oldData;
            
            return oldData.map(emp => {
              if (emp.id === variables.id) {
                return {
                  ...emp,
                  ...variables.data, // Добавляем все обновленные данные
                  service_ids: updatedServiceIds,
                  first_name: variables.data.first_name,
                  last_name: variables.data.last_name,
                  name: variables.data.name
                };
              }
              return emp;
            });
          });

          // Принудительно обновляем данные
          await refetchEmployees();
        } catch (error) {
          console.error('Ошибка при синхронизации услуг:', error);
          
          setSnackbar({
            open: true,
            message: `Ошибка при обновлении услуг: ${error.message}`,
            severity: 'error'
          });
        } finally {
          // Сбрасываем флаг синхронизации
          setTimeout(() => {
            isSyncingServicesRef.current = false;
          }, 2000);
        }
        
        handleCloseDialog();
        setSnackbar(prev => ({
          ...prev,
          open: true,
          message: 'Данные сотрудника успешно обновлены',
          severity: 'success'
        }));
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при обновлении данных сотрудника: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для удаления сотрудника
  const deleteEmployeeMutation = useMutation(
    (id) => employeeApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['employees']);
        setOpenDeleteDialog(false);
        setOpenDialog(false); // Закрываем диалог редактирования
        setSnackbar({
          open: true,
          message: 'Сотрудник успешно удален',
          severity: 'success'
        });
      },
      onError: (error) => {
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: `Ошибка при удалении сотрудника: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Открытие диалога добавления сотрудника
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setSelectedEmployeeId(null);
    setEmployeeData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
      is_active: true,
      service_ids: [],
      working_hours: {},
      photo_url: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Открытие диалога редактирования сотрудника
  const handleOpenEditDialog = (employee) => {
    setDialogMode('edit');
    
    // Получаем service_ids как массив числовых идентификаторов услуг
    const serviceIds = Array.isArray(employee.service_ids) 
      ? employee.service_ids.map(id => typeof id === 'number' ? id : parseInt(id, 10)) 
      : [];
    
    setEmployeeData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || employee.contact_info?.email || '',
      phone: employee.phone || employee.contact_info?.phone || '',
      position: employee.position || '',
      salon_id: employee.salon_id ? employee.salon_id.toString() : '',
      is_active: employee.is_active !== false,
      service_ids: serviceIds,
      working_hours: employee.working_hours || {},
      photo_url: employee.photo_url || ''
    });
    setSelectedEmployeeId(employee.id);
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Закрытие диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setValidationErrors({});
  };

  // Загрузка услуг сотрудника
  const loadEmployeeServices = async (employeeId) => {
    if (!employeeId) return;
    
    setLoadingEmployeeServices(true);
    setEmployeeServicesError(null);
    
    try {
      console.log(`Загрузка услуг для сотрудника ID ${employeeId}...`);
      // Получаем сотрудника с обновленными услугами
      const employee = await employeeApi.getById(employeeId);
      console.log('Полученные данные о сотруднике:', employee);
      
      // Извлекаем service_ids из ответа API и проверяем их валидность
      const serviceIds = Array.isArray(employee.service_ids) 
        ? employee.service_ids.filter(id => id !== null && id !== undefined)
        : [];
      console.log('ID услуг сотрудника (после фильтрации):', serviceIds);
      
      // Получаем подробную информацию об услугах через API
      const services = await employeeApi.getServices(employeeId);
      console.log('Полученные услуги сотрудника:', services);
      
      // Устанавливаем service_ids в state формы
      setEmployeeData(prev => ({ ...prev, service_ids: serviceIds }));
      
      // Update employee in the list with accurate service IDs
      if (employees) {
        // Предотвращаем повторную синхронизацию
        isSyncingServicesRef.current = true;
        
        const updatedEmployees = employees.map(emp => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              service_ids: serviceIds
            };
          }
          return emp;
        });
        
        // Update the cache with correct service IDs
        queryClient.setQueryData(['employees'], updatedEmployees);
        
        // Сбрасываем флаг после короткой задержки
        setTimeout(() => {
          isSyncingServicesRef.current = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка при загрузке услуг сотрудника:', error);
      setEmployeeServicesError(error);
      setSnackbar({
        open: true,
        message: `Ошибка при загрузке услуг сотрудника: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingEmployeeServices(false);
    }
  };

  // Открытие диалога услуг сотрудника
  const handleOpenServicesDialog = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setOpenServicesDialog(true);
    loadEmployeeServices(employeeId);
    // Initialize filteredServices with all available services
    setFilteredServices(services || []);
  };

  // Закрытие диалога услуг
  const handleCloseServicesDialog = () => {
    setOpenServicesDialog(false);
    setSelectedEmployeeId(null);
  };

  // Функция для открытия диалога с расписанием сотрудника
  const handleOpenScheduleDialog = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setOpenScheduleDialog(true);
  };

  // Функция для закрытия диалога с расписанием сотрудника
  const handleCloseScheduleDialog = () => {
    setOpenScheduleDialog(false);
    setSelectedEmployeeId(null);
  };

  // Открытие диалога удаления
  const handleOpenDeleteDialog = (employee) => {
    console.log('handleOpenDeleteDialog вызван с данными:', employee);
    
    // Ensure we pass a numeric ID
    let employeeId;
    
    if (typeof employee === 'object') {
      if (employee.id) {
        employeeId = employee.id;
      } else if (employee.employeeId) {
        employeeId = employee.employeeId;
      } else {
        console.error('ID сотрудника не найден в объекте:', employee);
        // Если не можем получить ID из объекта, используем selectedEmployeeId
        employeeId = selectedEmployeeId;
      }
    } else {
      employeeId = employee;
    }
    
    console.log('ID сотрудника для удаления:', employeeId);
    setSelectedEmployeeId(employeeId);
    setOpenDeleteDialog(true);
  };

  // Закрытие диалога удаления
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedEmployeeId(null);
  };

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData(prev => ({ ...prev, [name]: value }));
    
    // Сброс ошибки валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Обработчик изменения чекбокса активности
  const handleActiveChange = (e) => {
    setEmployeeData(prev => ({ ...prev, is_active: e.target.checked }));
  };

  // Обработчик выбора услуг
  const handleServicesChange = (event) => {
    const { value } = event.target;
    // Убедимся, что value - это массив и отфильтруем невалидные значения
    const validServiceIds = Array.isArray(value) 
      ? value.filter(id => id !== null && id !== undefined) 
      : [];
      
    setEmployeeData(prev => ({ ...prev, service_ids: validServiceIds }));
  };

  // Обработчик сохранения услуг для существующего сотрудника
  const handleSaveServices = async () => {
    try {
      if (!selectedEmployeeId) {
        setSnackbar({
          open: true,
          message: 'Ошибка: ID сотрудника не выбран',
          severity: 'error'
        });
        return;
      }
      
      console.log(`Сохранение услуг для сотрудника ID ${selectedEmployeeId}:`, employeeData.service_ids);
      
      // Преобразуем ID услуг в числовой формат и проверяем на валидность
      const serviceIds = Array.isArray(employeeData.service_ids)
        ? employeeData.service_ids
            .filter(id => id !== null && id !== undefined)
            .map(id => parseInt(id, 10))
        : [];
      
      if (serviceIds.some(id => isNaN(id))) {
        console.error('Обнаружены невалидные ID услуг', employeeData.service_ids);
        setSnackbar({
          open: true,
          message: 'Ошибка: невалидные ID услуг',
          severity: 'error'
        });
        return;
      }
      
      // Устанавливаем флаг, чтобы избежать рекурсивных вызовов
      isSyncingServicesRef.current = true;
      
      try {
        // Более безопасный способ обновления услуг - без использования вложенных методов
        // Получаем текущие данные сотрудника
        const employeeResponse = await employeeApi.getById(selectedEmployeeId);
        const employeeToUpdate = employeeResponse;
        
        // Обновляем только поле service_ids
        const updatedEmployeeData = {
          ...employeeToUpdate,
          service_ids: serviceIds
        };
        
        // Удаляем поля, которые могут вызвать проблемы
        delete updatedEmployeeData.created_at;
        delete updatedEmployeeData.updated_at;
        delete updatedEmployeeData.service_names;
        
        // Отправляем обновленные данные
        console.log('Обновляем данные сотрудника напрямую:', updatedEmployeeData);
        await employeeApi.update(selectedEmployeeId, updatedEmployeeData);
        
        // Обновляем список сотрудников и кэш
        await queryClient.invalidateQueries(['employees']);
        
        setSnackbar({
          open: true,
          message: 'Услуги сотрудника успешно обновлены',
          severity: 'success'
        });
        
        handleCloseServicesDialog();
      } catch (error) {
        console.error('Ошибка при обновлении сотрудника:', error);
        setSnackbar({
          open: true,
          message: `Ошибка при обновлении сотрудника: ${error.message}`,
          severity: 'error'
        });
      } finally {
        // Сбрасываем флаг синхронизации с задержкой
        setTimeout(() => {
          isSyncingServicesRef.current = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка в handleSaveServices:', error);
      
      // Сбрасываем флаг синхронизации
      isSyncingServicesRef.current = false;
      
      setSnackbar({
        open: true,
        message: `Ошибка: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!employeeData.first_name.trim()) {
      errors.first_name = 'Имя обязательно';
    }
    
    if (!employeeData.last_name.trim()) {
      errors.last_name = 'Фамилия обязательна';
    }
    
    if (!employeeData.phone.trim()) {
      errors.phone = 'Телефон обязателен';
    } else if (!/^\+?[0-9\s-()]{10,17}$/.test(employeeData.phone)) {
      errors.phone = 'Неверный формат телефона';
    }
    
    if (employeeData.email && !/\S+@\S+\.\S+/.test(employeeData.email)) {
      errors.email = 'Неверный формат email';
    }
    
    if (!employeeData.salon_id) {
      errors.salon_id = 'Выбор салона обязателен';
    }
    
    if (!employeeData.position.trim()) {
      errors.position = 'Должность обязательна';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Обработчик сохранения сотрудника
  const handleSaveEmployee = async () => {
    // Validate the form
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSnackbar({
        open: true,
        message: 'Пожалуйста, заполните все обязательные поля корректно',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Create a copy of the employee data for submission
        const preparedData = {
          first_name: employeeData.first_name,
          last_name: employeeData.last_name,
          contact_info: {
            phone: employeeData.phone || '',
            email: employeeData.email || ''
          },
          role: 'employee', 
          position: employeeData.position || '',
          working_hours: employeeData.working_hours || {},
          is_active: employeeData.is_active,
          salon_id: employeeData.salon_id ? parseInt(employeeData.salon_id, 10) : null,
        service_ids: Array.isArray(employeeData.service_ids) 
          ? employeeData.service_ids
              .filter(id => id !== null && id !== undefined)
              .map(id => parseInt(id, 10))
          : [],
          photo_url: employeeData.photo_url || ''
        };
        
        console.log('Отправляемые данные:', preparedData);
        
        if (dialogMode === 'add') {
          await createEmployeeMutation.mutateAsync(preparedData);
        } else {
        await updateEmployeeMutation.mutateAsync({
          id: selectedEmployeeId,
          data: preparedData
        });
        }
        
        handleCloseDialog();
    
      } catch (error) {
      console.error('Error saving employee:', error);
      setSnackbar({
          open: true,
        message: `Ошибка при сохранении сотрудника: ${error.message}`,
          severity: 'error'
        });
    }
  };

  // Обработчик удаления сотрудника
  const handleDeleteEmployee = () => {
    console.log('handleDeleteEmployee вызван, selectedEmployeeId:', selectedEmployeeId);
    
    if (!selectedEmployeeId) {
      setSnackbar({
        open: true,
        message: 'Ошибка: ID сотрудника не выбран',
        severity: 'error'
      });
      return;
    }
    
    // Преобразуем ID в число, если это необходимо
    let employeeId = selectedEmployeeId;
    if (typeof employeeId === 'string') {
      employeeId = parseInt(employeeId, 10);
    }
    
    // Проверяем, что ID - валидное число
    if (isNaN(employeeId)) {
      console.error('Невалидный ID сотрудника:', selectedEmployeeId);
      setSnackbar({
        open: true,
        message: 'Ошибка: Невалидный ID сотрудника',
        severity: 'error'
      });
      return;
    }
    
    console.log('Вызываем мутацию с ID:', employeeId);
    deleteEmployeeMutation.mutate(employeeId);
  };

  // Обработчик закрытия snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Получение названия салона по ID
  const getSalonName = (salonId) => {
    const salon = salons?.find(s => s.id === salonId);
    return salon ? salon.name : 'Неизвестный салон';
  };

  // Effect to set rows per page based on screen size
  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);
  
  // Filter handling functions
  const handleTextFieldFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchFilterChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: checked }));
  };
  
  const clearFilters = () => {
    setFilters({
      salon_id: singleSalonMode && defaultSalonId ? defaultSalonId.toString() : '',
      position: '',
      active_only: false,
      has_services: false
    });
  };
  
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter employees based on search and filters
  const filteredEmployees = (employees || []).filter(employee => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    const matchesSearch = !searchQuery || 
      fullName.includes(searchQuery.toLowerCase()) || 
      (employee.email && employee.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee.phone && employee.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSalon = !filters.salon_id || employee.salon_id.toString() === filters.salon_id;
    const matchesPosition = !filters.position || employee.position === filters.position;
    const matchesActive = !filters.active_only || employee.is_active;
    const matchesServices = !filters.has_services || (employee.service_ids && employee.service_ids.length > 0);
    
    return matchesSearch && matchesSalon && matchesPosition && matchesActive && matchesServices;
  });
  
  // Calculate paginated employees
  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Function to get unique positions from employees data
  const getUniquePositions = () => {
    if (!employees) return [];
    const positions = new Set();
    employees.forEach(employee => {
      if (employee.position) positions.add(employee.position);
    });
    return Array.from(positions);
  };
  
  const uniquePositions = getUniquePositions();

  // Helper function to format employee count text based on count
  const getEmployeeCountText = (count) => {
    if (count === 0) return 'сотрудников';
    if (count === 1) return 'сотрудник';
    if (count >= 2 && count <= 4) return 'сотрудника';
    return 'сотрудников';
  };

  if (isLoadingEmployees) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (employeesError && !employees) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка при загрузке сотрудников: {employeesError.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* Header section with title and add button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: ['column', 'row'],
          justifyContent: 'space-between',
          alignItems: ['flex-start', 'center'],
          background: 'linear-gradient(135deg, #4527a0 0%, #7b1fa2 100%)',
          borderRadius: '10px',
          padding: '16px 24px',
          mb: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          color: 'white',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Управление сотрудниками
            </Typography>
            {filteredEmployees && (
              <Typography variant="subtitle2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {filteredEmployees.length} {getEmployeeCountText(filteredEmployees.length)}
                {!singleSalonMode && ' в системе'}
              </Typography>
            )}
          </Box>
        </Box>
        {!singleSalonMode && (
          <Typography variant="body2" color="text.secondary">
            {filteredEmployees?.length || 0} {getEmployeeCountText(filteredEmployees?.length || 0)} в системе
          </Typography>
        )}
        {singleSalonMode && (
          <Typography variant="body2" color="text.secondary">
            Сотрудники выбранного салона
          </Typography>
        )}
      </Box>

      {/* Search and filter controls - enhanced design */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={9}>
        <TextField
            placeholder="Поиск сотрудников по имени, телефону или email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                  <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? '#4db6ac' : '#009688' }} />
              </InputAdornment>
            ),
              sx: {
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.9)'
                },
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 150, 136, 0.2)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 150, 136, 0.3)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#009688'
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            fullWidth
            onClick={handleOpenAddDialog}
            sx={{
              py: 1.5,
              borderRadius: 2,
              backgroundImage: 'linear-gradient(135deg, #009688 20%, #26a69a 90%)',
              boxShadow: '0 4px 12px rgba(0, 150, 136, 0.3)',
              '&:hover': {
                backgroundImage: 'linear-gradient(135deg, #00796b 20%, #009688 90%)',
                boxShadow: '0 6px 16px rgba(0, 150, 136, 0.4)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Добавить нового сотрудника
          </Button>
        </Grid>
      </Grid>

      {!singleSalonMode && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl 
            variant="outlined" 
            size="small" 
            sx={{ 
              minWidth: 240,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                borderColor: 'rgba(0, 150, 136, 0.2)',
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 150, 136, 0.3)'
                }
              }
            }}
          >
            <InputLabel>Фильтр по салону</InputLabel>
            <Select
              value={selectedSalonFilter}
              onChange={handleSalonFilterChange}
              label="Фильтр по салону"
            >
              <MenuItem value="all">Все салоны</MenuItem>
              {salons?.map((salon) => (
                <MenuItem key={salon.id} value={salon.id.toString()}>
                  {salon.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {isLoadingEmployees || isLoadingSalons || isLoadingServices ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : employeesError || salonsError || servicesError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Ошибка при загрузке данных. Пожалуйста, попробуйте обновить страницу.
        </Alert>
      ) : (
                    <Box>
          {paginatedEmployees.length > 0 ? (
            <>
              <Grid container spacing={2}>
                {paginatedEmployees.map((employee) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        backdropFilter: 'blur(8px)',
                        background: theme.palette.mode === 'dark' 
                          ? 'linear-gradient(145deg, rgba(40, 40, 45, 0.9), rgba(30, 30, 35, 0.8))' 
                          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(245, 245, 245, 0.8))',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.14)'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          p: 2, 
                          position: 'relative',
                          backgroundImage: employee.is_active
                            ? 'linear-gradient(135deg, rgba(0, 150, 136, 0.15) 0%, rgba(38, 166, 154, 0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(158, 158, 158, 0.15) 0%, rgba(117, 117, 117, 0.15) 100%)',
                          borderBottom: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: employee.is_active ? '#009688' : 'grey.400',
                              width: 52,
                              height: 52,
                              boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                              border: '2px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'white',
                            }}
                          >
                            {employee.first_name[0]}{employee.last_name[0]}
                          </Avatar>
                          <Box sx={{ ml: 2, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography 
                                variant="h6" 
                                component="h2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.mode === 'dark' ? '#e0e0e0' : 'rgba(0,0,0,0.87)',
                                  textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                                }}
                              >
                          {employee.first_name} {employee.last_name}
                        </Typography>
                          {employee.is_active ? (
                                <Chip 
                                  size="small" 
                                  color="success" 
                                  label="Активен" 
                                  sx={{ 
                                    fontWeight: 500, 
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    '& .MuiChip-label': { px: 1 }
                                  }} 
                                />
                              ) : (
                                <Chip 
                                  size="small" 
                                  color="error" 
                                  label="Неактивен"
                                  sx={{ 
                                    fontWeight: 500, 
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    '& .MuiChip-label': { px: 1 }
                                  }} 
                                />
                          )}
                        </Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.mode === 'dark' ? '#80cbc4' : '#00796b',
                                fontWeight: 500,
                                background: theme.palette.mode === 'dark' 
                                  ? 'rgba(0, 150, 136, 0.12)' 
                                  : 'rgba(0, 150, 136, 0.08)',
                                py: 0.3,
                                px: 1,
                                borderRadius: 1,
                                display: 'inline-block',
                                mt: 0.5,
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.2)' : 'rgba(0, 150, 136, 0.15)',
                              }}
                            >
                        {employee.position}
                      </Typography>
                          </Box>
                    </Box>
                  </Box>
                  
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              p: 1,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(63, 81, 181, 0.1)' 
                                : 'rgba(63, 81, 181, 0.05)',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.15)' : 'rgba(63, 81, 181, 0.1)',
                            }}
                          >
                            <WorkIcon sx={{ mr: 1.5, color: '#3f51b5' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getSalonName(employee.salon_id)}
                    </Typography>
                  </Box>
                  
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              p: 1,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(233, 30, 99, 0.1)' 
                                : 'rgba(233, 30, 99, 0.05)',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(233, 30, 99, 0.15)' : 'rgba(233, 30, 99, 0.1)',
                            }}
                          >
                            <PhoneIcon sx={{ mr: 1.5, color: '#e91e63' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {employee.contact_info?.phone || employee.phone || 'Не указан'}
                    </Typography>
                  </Box>
                  
                          {(employee.email) && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 2,
                                background: theme.palette.mode === 'dark' 
                                  ? 'rgba(0, 150, 136, 0.1)' 
                                  : 'rgba(0, 150, 136, 0.05)',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                                border: '1px solid',
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.15)' : 'rgba(0, 150, 136, 0.1)',
                              }}
                            >
                              <EmailIcon sx={{ mr: 1.5, color: '#009688' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {employee.email}
                      </Typography>
                    </Box>
                  )}
                  
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(156, 39, 176, 0.1)' 
                                : 'rgba(156, 39, 176, 0.05)',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.15)' : 'rgba(156, 39, 176, 0.1)',
                            }}
                          >
                            <SpaIcon sx={{ mr: 1.5, color: '#9c27b0' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {employee.services ? `${employee.services.length} услуг` : '0 услуг'}
                  </Typography>
                          </Box>
                  </Box>
                </CardContent>
                
                      <CardActions sx={{ 
                        p: 2, 
                        pt: 0, 
                        gap: 1,
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        borderTop: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        background: theme.palette.mode === 'dark' 
                          ? 'rgba(40, 40, 45, 0.5)' 
                          : 'rgba(248, 248, 250, 0.5)',
                      }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditDialog(employee)}
                          sx={{
                            borderRadius: 2,
                            flex: '1 1 auto',
                            py: 0.8,
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)',
                            color: theme.palette.mode === 'dark' ? '#80cbc4' : '#00796b',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(0, 150, 136, 0.08)' 
                              : 'rgba(0, 150, 136, 0.04)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.5)' : 'rgba(0, 150, 136, 0.3)',
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(0, 150, 136, 0.15)' 
                                : 'rgba(0, 150, 136, 0.08)',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Редактировать
                        </Button>
                        
                    <Button 
                      size="small" 
                      startIcon={<SpaIcon />}
                      onClick={() => handleOpenServicesDialog(employee.id)}
                          sx={{
                            borderRadius: 2,
                            flex: '1 1 auto',
                            py: 0.8,
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.2)',
                            color: theme.palette.mode === 'dark' ? '#ce93d8' : '#9c27b0',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(156, 39, 176, 0.08)' 
                              : 'rgba(156, 39, 176, 0.04)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.5)' : 'rgba(156, 39, 176, 0.3)',
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(156, 39, 176, 0.15)' 
                                : 'rgba(156, 39, 176, 0.08)',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Услуги сотрудника
                    </Button>
                        
                    <Button 
                      size="small" 
                      startIcon={<CalendarMonthIcon />}
                      onClick={() => handleOpenScheduleDialog(employee.id)}
                          sx={{
                            borderRadius: 2,
                            flex: '1 1 auto',
                            py: 0.8,
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)',
                            color: theme.palette.mode === 'dark' ? '#ffb74d' : '#f57c00',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 152, 0, 0.08)' 
                              : 'rgba(255, 152, 0, 0.04)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.5)' : 'rgba(255, 152, 0, 0.3)',
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 152, 0, 0.15)' 
                                : 'rgba(255, 152, 0, 0.08)',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                    >
                      Расписание
                    </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
              
              {filteredEmployees.length > rowsPerPage && (
                <Paper sx={{ mt: 2 }}>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredEmployees.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="На странице:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
                  />
                </Paper>
              )}
            </>
      ) : (
        <Alert severity="info">
              {searchQuery || Object.values(filters).some(v => v !== '' && v !== false)
                ? "Сотрудники по вашему запросу не найдены. Попробуйте изменить параметры поиска или фильтры."
            : "Список сотрудников пуст. Нажмите 'Добавить сотрудника', чтобы создать нового сотрудника."
          }
        </Alert>
          )}
        </Box>
      )}

      {/* Filters Drawer */}
      <SwipeableDrawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={openFiltersDrawer}
        onClose={() => setOpenFiltersDrawer(false)}
        onOpen={() => setOpenFiltersDrawer(true)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            height: isMobile ? '80%' : '100%',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            p: 2
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Фильтры</Typography>
            <IconButton onClick={() => setOpenFiltersDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            {!singleSalonMode && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="salon-filter-label">Салон</InputLabel>
                  <Select
                    labelId="salon-filter-label"
                    name="salon_id"
                    value={filters.salon_id}
                    onChange={handleSelectFilterChange}
                    label="Салон"
                  >
                    <MenuItem value="">Все салоны</MenuItem>
                    {(salons || []).map((salon) => (
                      <MenuItem key={salon.id} value={salon.id.toString()}>
                        {salon.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="position-filter-label">Должность</InputLabel>
                <Select
                  labelId="position-filter-label"
                  name="position"
                  value={filters.position}
                  onChange={handleSelectFilterChange}
                  label="Должность"
                >
                  <MenuItem value="">Все должности</MenuItem>
                  {uniquePositions.map((position) => (
                    <MenuItem key={position} value={position}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="active_only"
                    checked={filters.active_only}
                    onChange={handleSwitchFilterChange}
                    color="primary"
                  />
                }
                label="Только активные сотрудники"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="has_services"
                    checked={filters.has_services}
                    onChange={handleSwitchFilterChange}
                    color="primary"
                  />
                }
                label="Только с назначенными услугами"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={clearFilters}
                startIcon={<CloseIcon />}
              >
                Сбросить фильтры
              </Button>
            </Grid>
          </Grid>
        </Box>
      </SwipeableDrawer>

      {/* Диалог добавления/редактирования сотрудника */}
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
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #009688 20%, #26a69a 90%)',
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
          {dialogMode === 'add' ? 'Добавить нового сотрудника' : 'Редактировать данные сотрудника'}
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
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="first_name"
                label="Имя"
                value={employeeData.first_name}
                onChange={handleInputChange}
                error={!!validationErrors.first_name}
                helperText={validationErrors.first_name}
                fullWidth
                required
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#009688'
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
                name="last_name"
                label="Фамилия"
                value={employeeData.last_name}
                onChange={handleInputChange}
                error={!!validationErrors.last_name}
                helperText={validationErrors.last_name}
                fullWidth
                required
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#009688'
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
                value={employeeData.phone}
                onChange={handleInputChange}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone}
                fullWidth
                required
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#009688'
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
                value={employeeData.email}
                onChange={handleInputChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
                fullWidth
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#009688'
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
            {!singleSalonMode && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!validationErrors.salon_id}>
                  <InputLabel id="salon-select-label" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>Салон</InputLabel>
                  <Select
                    labelId="salon-select-label"
                    name="salon_id"
                    value={employeeData.salon_id}
                    label="Салон"
                    onChange={handleInputChange}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#009688'
                      }
                    }}
                  >
                    {isLoadingSalons ? (
                      <MenuItem disabled>Загрузка салонов...</MenuItem>
                    ) : (
                      (salons || []).map((salon) => (
                        <MenuItem key={salon.id} value={salon.id.toString()}>
                          {salon.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {validationErrors.salon_id && (
                    <FormHelperText>{validationErrors.salon_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                name="position"
                label="Должность"
                value={employeeData.position}
                onChange={handleInputChange}
                error={!!validationErrors.position}
                helperText={validationErrors.position}
                fullWidth
                required
                InputProps={{
                  sx: {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.3)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#009688'
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
              <Box sx={{ 
                border: '2px dashed',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.3)' : 'rgba(0, 150, 136, 0.2)',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,150,136,0.03)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#009688',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,150,136,0.05)',
                }
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="employee-photo-upload"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Create a blob URL for preview
                      const previewUrl = URL.createObjectURL(file);
                      setEmployeeData(prev => ({
                        ...prev,
                        photo_url: previewUrl,
                        photoFile: file // Store the file object for later upload
                      }));
                    }
                  }}
                />
                <label htmlFor="employee-photo-upload">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    {employeeData.photo_url ? (
                      <Box sx={{ mb: 2, position: 'relative' }}>
                        <Avatar 
                          src={employeeData.photo_url} 
                          alt={employeeData.first_name} 
                  sx={{ 
                            width: 100, 
                            height: 100, 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            border: '3px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.5)' : 'rgba(0, 150, 136, 0.3)'
                          }} 
                        />
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          right: -8, 
                          bgcolor: '#009688',
                          color: 'white',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          <EditIcon fontSize="small" />
                        </Box>
                      </Box>
                    ) : (
                      <AddPhotoAlternateIcon fontSize="large" sx={{ fontSize: 48, color: '#009688', mb: 2 }} />
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: theme.palette.text.primary, mb: 0.5 }}>
                      {employeeData.photo_url ? 'Изменить фотографию' : 'Загрузить фотографию'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Формат JPG, PNG. Максимальный размер 5MB
                    </Typography>
                  </Box>
                </label>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={employeeData.is_active}
                    onChange={handleActiveChange}
                    name="is_active"
                    color="primary"
                  />
                }
                label="Активен"
                sx={{ 
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#009688'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4db6ac'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        {/* Dialog Footer with Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '16px 24px', 
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(245, 245, 245, 0.9)',
        }}>
          {/* Delete Button - show only in edit mode */}
          <Box>
            {dialogMode === 'edit' && (
          <Button 
                variant="outlined" 
                color="error"
                onClick={() => {
                  console.log('Кнопка удаления нажата, данные:', employeeData);
                  // Используем выбранный ID сотрудника напрямую, а не через employeeData
                  handleOpenDeleteDialog(selectedEmployeeId);
                }}
                startIcon={<DeleteIcon />}
                sx={{
                  minWidth: 'auto',
                  padding: '6px 12px',
                  '& .MuiButton-startIcon': {
                    marginRight: '4px'
                  }
                }}
              >
                Удалить
          </Button>
            )}
          </Box>
          
          {/* Save Button */}
          <Button 
            variant="contained" 
            onClick={handleSaveEmployee}
            disabled={createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.2,
              background: 'linear-gradient(45deg, #00897b 30%, #26a69a 90%)',
              boxShadow: '0 4px 10px rgba(0, 150, 136, 0.3)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #00796b 30%, #00897b 90%)',
                boxShadow: '0 6px 15px rgba(0, 150, 136, 0.4)',
              }
            }}
          >
            {(createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading) ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Сохранение...
              </>
            ) : (
              dialogMode === 'add' ? 'Добавить сотрудника' : 'Сохранить изменения'
            )}
          </Button>
        </Box>
      </Dialog>

      {/* Диалог просмотра услуг сотрудника */}
      <Dialog 
        open={openServicesDialog} 
        onClose={handleCloseServicesDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            maxHeight: '95vh',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          } 
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #9c27b0 20%, #673ab7 90%)',
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
            Услуги сотрудника
          </Typography>
          <IconButton
            onClick={handleCloseServicesDialog}
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
          {loadingEmployeeServices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress sx={{ color: '#9c27b0' }} />
            </Box>
          ) : employeeServicesError ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Ошибка загрузки услуг: {employeeServicesError.message}
            </Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: theme.palette.mode === 'dark' ? '#b39ddb' : '#673ab7' }}>
                    Доступные услуги
                  </Typography>
                  
                  <TextField
                    placeholder="Поиск услуг..."
                            size="small" 
                    fullWidth
                            sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      }
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    }}
                    onChange={(e) => {
                      // Simple filter by name
                      const searchValue = e.target.value.toLowerCase();
                      setFilteredServices(
                        services?.filter(service => 
                          service.name.toLowerCase().includes(searchValue) || 
                          service.category?.toLowerCase().includes(searchValue)
                        ) || []
                      );
                    }}
                  />
                  
                  <Box sx={{ 
                    flex: 1,
                    overflowY: 'auto',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                    }
                  }}>
                    <FormGroup>
                  {isLoadingServices ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                          <CircularProgress size={24} sx={{ color: '#9c27b0' }} />
                        </Box>
                  ) : (
                        (filteredServices || services || [])
                      .filter(service => employeeData.salon_id ? service.salon_id === Number(employeeData.salon_id) : true)
                      .map((service) => (
                            <MuiPaper
                              key={service.id}
                              elevation={0}
                              sx={{
                                mb: 1.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: employeeData.service_ids.includes(service.id) 
                                  ? theme.palette.mode === 'dark' 
                                    ? 'rgba(156, 39, 176, 0.2)' 
                                    : 'rgba(156, 39, 176, 0.08)'
                                  : theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.03)' 
                                    : 'rgba(0,0,0,0.02)',
                                border: '1px solid',
                                borderColor: employeeData.service_ids.includes(service.id)
                                  ? theme.palette.mode === 'dark' 
                                    ? 'rgba(156, 39, 176, 0.4)' 
                                    : 'rgba(156, 39, 176, 0.2)'
                                  : theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.05)' 
                                    : 'rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(156, 39, 176, 0.15)' 
                                    : 'rgba(156, 39, 176, 0.06)',
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Checkbox
                                  checked={employeeData.service_ids.includes(service.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setEmployeeData(prev => ({
                                      ...prev,
                                      service_ids: checked
                                        ? [...prev.service_ids, service.id]
                                        : prev.service_ids.filter(id => id !== service.id)
                                    }));
                                  }}
                                  sx={{
                                    color: theme.palette.mode === 'dark' ? '#9c27b0' : '#9c27b0',
                                    '&.Mui-checked': {
                                      color: '#9c27b0',
                                    },
                                  }}
                                />
                                <Box sx={{ ml: 1, flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ 
                                    fontWeight: 600,
                                    mb: 0.5,
                                    color: employeeData.service_ids.includes(service.id)
                                      ? theme.palette.mode === 'dark' ? '#d1c4e9' : '#4a148c'
                                      : theme.palette.text.primary
                                  }}>
                      {service.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip 
                                      label={service.category} 
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(103,58,183,0.2)' : 'rgba(103,58,183,0.1)',
                                        color: theme.palette.mode === 'dark' ? '#b39ddb' : '#673ab7',
                                        border: '1px solid',
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(103,58,183,0.3)' : 'rgba(103,58,183,0.2)',
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50' }}>
                                      {service.price} ₽
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </MuiPaper>
                          ))
                      )}
                    </FormGroup>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#b39ddb' : '#673ab7' }}>
                      Выбранные услуги ({
                        Array.isArray(employeeData.service_ids) 
                          ? employeeData.service_ids.filter(id => id !== null && id !== undefined).length 
                          : 0
                      })
                    </Typography>
                    {employeeData.service_ids && employeeData.service_ids.length > 0 && (
                      <Button
                        size="small"
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={() => {
                          setEmployeeData(prev => ({
                            ...prev,
                            service_ids: []
                          }));
                        }}
                      sx={{
                          color: theme.palette.error.main,
                          borderRadius: 2,
                          px: 2,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(244, 67, 54, 0.1)' 
                              : 'rgba(244, 67, 54, 0.05)'
                          }
                        }}
                      >
                        Очистить все
                      </Button>
                    )}
                  </Box>
                  
                  {!employeeData.service_ids || employeeData.service_ids.length === 0 ? (
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 6,
                      opacity: 0.6
                    }}>
                      <SpaIcon sx={{ fontSize: 60, color: '#9c27b0', mb: 2, opacity: 0.7 }} />
                      <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>Нет выбранных услуг</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'center', maxWidth: 400 }}>
                        Выберите услуги из списка слева, чтобы назначить их сотруднику
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                      <Grid container spacing={2}>
                        {employeeData.service_ids.map((serviceId) => {
                        const service = services?.find(s => s.id === serviceId);
                          if (!service) return null;
                          
                        return (
                            <Grid item xs={12} sm={6} md={4} key={serviceId}>
                              <MuiPaper
                                elevation={2}
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  position: 'relative',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.7)' : 'white',
                                  transition: 'all 0.2s ease',
                            '&:hover': { 
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                    '& .remove-button': {
                                      opacity: 1
                                    }
                                  }
                                }}
                              >
                                <IconButton 
                                  size="small"
                                  className="remove-button"
                                  onClick={() => {
                                    setEmployeeData(prev => ({
                                      ...prev,
                                      service_ids: prev.service_ids.filter(id => id !== serviceId)
                                    }));
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s ease',
                                    '&:hover': {
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(244,67,54,0.2)' : 'rgba(244,67,54,0.1)',
                                      color: theme.palette.error.main
                                    }
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                                
                                <Box sx={{ mb: 1.5 }}>
                              <Chip 
                                    label={service.category} 
                                size="small"
                                sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(103,58,183,0.2)' : 'rgba(103,58,183,0.1)',
                                  color: theme.palette.mode === 'dark' ? '#b39ddb' : '#673ab7',
                                      borderRadius: 1,
                                      fontWeight: 600
                                    }}
                                  />
                                </Box>
                                
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {service.name}
                                </Typography>
                                
                                <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">
                                      {service.duration} мин
                            </Typography>
                          </Box>
                                  
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4caf50' }}>
                                    {service.price} ₽
                                  </Typography>
                                </Box>
                              </MuiPaper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          py: 2, 
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={handleCloseServicesDialog}
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
            onClick={handleSaveServices}
            disabled={updateEmployeeMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #26c6da 20%, #00acc1 90%)',
              boxShadow: '0 4px 12px rgba(0, 172, 193, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0, 172, 193, 0.4)',
                background: 'linear-gradient(135deg, #00acc1 20%, #0097a7 90%)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Сохранить
            {updateEmployeeMutation.isLoading && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для расписания сотрудника */}
      <Dialog 
        open={openScheduleDialog} 
        onClose={handleCloseScheduleDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            maxHeight: '95vh',
            maxWidth: { xs: '95%', sm: '90%', md: '85%' },
            margin: { xs: '10px', sm: '20px', md: 'auto' },
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          } 
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #ff9800 20%, #f57c00 90%)',
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
            Расписание сотрудника
          </Typography>
          <IconButton
            onClick={handleCloseScheduleDialog}
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
        <DialogContent sx={{ p: 0, pb: 0 }}>
          <EmployeeSchedule 
            employeeId={selectedEmployeeId} 
            onClose={handleCloseScheduleDialog} 
          />
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #f44336 20%, #e91e63 90%)',
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
            Подтверждение удаления
          </Typography>
          <IconButton
            onClick={handleCloseDeleteDialog}
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
          <Typography>
            Вы уверены, что хотите удалить этого сотрудника? Это действие невозможно отменить.
          </Typography>
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
            onClick={handleCloseDeleteDialog}
            sx={{
              borderRadius: 2,
              px: 3,
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            }}
          >
            Отмена
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteEmployee}
            disabled={deleteEmployeeMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(135deg, #f44336 20%, #e91e63 90%)',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
                background: 'linear-gradient(135deg, #d32f2f 20%, #c2185b 90%)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)',
              },
              transition: 'all 0.2s ease'
            }}
          >
            Удалить
            {deleteEmployeeMutation.isLoading && (
              <CircularProgress size={20} sx={{ ml: 1, color: 'white' }} />
            )}
          </Button>
        </Box>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default EmployeeManagement; 