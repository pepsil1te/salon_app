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
  Badge,
  SelectChangeEvent,
  AppBar,
  Toolbar
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceApi } from '../../api/services';
import { salonApi } from '../../api/salons';
import { employeeApi } from '../../api/employees';
import { Service as ServiceType, ServiceAssignment, Salon, Employee } from '../../types/employee';
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
import CancelIcon from '@mui/icons-material/Cancel';
import SpaIcon from '@mui/icons-material/Spa';
import ImageIcon from '@mui/icons-material/Image';
import { Link } from 'react-router-dom';
import FileUploader from '../common/FileUploader';
import { formatCurrency } from '../../utils/formatters';
import ServiceCategoryManager from './ServiceCategoryManager';
import { alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

// Используем импортированный тип как базу для локального типа
interface Service extends ServiceType {
  salon_name?: string;
}

interface ServiceForm {
  name: string;
  category: string;
  category_id?: number;
  price: string;
  duration: string;
  description: string;
  salon_id: string;
  active: boolean;
  image_url: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface ServiceManagementProps {
  defaultSalonId?: number;
  singleSalonMode?: boolean;
}

const ServiceManagement: React.FC<ServiceManagementProps> = ({ defaultSalonId, singleSalonMode = false }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [filters, setFilters] = useState<{
    salon_id: string;
    category: string;
    min_price: string;
    max_price: string;
    active_only: boolean;
    employee_id: string;
    searchQuery: string;
  }>({
    salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
    category: '',
    min_price: '',
    max_price: '',
    active_only: false,
    employee_id: '',
    searchQuery: '',
  });
  const [openFiltersDrawer, setOpenFiltersDrawer] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [serviceData, setServiceData] = useState<ServiceForm>({
    name: '',
    category: '',
    price: '',
    duration: '',
    description: '',
    salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
    active: true,
    image_url: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState([
    'Волосы', 'Ногти', 'Макияж', 'Брови и ресницы', 'Массаж', 'Косметология', 'Другое'
  ]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [openDeleteConfirmDialog, setOpenDeleteConfirmDialog] = useState(false);

  // Standardized gradients for consistent UI
  const primaryGradient = theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)'
    : 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)';
  
  const lightGradient = theme.palette.mode === 'dark' 
    ? 'linear-gradient(90deg, rgba(103, 58, 183, 0.15) 0%, rgba(0,0,0,0) 100%)'
    : 'linear-gradient(90deg, rgba(103, 58, 183, 0.1) 0%, rgba(255,255,255,0) 100%)';
  
  const dangerGradient = theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #f44336 20%, #e91e63 90%)'
    : 'linear-gradient(135deg, #f44336 20%, #e91e63 90%)';

  // Эффекты и запросы к API
  useEffect(() => {
    if (singleSalonMode && defaultSalonId) {
      setFilters(prev => ({ ...prev, salon_id: String(defaultSalonId) }));
      setServiceData(prev => ({ ...prev, salon_id: String(defaultSalonId) }));
    }
  }, [singleSalonMode, defaultSalonId]);

  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
    refetch: refetchServices
  } = useQuery(
    ['services'],
    () => serviceApi.getAll(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const {
    data: salons,
    isLoading: isLoadingSalons,
    error: salonsError
  } = useQuery(
    ['salons'],
    () => salonApi.getAll(),
    {
      staleTime: 5 * 60 * 1000,
      enabled: !singleSalonMode
    }
  );

  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError
  } = useQuery(
    ['employees'],
    () => employeeApi.getAll(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const {
    data: categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories
  } = useQuery(['serviceCategories'], () => serviceApi.getCategories(Number(defaultSalonId)), {
    staleTime: 5 * 60 * 1000,
    enabled: !!defaultSalonId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const categoryNames = data.map(category => category.name);
        setCategoryOptions(prevOptions => {
          const defaultCategories = ['Волосы', 'Ногти', 'Макияж', 'Брови и ресницы', 'Массаж', 'Косметология', 'Другое'];
          return data.length > 0 ? categoryNames : [...new Set([...categoryNames, ...defaultCategories])];
        });
      }
    }
  });

  const {
    data: serviceDetails,
    isLoading: isLoadingServiceDetails,
    error: serviceDetailsError,
    refetch: refetchServiceDetails
  } = useQuery(
    ['service', selectedServiceId],
    () => {
      if (selectedServiceId === null) {
        throw new Error('Service ID is not available');
      }
      return serviceApi.getById(selectedServiceId);
    },
    {
      enabled: !!selectedServiceId && openDialog && dialogMode === 'edit',
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        if (data && dialogMode === 'edit') {
          // Find matching category to get its ID
          const matchingCategory = categories?.find(cat => cat.name === data.category);
          
          setServiceData({
            name: data.name,
            category: data.category,
            category_id: data.category_id || matchingCategory?.id,
            price: Math.round(data.price).toString(),
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

  // Add useEffect to refetch service details when dialog opens
  useEffect(() => {
    if (openDialog && dialogMode === 'edit' && selectedServiceId) {
      refetchServiceDetails();
    }
  }, [openDialog, dialogMode, selectedServiceId]);

  const createServiceMutation = useMutation(
    (data: ServiceForm) => serviceApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('services');
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Услуга успешно создана',
          severity: 'success'
        });
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: 'Ошибка при создании услуги',
          severity: 'error'
        });
      }
    }
  );

  const updateServiceMutation = useMutation(
    ({ id, data }: { id: number; data: ServiceForm }) => serviceApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('services');
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Услуга успешно обновлена',
          severity: 'success'
        });
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: 'Ошибка при обновлении услуги',
          severity: 'error'
        });
      }
    }
  );

  // Определение мутации для удаления услуги
  const deleteServiceMutation = useMutation<void, Error, number | null>(
    (serviceId) => {
      if (serviceId === null) {
        throw new Error('ID услуги не определен');
      }
      return serviceApi.delete(serviceId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['services']);
      }
    }
  );

  // Обработчики и функции
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name) {
      if (type === 'checkbox') {
        setServiceData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      } else {
        setServiceData(prev => ({ ...prev, [name]: value }));
      }
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setServiceData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setServiceData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!serviceData.name.trim()) {
      errors.name = 'Название услуги обязательно';
    }
    
    if (!serviceData.category) {
      errors.category = 'Категория услуги обязательна';
    }
    
    if (!serviceData.price.trim()) {
      errors.price = 'Цена услуги обязательна';
    } else {
      const priceValue = Number(serviceData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.price = 'Цена должна быть положительным числом';
      } else if (!Number.isInteger(priceValue)) {
        errors.price = 'Цена должна быть целым числом';
      }
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

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setServiceData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
      active: true,
      image_url: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (serviceId: number) => {
    setDialogMode('edit');
    setSelectedServiceId(serviceId);
    setValidationErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setServiceData({
      name: '',
      category: '',
      price: '',
      duration: '',
      description: '',
      salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
      active: true,
      image_url: ''
    });
    setValidationErrors({});
  };

  const handleOpenDeleteDialog = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedServiceId(null);
  };

  const handleSaveService = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);
      const preparedData = {
        ...serviceData,
        price: parseFloat(serviceData.price),
        duration: parseInt(serviceData.duration, 10),
        is_active: serviceData.active,
        salon_id: Number(serviceData.salon_id)
      } as any; // Используем type assertion, так как API ожидает числа, а форма использует строки

      if (dialogMode === 'add') {
        await createServiceMutation.mutateAsync(preparedData);
        // Инвалидируем кэш категорий после создания новой услуги
        queryClient.invalidateQueries(['serviceCategories']);
      } else if (selectedServiceId) {
        await updateServiceMutation.mutateAsync({
          id: selectedServiceId,
          data: preparedData
        });
      }

      handleCloseDialog();
      setSnackbar({
        open: true,
        message: dialogMode === 'add' ? 'Услуга успешно создана' : 'Услуга успешно обновлена',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Ошибка: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteService = async () => {
    try {
      if (selectedServiceId === null) {
        throw new Error('ID услуги не определен');
      }
      await deleteServiceMutation.mutateAsync(selectedServiceId);
      handleCloseDeleteConfirm();
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Услуга успешно удалена',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Ошибка при удалении услуги',
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (name: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    console.log(`Filter changed: ${name} = ${value}`);
  };

  const handleResetFilters = () => {
    setFilters({
      salon_id: singleSalonMode && defaultSalonId ? String(defaultSalonId) : '',
      category: '',
      min_price: '',
      max_price: '',
      active_only: false,
      employee_id: '',
      searchQuery: '',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (services && services.length > 0) {
      const uniqueCategories = [...new Set(services.map(service => service.category))];
      if (uniqueCategories.length > 0) {
        setCategoryOptions(uniqueCategories);
      }
    }
  }, [services]);

  useEffect(() => {
    const selectedSalonIdFromStorage = localStorage.getItem('selectedSalonIdForServices');
    
    if (selectedSalonIdFromStorage && salons) {
      const salonExists = salons.some(salon => salon.id === Number(selectedSalonIdFromStorage));
      
      if (salonExists) {
        setFilters(prev => ({ 
          ...prev, 
          salon_id: selectedSalonIdFromStorage 
        }));
        
        setOpenFiltersDrawer(true);
        
        const salonName = salons?.find(salon => salon.id === Number(selectedSalonIdFromStorage))?.name || 'выбранному салону';
        setSnackbar({
          open: true,
          message: `Отображены услуги для ${salonName}`,
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Салон с ID ${selectedSalonIdFromStorage} не найден`,
          severity: 'error'
        });
      }
      
      localStorage.removeItem('selectedSalonIdForServices');
    }
  }, [salons]);

  useEffect(() => {
    const selectedEmployeeIdFromStorage = localStorage.getItem('selectedEmployeeIdForServices');
    
    if (selectedEmployeeIdFromStorage && employees) {
      const employeeExists = employees.some(emp => emp.id === Number(selectedEmployeeIdFromStorage));
      
      if (employeeExists) {
        setFilters(prev => ({ 
          ...prev, 
          employee_id: selectedEmployeeIdFromStorage 
        }));
        
        setOpenFiltersDrawer(true);
        
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
        setSnackbar({
          open: true,
          message: `Сотрудник с ID ${selectedEmployeeIdFromStorage} не найден`,
          severity: 'error'
        });
      }
      
      localStorage.removeItem('selectedEmployeeIdForServices');
    }
  }, [employees]);

  const filteredServices = services?.filter(service => {
    let matchesSearch = true;
    let matchesFilters = true;
    
    if (filters.searchQuery) {
      matchesSearch = service.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                    (service.description && service.description.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    }
    
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
    
    if (filters.employee_id && Number(filters.employee_id) > 0) {
      const employeeServiceIds = employees?.find(emp => emp.id === Number(filters.employee_id))?.service_ids || [];
      if (!employeeServiceIds.includes(service.id)) {
        matchesFilters = false;
      }
    }
    
    return matchesSearch && matchesFilters;
  }) || [];

  const displayServices = services || [];
  const displaySalons = salons || [];
  const displayEmployees = employees || [];
  
  const displayFilteredServices = displayServices.filter(service => {
    let matchesSearch = true;
    let matchesFilters = true;
    
    if (filters.searchQuery) {
      matchesSearch = service.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                    (service.description && service.description.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    }
    
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
    
    if (filters.employee_id && Number(filters.employee_id) > 0) {
      const employeeServiceIds = employees?.find(emp => emp.id === Number(filters.employee_id))?.service_ids || [];
      if (!employeeServiceIds.includes(service.id)) {
        matchesFilters = false;
      }
    }
    
    return matchesSearch && matchesFilters;
  });

  const paginatedServices = displayFilteredServices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getSalonNameById = (salonId: number): string => {
    const salon = displaySalons.find(s => s.id === salonId);
    return salon ? salon.name : 'Неизвестный салон';
  };

  // Добавим функции для работы с количеством и фильтрами
  const getFilteredCount = (): number => {
    return filteredServices?.length || 0;
  };

  const getServiceCountText = (count: number): string => {
    if (count === 1) return 'услуга';
    if (count >= 2 && count <= 4) return 'услуги';
    return 'услуг';
  };

  const getActiveFiltersCount = (): number => {
    // Debug the values of each filter
    console.log('Filter values:', {
      salon_id: filters.salon_id,
      category: filters.category,
      min_price: filters.min_price,
      max_price: filters.max_price,
      active_only: filters.active_only,
      employee_id: filters.employee_id,
      searchQuery: filters.searchQuery
    });
    
    let count = 0;
    if (filters.salon_id && filters.salon_id !== '' && !singleSalonMode) count++;
    if (filters.category && filters.category !== '') count++;
    if (filters.min_price && filters.min_price !== '') count++;
    if (filters.max_price && filters.max_price !== '') count++;
    if (filters.active_only === true) count++;
    if (filters.employee_id && filters.employee_id !== '') count++;
    if (filters.searchQuery && filters.searchQuery !== '') count++;
    
    return count;
  };

  const handleEditService = (service: Service) => {
    setSelectedServiceId(service.id);
    setDialogMode('edit');
    
    // The service details will be loaded by the query when the dialog is opened
    setOpenDialog(true);
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleFileUpload = (file: File) => {
    // Handle file upload logic here
    console.log('File uploaded:', file);
    setIsUploading(true);
    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false);
      setServiceData(prev => ({ ...prev, image_url: URL.createObjectURL(file) }));
    }, 2000);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleOpenFiltersDrawer = () => {
    console.log('Opening filters drawer');
    setOpenFiltersDrawer(true);
  };

  const handleOpenDeleteConfirm = () => {
    setOpenDeleteConfirmDialog(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirmDialog(false);
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
        Ошибка при загрузке услуг: {typeof servicesError === 'object' && servicesError ? (servicesError as Error).message : 'Неизвестная ошибка'}
      </Alert>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        mb: 4,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(to right, rgba(103, 58, 183, 0.15), rgba(63, 81, 181, 0.05))'
          : 'linear-gradient(to right, rgba(103, 58, 183, 0.1), rgba(63, 81, 181, 0.02))',
        borderRadius: 2,
        py: 2,
        px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SpaIcon sx={{ 
            fontSize: '2rem', 
            color: theme.palette.primary.main,
            mr: 2
          }} />
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.mode === 'dark' ? '#9575cd' : '#673ab7',
              }}
            >
              Управление услугами
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {getFilteredCount()} {getServiceCountText(getFilteredCount())}
            </Typography>
          </Box>
        </Box>
        {singleSalonMode && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Услуги для выбранного салона
          </Typography>
        )}
      </Box>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Поиск услуг..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.8)
                    : alpha(theme.palette.background.paper, 0.9),
                }
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              sx={{
                borderRadius: 2,
                background: primaryGradient,
                '&:hover': {
                  background: primaryGradient,
                  filter: 'brightness(1.1)',
                }
              }}
            >
              Добавить услугу
            </Button>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => setCategoryManagerOpen(true)}
              sx={{
                borderRadius: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }
              }}
            >
              Управление категориями
            </Button>
            <Button
              variant={getActiveFiltersCount() > 0 ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
              onClick={handleOpenFiltersDrawer}
              sx={{
                borderRadius: 2,
                backgroundColor: getActiveFiltersCount() > 0
                  ? theme.palette.secondary.main 
                  : 'transparent',
                borderColor: getActiveFiltersCount() > 0
                  ? theme.palette.secondary.main
                  : theme.palette.divider,
                color: getActiveFiltersCount() > 0
                  ? theme.palette.secondary.contrastText
                  : theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: getActiveFiltersCount() > 0
                    ? theme.palette.secondary.dark
                    : alpha(theme.palette.secondary.main, 0.04),
                  borderColor: getActiveFiltersCount() > 0
                    ? theme.palette.secondary.dark
                    : theme.palette.secondary.main,
                }
              }}
              endIcon={
                getActiveFiltersCount() > 0 && (
                  <Chip 
                    size="small" 
                    label={getActiveFiltersCount()}
                    sx={{ 
                      bgcolor: 'white', 
                      color: theme.palette.secondary.main,
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.75rem',
                    }} 
                  />
                )
              }
            >
              Фильтры
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3, p: 2 }}>
        {paginatedServices.length > 0 ? (
          <>
            <Grid container spacing={isMobile ? 2 : 4}>
              {paginatedServices.map((service) => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
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
                        backgroundImage: service.active
                          ? 'linear-gradient(135deg, rgba(103, 58, 183, 0.15) 0%, rgba(156, 39, 176, 0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(158, 158, 158, 0.15) 0%, rgba(117, 117, 117, 0.15) 100%)',
                        borderBottom: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography 
                          variant="h6" 
                          component="h2"
                          sx={{ 
                            fontWeight: 600,
                            maxWidth: '80%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: theme.palette.mode === 'dark' ? '#e0e0e0' : 'rgba(0,0,0,0.87)',
                            textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                          }}
                        >
                          {service.name}
                        </Typography>
                        <Chip 
                          label={service.active ? "Активна" : "Неактивна"} 
                          color={service.active ? "success" : "error"}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                            '& .MuiChip-label': {
                              px: 1
                            }
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          label={service.category} 
                          size="small" 
                          sx={{ 
                            fontWeight: 500,
                            background: (() => {
                              // Find matching category to get its color
                              const matchingCategory = categories?.find(cat => cat.name === service.category);
                              if (matchingCategory?.color) {
                                return theme.palette.mode === 'dark' 
                                  ? `linear-gradient(135deg, ${matchingCategory.color}33 0%, ${matchingCategory.color}66 100%)`
                                  : `linear-gradient(135deg, ${matchingCategory.color}22 0%, ${matchingCategory.color}44 100%)`;
                              }
                              // Fallback gradient if no matching category
                              return theme.palette.mode === 'dark' 
                                ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(103, 58, 183, 0.2) 100%)' 
                                : 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(103, 58, 183, 0.1) 100%)';
                            })(),
                            color: (() => {
                              // Use category color as text color if available
                              const matchingCategory = categories?.find(cat => cat.name === service.category);
                              return matchingCategory?.color ? 
                                (theme.palette.mode === 'dark' ? matchingCategory.color : matchingCategory.color) :
                                (theme.palette.mode === 'dark' ? '#b39ddb' : '#673ab7');
                            })(),
                            border: '1px solid',
                            borderColor: (() => {
                              const matchingCategory = categories?.find(cat => cat.name === service.category);
                              return matchingCategory?.color ? 
                                (theme.palette.mode === 'dark' ? `${matchingCategory.color}44` : `${matchingCategory.color}33`) :
                                (theme.palette.mode === 'dark' ? 'rgba(179, 157, 219, 0.2)' : 'rgba(103, 58, 183, 0.2)');
                            })(),
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                          icon={<CategoryIcon style={{ fontSize: '0.8rem' }} />}
                        />
                        
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            ml: 'auto', 
                            fontWeight: 700,
                            color: theme.palette.mode === 'dark' ? '#81c784' : '#388e3c',
                            textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
                          }}
                        >
                          {Math.round(service.price)} ₽
                        </Typography>
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ p: 2, flexGrow: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          maxHeight: '3em',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.5
                        }}
                      >
                        {service.description || 'Нет описания'}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(0, 150, 136, 0.1)' 
                                : 'rgba(0, 150, 136, 0.05)',
                              height: '100%',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 150, 136, 0.15)' : 'rgba(0, 150, 136, 0.1)',
                            }}
                          >
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: '#009688' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {service.duration} мин
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 2,
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(63, 81, 181, 0.1)' 
                                : 'rgba(63, 81, 181, 0.05)',
                              height: '100%',
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                              border: '1px solid',
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(63, 81, 181, 0.15)' : 'rgba(63, 81, 181, 0.1)',
                            }}
                          >
                            <StoreIcon fontSize="small" sx={{ mr: 1, color: '#3f51b5' }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                              {service.salon_name || getSalonNameById(service.salon_id)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    
                    <CardActions sx={{ 
                      justifyContent: 'space-between', 
                      p: 2, 
                      pt: 0, 
                      gap: 1,
                      borderTop: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(40, 40, 45, 0.5)' 
                        : 'rgba(248, 248, 250, 0.5)',
                    }}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditService(service)}
                        sx={{
                          borderRadius: 2,
                          flex: 1,
                          py: 0.8,
                          border: '1px solid',
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.3)' : 'rgba(103, 58, 183, 0.2)',
                          color: theme.palette.mode === 'dark' ? '#9575cd' : '#673ab7',
                          background: theme.palette.mode === 'dark' 
                            ? 'rgba(103, 58, 183, 0.08)' 
                            : 'rgba(103, 58, 183, 0.04)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.5)' : 'rgba(103, 58, 183, 0.3)',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(103, 58, 183, 0.15)' 
                              : 'rgba(103, 58, 183, 0.08)',
                            boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Редактировать
                      </Button>
                      {!isMobile && (
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDeleteDialog(service.id)}
                          sx={{
                            borderRadius: 2,
                            py: 0.8,
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)',
                            color: theme.palette.mode === 'dark' ? '#ef9a9a' : '#f44336',
                            background: theme.palette.mode === 'dark' 
                              ? 'rgba(244, 67, 54, 0.08)' 
                              : 'rgba(244, 67, 54, 0.04)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            '&:hover': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.3)',
                              background: theme.palette.mode === 'dark' 
                                ? 'rgba(244, 67, 54, 0.15)' 
                                : 'rgba(244, 67, 54, 0.08)',
                              boxShadow: '0 3px 6px rgba(0,0,0,0.06)',
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Удалить
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {displayFilteredServices.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <TablePagination
                  rowsPerPageOptions={isMobile ? [5, 10] : [6, 12, 24]}
                  component="div"
                  count={displayFilteredServices.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={isMobile ? "На странице:" : "Строк на странице:"}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            {filters.searchQuery || Object.values(filters).some(value => value)
              ? "Услуги по вашему запросу не найдены. Попробуйте изменить параметры поиска или фильтры."
              : "Список услуг пуст. Нажмите 'Добавить услугу', чтобы создать новую услугу."
            }
          </Box>
        )}
      </Paper>

      <SwipeableDrawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={openFiltersDrawer}
        onClose={() => setOpenFiltersDrawer(false)}
        onOpen={() => setOpenFiltersDrawer(true)}
        disableSwipeToOpen={false}
        swipeAreaWidth={30}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            height: isMobile ? '80%' : '100%',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            p: 2,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.97)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
          }
        }}
        sx={{
          zIndex: theme.zIndex.drawer + 1
        }}
        ModalProps={{
          keepMounted: true // Улучшает производительность для часто используемых компонентов
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            pb: 2
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#9575cd' : '#673ab7',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FilterListIcon sx={{ mr: 1 }} />
              Фильтры
            </Typography>
            <IconButton 
              onClick={() => setOpenFiltersDrawer(false)}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                }
              }}
            >
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
                    onChange={(e) => handleFilterChange('salon_id', e.target.value)}
                    label="Салон"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">Все салоны</MenuItem>
                    {displaySalons.map((salon) => (
                      <MenuItem key={salon.id} value={String(salon.id)}>
                        {salon.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-filter-label">Категория</InputLabel>
                <Select
                  labelId="category-filter-label"
                  name="category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  label="Категория"
                  sx={{ borderRadius: 2 }}
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

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="employee-filter-label">Сотрудник</InputLabel>
                <Select
                  labelId="employee-filter-label"
                  name="employee_id"
                  value={filters.employee_id}
                  onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                  label="Сотрудник"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Все сотрудники</MenuItem>
                  {displayEmployees
                    .filter(emp => !filters.salon_id || emp.salon_id === Number(filters.salon_id))
                    .map((employee) => (
                      <MenuItem key={employee.id} value={String(employee.id)}>
                        {employee.first_name} {employee.last_name}
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
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                name="max_price"
                label="Макс. цена"
                type="number"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">₽</InputAdornment>,
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="active_only"
                    checked={filters.active_only}
                    onChange={(e) => handleFilterChange('active_only', e.target.checked)}
                    color="primary"
                  />
                }
                label="Только активные услуги"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}>
            <Button 
              onClick={handleResetFilters}
              sx={{
                borderRadius: 2,
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              }}
            >
              Сбросить
            </Button>
            <Button 
              variant="contained" 
              onClick={() => setOpenFiltersDrawer(false)}
              sx={{
                borderRadius: 2,
                px: 3,
                backgroundImage: primaryGradient,
                boxShadow: '0 3px 10px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  backgroundImage: primaryGradient,
                  boxShadow: '0 5px 14px rgba(156, 39, 176, 0.4)',
                }
              }}
            >
              Применить
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth={true}
        fullScreen={isMobile}
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100vh' : '90vh',
            m: isMobile ? 0 : 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              background: primaryGradient,
              color: 'white',
              py: isMobile ? 1.5 : 2,
              px: isMobile ? 2 : 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              fontSize: isMobile ? '1.1rem' : '1.25rem'
            }}>
              {dialogMode === 'add' ? 'Добавить новую услугу' : 'Редактировать услугу'}
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

          <DialogContent 
            sx={{ 
              p: isMobile ? 2 : 3, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              flex: 1,
              overflow: 'auto'
            }}
          >
            {(dialogMode === 'edit' && isLoadingServiceDetails) ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={isMobile ? 1.5 : 2}>
                <Grid item xs={12}>
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
                  />
                </Grid>

                <Grid item xs={12}>
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
                      onChange={handleSelectChange}
                      label="Категория"
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      }}
                    >
                      {categories && categories.length > 0 ? 
                        categories.map((category) => (
                          <MenuItem 
                            key={category.id} 
                            value={category.name}
                            onClick={() => {
                              setServiceData(prev => ({ 
                                ...prev, 
                                category: category.name,
                                category_id: category.id 
                              }));
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  borderRadius: '50%', 
                                  bgcolor: category.color || '#3f51b5',
                                  mr: 1
                                }} 
                              />
                              {category.name}
                            </Box>
                          </MenuItem>
                        ))
                        :
                        categoryOptions.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))
                      }
                    </Select>
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
                      inputProps: { 
                        min: 0,
                        step: 1,
                        pattern: "\\d*"
                      },
                      sx: { borderRadius: 2 }
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
                      inputProps: { min: 0 },
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                    Изображение услуги
                  </Typography>
                  <Box sx={{ 
                    mb: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {serviceData.image_url ? (
                      <Box sx={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
                        <Box
                          component="img"
                          src={serviceData.image_url}
                          alt={serviceData.name}
                          sx={{
                            width: isMobile ? '100%' : 120,
                            height: isMobile ? 200 : 120,
                            borderRadius: 2,
                            objectFit: 'cover',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setServiceData(prev => ({ ...prev, image_url: '' }))}
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
                      <Box sx={{ flex: 1, width: '100%' }}>
                        <input
                          type="file"
                          accept="image/*"
                          id="service-image-upload"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        <label htmlFor="service-image-upload">
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
                            width: '100%',
                            minHeight: isMobile ? 150 : 120,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.1)' : 'rgba(103, 58, 183, 0.05)'
                            }
                          }}>
                            <AddPhotoAlternateIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Загрузить фотографию
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center">
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

                <Grid item xs={12}>
                  <TextField
                    name="description"
                    label="Описание"
                    value={serviceData.description}
                    onChange={handleTextAreaChange}
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                    InputProps={{
                      sx: { borderRadius: 2 }
                    }}
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
          
          <Box sx={{ 
            px: 3, 
            py: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.9)' : 'rgba(249, 249, 250, 0.9)',
            borderTop: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          }}>
            {dialogMode === 'edit' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleOpenDeleteConfirm}
                startIcon={<DeleteIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.5)' : 'rgba(244, 67, 54, 0.3)',
                  color: '#f44336',
                  '&:hover': {
                    borderColor: '#f44336',
                    bgcolor: 'rgba(244, 67, 54, 0.08)'
                  }
                }}
              >
                Удалить
              </Button>
            )}
            <Button 
              variant="contained" 
              onClick={handleSaveService}
              disabled={
                isLoadingServiceDetails || 
                createServiceMutation.isLoading || 
                updateServiceMutation.isLoading
              }
              sx={{
                marginLeft: dialogMode === 'edit' ? 'auto' : 0,
                borderRadius: 2,
                px: 3,
                background: 'linear-gradient(135deg, #9c27b0 20%, #673ab7 90%)',
                boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
                  background: 'linear-gradient(135deg, #8e24aa 20%, #5e35b1 90%)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.26)',
                },
                transition: 'all 0.2s ease'
              }}
            >
              {dialogMode === 'add' ? 'Добавить' : 'Сохранить'}
              {(createServiceMutation.isLoading || updateServiceMutation.isLoading) && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            background: dangerGradient,
            color: '#fff',
            py: 2,
            px: 3
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            Подтверждение удаления
          </Typography>
        </Box>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography>
            Вы уверены, что хотите удалить эту услугу? Это действие невозможно отменить.
          </Typography>
        </DialogContent>
        <Box sx={{ 
          px: 3, 
          py: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
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
            onClick={handleDeleteService}
            disabled={deleteServiceMutation.isLoading}
            sx={{
              borderRadius: 2,
              px: 3,
              backgroundImage: dangerGradient,
              boxShadow: '0 3px 10px rgba(233, 30, 99, 0.3)',
              '&:hover': {
                backgroundImage: dangerGradient,
                boxShadow: '0 5px 14px rgba(233, 30, 99, 0.4)',
              }
            }}
          >
            Удалить
            {deleteServiceMutation.isLoading && (
              <CircularProgress size={20} color="inherit" />
            )}
          </Button>
        </Box>
      </Dialog>
      
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

      {/* Category Manager Dialog */}
      <Dialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: primaryGradient, 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3, 
          py: 2 
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon />
            <Typography variant="h6">Управление категориями услуг</Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={() => setCategoryManagerOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ServiceCategoryManager 
            salonId={Number(defaultSalonId)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            refetchCategories();
            setCategoryManagerOpen(false);
          }}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteConfirmDialog}
        onClose={handleCloseDeleteConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(42, 42, 50, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Подтверждение удаления
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography>
            Вы действительно хотите удалить эту услугу? Это действие нельзя будет отменить.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseDeleteConfirm}
            sx={{
              borderRadius: 2,
              px: 3,
              color: theme.palette.text.primary
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleDeleteService}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              bgcolor: 'error.main',
              '&:hover': {
                bgcolor: 'error.dark'
              }
            }}
            startIcon={deleteServiceMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            disabled={deleteServiceMutation.isLoading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceManagement; 