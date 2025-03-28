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
  Divider,
  Chip,
  InputAdornment,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table, 
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControlLabel,
  Switch,
  TablePagination,
  useMediaQuery,
  useTheme,
  ListItem,
  ListItemText,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  SwipeableDrawer,
  Badge
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceApi } from '../../api/services';
import { salonApi } from '../../api/salons';
import { employeeApi } from '../../api/employees';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FilterListIcon from '@mui/icons-material/FilterList';
import CategoryIcon from '@mui/icons-material/Category';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StoreIcon from '@mui/icons-material/Store';
import CloseIcon from '@mui/icons-material/Close';

const ServiceManagement = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    salon_id: '',
    category: '',
    min_price: '',
    max_price: '',
    active_only: false,
    employee_id: ''
  });
  const [openFiltersDrawer, setOpenFiltersDrawer] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [serviceData, setServiceData] = useState({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    salon_id: '',
    active: true,
    image_url: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [categoryOptions, setCategoryOptions] = useState([
    'Волосы', 'Ногти', 'Макияж', 'Брови и ресницы', 'Массаж', 'Косметология', 'Другое'
  ]);

  // На мобильных устройствах изменяем количество элементов на странице
  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  // Получение списка услуг
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
    refetch: refetchServices
  } = useQuery(
    ['services'],
    () => serviceApi.getAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );

  // Получение списка салонов для фильтрации и выбора в форме
  const {
    data: salons,
    isLoading: isLoadingSalons,
    error: salonsError
  } = useQuery(
    ['salons'],
    () => salonApi.getAll(),
    {
      staleTime: 10 * 60 * 1000, // 10 минут
    }
  );

  // Получение списка сотрудников для фильтрации
  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError
  } = useQuery(
    ['employees'],
    () => employeeApi.getAll(),
    {
      staleTime: 10 * 60 * 1000, // 10 минут
    }
  );

  // Получение информации о конкретной услуге
  const {
    data: serviceDetails,
    isLoading: isLoadingServiceDetails,
    error: serviceDetailsError
  } = useQuery(
    ['service', selectedServiceId],
    () => serviceApi.getById(selectedServiceId),
    {
      enabled: !!selectedServiceId && openDialog && dialogMode === 'edit',
      staleTime: 5 * 60 * 1000, // 5 минут
      onSuccess: (data) => {
        if (data && dialogMode === 'edit') {
          setServiceData({
            name: data.name,
            category: data.category,
            price: data.price.toString(),
            duration: data.duration.toString(),
            description: data.description || '',
            salon_id: data.salon_id.toString(),
            active: data.active !== false,
            image_url: data.image_url || ''
          });
        }
      }
    }
  );

  // Мутация для создания услуги
  const createServiceMutation = useMutation(
    (serviceData) => serviceApi.create({
      ...serviceData,
      price: Number(serviceData.price),
      duration: Number(serviceData.duration),
      salon_id: Number(serviceData.salon_id)
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services']);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Услуга успешно создана',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при создании услуги: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для обновления услуги
  const updateServiceMutation = useMutation(
    ({ id, data }) => serviceApi.update(id, {
      ...data,
      price: Number(data.price),
      duration: Number(data.duration),
      salon_id: Number(data.salon_id)
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services']);
        queryClient.invalidateQueries(['service', selectedServiceId]);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Услуга успешно обновлена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при обновлении услуги: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Мутация для удаления услуги
  const deleteServiceMutation = useMutation(
    (id) => serviceApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services']);
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: 'Услуга успешно удалена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setOpenDeleteDialog(false);
        setSnackbar({
          open: true,
          message: `Ошибка при удалении услуги: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'active') {
      setServiceData(prev => ({ ...prev, [name]: checked }));
    } else {
      setServiceData(prev => ({ ...prev, [name]: value }));
    }
    
    // Сброс ошибки валидации при изменении поля
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Валидация формы
  const validateForm = () => {
    const errors = {};
    
    if (!serviceData.name.trim()) {
      errors.name = 'Название услуги обязательно';
    }
    
    if (!serviceData.category) {
      errors.category = 'Категория услуги обязательна';
    }
    
    if (!serviceData.price.trim()) {
      errors.price = 'Цена услуги обязательна';
    } else if (isNaN(Number(serviceData.price)) || Number(serviceData.price) <= 0) {
      errors.price = 'Цена должна быть положительным числом';
    }
    
    if (!serviceData.duration.trim()) {
      errors.duration = 'Длительность услуги обязательна';
    } else if (isNaN(Number(serviceData.duration)) || Number(serviceData.duration) <= 0) {
      errors.duration = 'Длительность должна быть положительным числом';
    }
    
    if (!serviceData.salon_id) {
      errors.salon_id = 'Салон обязателен';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Обработчик открытия диалога добавления услуги
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setSelectedServiceId(null);
    setServiceData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      salon_id: '',
      active: true,
      image_url: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Обработчик открытия диалога редактирования услуги
  const handleOpenEditDialog = (serviceId) => {
    setDialogMode('edit');
    setSelectedServiceId(serviceId);
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Обработчик закрытия диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setServiceData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      salon_id: '',
      active: true,
      image_url: ''
    });
    setValidationErrors({});
  };

  // Обработчик открытия диалога удаления
  const handleOpenDeleteDialog = (serviceId) => {
    setSelectedServiceId(serviceId);
    setOpenDeleteDialog(true);
  };

  // Обработчик закрытия диалога удаления
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedServiceId(null);
  };

  // Обработчик сохранения услуги
  const handleSaveService = () => {
    if (validateForm()) {
      if (dialogMode === 'add') {
        createServiceMutation.mutate(serviceData);
      } else {
        updateServiceMutation.mutate({ id: selectedServiceId, data: serviceData });
      }
    }
  };

  // Обработчик удаления услуги
  const handleDeleteService = () => {
    if (selectedServiceId) {
      deleteServiceMutation.mutate(selectedServiceId);
    }
  };

  // Обработчик изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'active_only') {
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Обработчик сброса фильтров
  const handleResetFilters = () => {
    setFilters({
      salon_id: '',
      category: '',
      min_price: '',
      max_price: '',
      active_only: false,
      employee_id: ''
    });
  };

  // Обработчик закрытия snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Обработчик изменения страницы пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Обработчик изменения количества строк на странице
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Собираем уникальные категории из списка услуг для фильтра и выпадающего списка
  useEffect(() => {
    if (services && services.length > 0) {
      const uniqueCategories = [...new Set(services.map(service => service.category))];
      if (uniqueCategories.length > 0) {
        setCategoryOptions(uniqueCategories);
      }
    }
  }, [services]);

  // Проверяем, был ли переход с выбранным салоном из другого компонента
  useEffect(() => {
    const selectedSalonIdFromStorage = localStorage.getItem('selectedSalonIdForServices');
    
    if (selectedSalonIdFromStorage && salons) {
      // Проверяем существует ли салон с указанным ID
      const salonExists = salons.some(salon => salon.id === Number(selectedSalonIdFromStorage));
      
      if (salonExists) {
        // Устанавливаем фильтр по выбранному салону
        setFilters(prev => ({ 
          ...prev, 
          salon_id: selectedSalonIdFromStorage 
        }));
        
        // Открываем диалог с фильтрами, чтобы пользователь видел примененный фильтр
        setOpenFiltersDrawer(true);
        
        // Показываем уведомление о примененном фильтре
        const salonName = salons?.find(salon => salon.id === Number(selectedSalonIdFromStorage))?.name || 'выбранному салону';
        setSnackbar({
          open: true,
          message: `Отображены услуги для ${salonName}`,
          severity: 'info'
        });
      } else {
        // Показываем уведомление об ошибке
        setSnackbar({
          open: true,
          message: `Салон с ID ${selectedSalonIdFromStorage} не найден`,
          severity: 'error'
        });
      }
      
      // Очищаем хранилище после использования
      localStorage.removeItem('selectedSalonIdForServices');
    }
  }, [salons]);

  // Проверяем, был ли переход с выбранным сотрудником из другого компонента
  useEffect(() => {
    const selectedEmployeeIdFromStorage = localStorage.getItem('selectedEmployeeIdForServices');
    
    if (selectedEmployeeIdFromStorage && employees) {
      // Проверяем существует ли сотрудник с указанным ID
      const employeeExists = employees.some(emp => emp.id === Number(selectedEmployeeIdFromStorage));
      
      if (employeeExists) {
        // Устанавливаем фильтр по выбранному сотруднику
        setFilters(prev => ({ 
          ...prev, 
          employee_id: selectedEmployeeIdFromStorage 
        }));
        
        // Открываем диалог с фильтрами, чтобы пользователь видел примененный фильтр
        setOpenFiltersDrawer(true);
        
        // Показываем уведомление о примененном фильтре с именем сотрудника
        const employee = employees.find(emp => emp.id === Number(selectedEmployeeIdFromStorage));
        const employeeName = employee 
          ? `${employee.first_name} ${employee.last_name}`
          : 'выбранного сотрудника';
          
        setSnackbar({
          open: true,
          message: `Отображены услуги для ${employeeName}`,
          severity: 'info'
        });
      } else {
        // Показываем уведомление об ошибке
        setSnackbar({
          open: true,
          message: `Сотрудник с ID ${selectedEmployeeIdFromStorage} не найден`,
          severity: 'error'
        });
      }
      
      // Очищаем хранилище после использования
      localStorage.removeItem('selectedEmployeeIdForServices');
    }
  }, [employees]);

  // Фильтрация и сортировка услуг
  const filteredServices = services?.filter(service => {
    let matchesSearch = true;
    let matchesFilters = true;
    
    // Поисковой запрос
    if (searchQuery) {
      matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Фильтры
    if (filters.salon_id && service.salon_id !== Number(filters.salon_id)) {
      matchesFilters = false;
    }
    
    if (filters.category && service.category !== filters.category) {
      matchesFilters = false;
    }
    
    if (filters.min_price && service.price < Number(filters.min_price)) {
      matchesFilters = false;
    }
    
    if (filters.max_price && service.price > Number(filters.max_price)) {
      matchesFilters = false;
    }
    
    if (filters.active_only && !service.active) {
      matchesFilters = false;
    }
    
    // Фильтр по сотруднику
    if (filters.employee_id && service.employee_ids) {
      // Проверяем, есть ли ID выбранного сотрудника в массиве employee_ids услуги
      if (!service.employee_ids.includes(Number(filters.employee_id))) {
        matchesFilters = false;
      }
    }
    
    return matchesSearch && matchesFilters;
  }) || [];

  // Тестовые данные для услуг
  const mockServices = [
    {
      id: 1,
      name: 'Женская стрижка',
      category: 'Волосы',
      price: 1500,
      duration: 60,
      description: 'Профессиональная женская стрижка с учетом типа волос и формы лица',
      salon_id: 1,
      salon_name: 'Салон красоты "Элегант"',
      active: true
    },
    {
      id: 2,
      name: 'Маникюр',
      category: 'Ногти',
      price: 1000,
      duration: 45,
      description: 'Профессиональный маникюр с обработкой кутикулы',
      salon_id: 1,
      salon_name: 'Салон красоты "Элегант"',
      active: true
    },
    {
      id: 3,
      name: 'Мужская стрижка',
      category: 'Волосы',
      price: 1200,
      duration: 45,
      description: 'Мужская стрижка любой сложности',
      salon_id: 2,
      salon_name: 'Барбершоп "Бородач"',
      active: true
    },
    {
      id: 4,
      name: 'Окрашивание волос',
      category: 'Волосы',
      price: 3000,
      duration: 120,
      description: 'Окрашивание волос профессиональными красителями',
      salon_id: 1,
      salon_name: 'Салон красоты "Элегант"',
      active: false
    },
    {
      id: 5,
      name: 'Наращивание ногтей',
      category: 'Ногти',
      price: 2500,
      duration: 120,
      description: 'Наращивание ногтей гелем',
      salon_id: 3,
      salon_name: 'Салон "Ноготок"',
      active: true
    }
  ];

  // Тестовые данные для салонов
  const mockSalons = [
    { id: 1, name: 'Салон красоты "Элегант"' },
    { id: 2, name: 'Барбершоп "Бородач"' },
    { id: 3, name: 'Салон "Ноготок"' }
  ];

  // Тестовые данные для сотрудников, если API не вернуло результаты
  const mockEmployees = [
    { id: 1, first_name: 'Анна', last_name: 'Иванова', position: 'Старший парикмахер' },
    { id: 2, first_name: 'Михаил', last_name: 'Петров', position: 'Барбер' },
    { id: 3, first_name: 'Елена', last_name: 'Смирнова', position: 'Мастер маникюра' },
  ];

  // Используем тестовые данные, если API не вернуло результаты
  const displayServices = services || mockServices;
  const displaySalons = salons || mockSalons;
  const displayEmployees = employees || mockEmployees;
  
  // Применяем фильтрацию к отображаемым услугам
  const displayFilteredServices = searchQuery || Object.values(filters).some(value => value)
    ? displayServices.filter(service => {
        let matchesSearch = true;
        let matchesFilters = true;
        
        // Поисковой запрос
        if (searchQuery) {
          matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        
        // Фильтры
        if (filters.salon_id && service.salon_id !== Number(filters.salon_id)) {
          matchesFilters = false;
        }
        
        if (filters.category && service.category !== filters.category) {
          matchesFilters = false;
        }
        
        if (filters.min_price && service.price < Number(filters.min_price)) {
          matchesFilters = false;
        }
        
        if (filters.max_price && service.price > Number(filters.max_price)) {
          matchesFilters = false;
        }
        
        if (filters.active_only && !service.active) {
          matchesFilters = false;
        }
        
        // Фильтр по сотруднику
        if (filters.employee_id && service.employee_ids) {
          // Проверяем, есть ли ID выбранного сотрудника в массиве employee_ids услуги
          if (!service.employee_ids.includes(Number(filters.employee_id))) {
            matchesFilters = false;
          }
        }
        
        return matchesSearch && matchesFilters;
      })
    : displayServices;

  // Применяем пагинацию
  const paginatedServices = displayFilteredServices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Функция для получения названия салона по ID
  const getSalonNameById = (salonId) => {
    const salon = displaySalons.find(s => s.id === salonId);
    return salon ? salon.name : 'Неизвестный салон';
  };

  if (isLoadingServices) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (servicesError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка при загрузке услуг: {servicesError.message}
      </Alert>
    );
  }

  // Проверка активных фильтров для отображения баджа
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Box sx={{ mb: 4, position: 'relative' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant="h5" sx={{ mb: isMobile ? 1 : 0 }}>
          Управление услугами
        </Typography>
        {!isMobile && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Добавить услугу
          </Button>
        )}
      </Box>

      {/* Поиск */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Поиск по названию или описанию..."
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setOpenFiltersDrawer(true)}
                sx={{ mr: 1 }}
              >
                Фильтры
                {activeFiltersCount > 0 && (
                  <Badge 
                    badgeContent={activeFiltersCount} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button
                  variant="text"
                  onClick={handleResetFilters}
                >
                  Сбросить
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Десктопное представление: Таблица услуг */}
      {!isMobile && (
        <Paper sx={{ mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Салон</TableCell>
                  <TableCell align="right">Цена (₽)</TableCell>
                  <TableCell align="right">Длительность (мин)</TableCell>
                  <TableCell align="center">Статус</TableCell>
                  <TableCell align="center">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedServices.length > 0 ? (
                  paginatedServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={<CategoryIcon />}
                          label={service.category} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{service.salon_name || getSalonNameById(service.salon_id)}</TableCell>
                      <TableCell align="right">{service.price}</TableCell>
                      <TableCell align="right">{service.duration}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={service.active ? 'Активна' : 'Неактивна'} 
                          color={service.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Tooltip title="Редактировать">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(service.id)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(service.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {searchQuery || Object.values(filters).some(value => value)
                        ? "Услуги по вашему запросу не найдены. Попробуйте изменить параметры поиска или фильтры."
                        : "Список услуг пуст. Нажмите 'Добавить услугу', чтобы создать новую услугу."
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Пагинация для десктопа */}
          {displayFilteredServices.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={displayFilteredServices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Строк на странице:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
            />
          )}
        </Paper>
      )}

      {/* Мобильное представление: Карточки услуг */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          {paginatedServices.length > 0 ? (
            paginatedServices.map((service) => (
              <Card key={service.id} sx={{ mb: 2 }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {service.name}
                    </Typography>
                    <Chip 
                      label={service.active ? 'Активна' : 'Неактивна'} 
                      color={service.active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CategoryIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {service.category}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {service.duration} мин
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StoreIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {service.salon_name || getSalonNameById(service.salon_id)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {service.price} ₽
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />} 
                    onClick={() => handleOpenEditDialog(service.id)}
                    fullWidth
                  >
                    Редактировать
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<DeleteIcon />} 
                    color="error"
                    onClick={() => handleOpenDeleteDialog(service.id)}
                    fullWidth
                  >
                    Удалить
                  </Button>
                </CardActions>
              </Card>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              {searchQuery || Object.values(filters).some(value => value)
                ? "Услуги по вашему запросу не найдены. Попробуйте изменить параметры поиска или фильтры."
                : "Список услуг пуст. Нажмите 'Добавить услугу', чтобы создать новую услугу."
              }
            </Paper>
          )}
          
          {/* Пагинация для мобильных устройств */}
          {displayFilteredServices.length > 0 && (
            <Paper sx={{ mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10]}
                component="div"
                count={displayFilteredServices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="На странице:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
              />
            </Paper>
          )}
        </Box>
      )}

      {/* Фильтры в виде выдвижной панели для мобильных */}
      <SwipeableDrawer
        anchor="bottom"
        open={openFiltersDrawer}
        onClose={() => setOpenFiltersDrawer(false)}
        onOpen={() => setOpenFiltersDrawer(true)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '80%'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Фильтры</Typography>
            <IconButton 
              edge="end" 
              onClick={() => setOpenFiltersDrawer(false)}
              aria-label="закрыть фильтры"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="salon-filter-label">Салон</InputLabel>
                <Select
                  labelId="salon-filter-label"
                  name="salon_id"
                  value={filters.salon_id}
                  onChange={handleFilterChange}
                  label="Салон"
                >
                  <MenuItem value="">Все салоны</MenuItem>
                  {displaySalons.map((salon) => (
                    <MenuItem key={salon.id} value={salon.id.toString()}>
                      {salon.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="employee-filter-label">Сотрудник</InputLabel>
                <Select
                  labelId="employee-filter-label"
                  name="employee_id"
                  value={filters.employee_id}
                  onChange={handleFilterChange}
                  label="Сотрудник"
                >
                  <MenuItem value="">Все сотрудники</MenuItem>
                  {isLoadingEmployees ? (
                    <MenuItem disabled>Загрузка сотрудников...</MenuItem>
                  ) : (
                    displayEmployees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id.toString()}>
                        {`${employee.first_name} ${employee.last_name} (${employee.position})`}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-filter-label">Категория</InputLabel>
                <Select
                  labelId="category-filter-label"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  label="Категория"
                >
                  <MenuItem value="">Все категории</MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                name="min_price"
                label="Мин. цена"
                type="number"
                value={filters.min_price}
                onChange={handleFilterChange}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                name="max_price"
                label="Макс. цена"
                type="number"
                value={filters.max_price}
                onChange={handleFilterChange}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="active_only"
                    checked={filters.active_only}
                    onChange={handleFilterChange}
                    color="primary"
                  />
                }
                label="Только активные услуги"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleResetFilters} color="inherit">
              Сбросить все
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setOpenFiltersDrawer(false)}
            >
              Применить
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Плавающая кнопка добавления для мобильных устройств */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
          onClick={handleOpenAddDialog}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Остальные диалоги и компоненты */}
      
      {/* Диалог добавления/редактирования услуги */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Добавить новую услугу' : 'Редактировать услугу'}
          {isMobile && (
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers={isMobile}>
          {(dialogMode === 'edit' && isLoadingServiceDetails) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: isMobile ? 0 : 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Название услуги"
                  value={serviceData.name}
                  onChange={handleInputChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required 
                  error={!!validationErrors.category}
                  margin="normal"
                >
                  <InputLabel id="category-label">Категория</InputLabel>
                  <Select
                    labelId="category-label"
                    name="category"
                    value={serviceData.category}
                    onChange={handleInputChange}
                    label="Категория"
                  >
                    {categoryOptions.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.category && (
                    <Typography variant="caption" color="error">
                      {validationErrors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="price"
                  label="Цена"
                  type="number"
                  value={serviceData.price}
                  onChange={handleInputChange}
                  error={!!validationErrors.price}
                  helperText={validationErrors.price}
                  fullWidth
                  required
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="duration"
                  label="Длительность"
                  type="number"
                  value={serviceData.duration}
                  onChange={handleInputChange}
                  error={!!validationErrors.duration}
                  helperText={validationErrors.duration}
                  fullWidth
                  required
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">мин</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  required 
                  error={!!validationErrors.salon_id}
                  margin="normal"
                >
                  <InputLabel id="salon-label">Салон</InputLabel>
                  <Select
                    labelId="salon-label"
                    name="salon_id"
                    value={serviceData.salon_id}
                    onChange={handleInputChange}
                    label="Салон"
                  >
                    {isLoadingSalons ? (
                      <MenuItem disabled>Загрузка салонов...</MenuItem>
                    ) : (
                      displaySalons.map((salon) => (
                        <MenuItem key={salon.id} value={salon.id.toString()}>
                          {salon.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {validationErrors.salon_id && (
                    <Typography variant="caption" color="error">
                      {validationErrors.salon_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="image_url"
                  label="URL изображения"
                  value={serviceData.image_url}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  placeholder="https://example.com/service.jpg"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Описание"
                  value={serviceData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="active"
                      checked={serviceData.active}
                      onChange={handleInputChange}
                      color="primary"
                    />
                  }
                  label="Услуга активна"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: isMobile ? 3 : 2, py: isMobile ? 2 : 1 }}>
          <Button onClick={handleCloseDialog} color="inherit">Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveService}
            disabled={
              isLoadingServiceDetails || 
              createServiceMutation.isLoading || 
              updateServiceMutation.isLoading
            }
          >
            {dialogMode === 'add' ? 'Добавить' : 'Сохранить'}
            {(createServiceMutation.isLoading || updateServiceMutation.isLoading) && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить эту услугу? Это действие невозможно отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="inherit">Отмена</Button>
          <Button 
            color="error" 
            onClick={handleDeleteService}
            disabled={deleteServiceMutation.isLoading}
          >
            Удалить
            {deleteServiceMutation.isLoading && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceManagement; 