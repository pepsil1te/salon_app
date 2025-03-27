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
  Switch,
  FormControlLabel,
  Avatar
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { salonApi } from '../../api/salons';
import { serviceApi } from '../../api/services';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SpaIcon from '@mui/icons-material/Spa';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router-dom';
import EmployeeSchedule from './EmployeeSchedule';

const EmployeeManagement = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [employeeData, setEmployeeData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    salon_id: '',
    is_active: true,
    services: [],
    working_hours: {},
    photo_url: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [openServicesDialog, setOpenServicesDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const navigate = useNavigate();

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
      onError: (err) => {
        setSnackbar({
          open: true,
          message: `Ошибка при загрузке сотрудников: ${err.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Загрузка списка салонов для формы
  const {
    data: salons,
    isLoading: isLoadingSalons
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
    isLoading: isLoadingServices
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
      onSuccess: () => {
        queryClient.invalidateQueries(['employees']);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Данные сотрудника успешно обновлены',
          severity: 'success'
        });
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
    setEmployeeData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      salon_id: '',
      is_active: true,
      services: [],
      working_hours: {},
      photo_url: ''
    });
    setValidationErrors({});
    setOpenDialog(true);
  };

  // Открытие диалога редактирования сотрудника
  const handleOpenEditDialog = (employee) => {
    setDialogMode('edit');
    setEmployeeData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      phone: employee.contact_info?.phone || '',
      position: employee.position || '',
      salon_id: employee.salon_id.toString(),
      is_active: employee.is_active !== false,
      services: employee.service_ids || [],
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

  // Открытие диалога услуг сотрудника
  const handleOpenServicesDialog = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setOpenServicesDialog(true);
  };

  // Закрытие диалога услуг
  const handleCloseServicesDialog = () => {
    setOpenServicesDialog(false);
    setSelectedEmployeeId(null);
  };

  // Функция для открытия диалога с расписанием сотрудника
  const handleOpenScheduleDialog = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setScheduleDialogOpen(true);
  };

  // Функция для закрытия диалога с расписанием сотрудника
  const handleCloseScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setSelectedEmployeeId(null);
  };

  // Открытие диалога удаления
  const handleOpenDeleteDialog = (employeeId) => {
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
    setEmployeeData(prev => ({ ...prev, services: value }));
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
  const handleSaveEmployee = () => {
    if (validateForm()) {
      const employeeDataToSave = {
        ...employeeData,
        salon_id: parseInt(employeeData.salon_id),
        contact_info: {
          phone: employeeData.phone,
          email: employeeData.email
        }
      };
      
      if (dialogMode === 'add') {
        createEmployeeMutation.mutate(employeeDataToSave);
      } else {
        updateEmployeeMutation.mutate({ 
          id: selectedEmployeeId, 
          data: employeeDataToSave 
        });
      }
    }
  };

  // Обработчик удаления сотрудника
  const handleDeleteEmployee = () => {
    if (selectedEmployeeId) {
      deleteEmployeeMutation.mutate(selectedEmployeeId);
    }
  };

  // Обработчик закрытия snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Фильтрация сотрудников по поисковому запросу
  const filteredEmployees = employees?.filter(employee => 
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.contact_info?.phone?.includes(searchQuery)
  ) || [];

  // Получение названия салона по ID
  const getSalonName = (salonId) => {
    const salon = salons?.find(s => s.id === salonId);
    return salon ? salon.name : 'Неизвестный салон';
  };

  // Тестовые данные для сотрудников, если API не вернуло результаты
  const mockEmployees = [
    {
      id: 1,
      first_name: 'Анна',
      last_name: 'Иванова',
      email: 'anna@example.com',
      phone: '+7 (999) 123-45-67',
      position: 'Старший парикмахер',
      salon_id: 1,
      is_active: true,
      service_ids: [1, 3],
      service_names: ['Женская стрижка', 'Окрашивание волос'],
      photo_url: 'https://i.pravatar.cc/150?img=1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    },
    {
      id: 2,
      first_name: 'Михаил',
      last_name: 'Петров',
      email: 'mikhail@example.com',
      phone: '+7 (999) 765-43-21',
      position: 'Барбер',
      salon_id: 2,
      is_active: true,
      service_ids: [4],
      service_names: ['Мужская стрижка'],
      photo_url: 'https://i.pravatar.cc/150?img=3',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    },
    {
      id: 3,
      first_name: 'Елена',
      last_name: 'Смирнова',
      email: 'elena@example.com',
      phone: '+7 (999) 111-22-33',
      position: 'Мастер маникюра',
      salon_id: 1,
      is_active: true,
      service_ids: [2],
      service_names: ['Маникюр'],
      photo_url: 'https://i.pravatar.cc/150?img=5',
      created_at: '2023-01-03T00:00:00Z',
      updated_at: '2023-01-03T00:00:00Z'
    }
  ];

  // Используем тестовые данные, если API не вернуло результаты
  const displayEmployees = filteredEmployees.length > 0 ? filteredEmployees : (employees || mockEmployees);
  const displayFilteredEmployees = searchQuery
    ? displayEmployees.filter(employee => 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.contact_info?.phone?.includes(searchQuery)
      )
    : displayEmployees;

  // Обработчик перехода к управлению услугами для конкретного сотрудника
  const handleNavigateToServiceManagement = (employeeId) => {
    // Закрываем текущий диалог
    handleCloseServicesDialog();
    
    // Установим выбранного сотрудника в глобальном состоянии, сохранив его в localStorage
    localStorage.setItem('selectedEmployeeIdForServices', employeeId);
    
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
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Управление сотрудниками
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Добавить сотрудника
        </Button>
      </Box>

      {/* Поиск сотрудников */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск по имени, должности, email или телефону..."
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

      {/* Список сотрудников */}
      {displayFilteredEmployees.length > 0 ? (
        <Grid container spacing={3}>
          {displayFilteredEmployees.map((employee) => (
            <Grid item xs={12} md={6} lg={4} key={employee.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={employee.photo_url} 
                      alt={`${employee.first_name} ${employee.last_name}`}
                      sx={{ width: 60, height: 60, mr: 2 }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="h6" component="h2">
                          {employee.first_name} {employee.last_name}
                        </Typography>
                        <Box sx={{ ml: 1 }}>
                          {employee.is_active ? (
                            <Chip size="small" color="success" label="Активен" />
                          ) : (
                            <Chip size="small" color="error" label="Неактивен" />
                          )}
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {employee.position}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <WorkIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {getSalonName(employee.salon_id)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <PhoneIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {employee.contact_info?.phone || 'Не указан'}
                    </Typography>
                  </Box>
                  
                  {employee.email && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <EmailIcon color="action" sx={{ mr: 1, fontSize: 18 }} />
                      <Typography variant="body2" color="text.secondary">
                        {employee.email}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Услуги:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {employee.service_names && employee.service_names.length > 0 ? (
                      employee.service_names.map((service, index) => (
                        <Chip 
                          key={index}
                          label={service}
                          size="small"
                          icon={<SpaIcon fontSize="small" />}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Нет назначенных услуг
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Button 
                      size="small" 
                      startIcon={<SpaIcon />}
                      onClick={() => handleOpenServicesDialog(employee.id)}
                      sx={{ mr: 1 }}
                    >
                      Услуги
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<CalendarMonthIcon />}
                      onClick={() => handleOpenScheduleDialog(employee.id)}
                    >
                      Расписание
                    </Button>
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenEditDialog(employee)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDeleteDialog(employee.id)}
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
            ? "Сотрудники по вашему запросу не найдены. Попробуйте изменить параметры поиска." 
            : "Список сотрудников пуст. Нажмите 'Добавить сотрудника', чтобы создать нового сотрудника."
          }
        </Alert>
      )}

      {/* Диалог добавления/редактирования сотрудника */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Добавить нового сотрудника' : 'Редактировать данные сотрудника'}
        </DialogTitle>
        <DialogContent>
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!validationErrors.salon_id}>
                <InputLabel id="salon-select-label">Салон</InputLabel>
                <Select
                  labelId="salon-select-label"
                  name="salon_id"
                  value={employeeData.salon_id}
                  label="Салон"
                  onChange={handleInputChange}
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
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="services-select-label">Услуги</InputLabel>
                <Select
                  labelId="services-select-label"
                  multiple
                  name="services"
                  value={employeeData.services}
                  label="Услуги"
                  onChange={handleServicesChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((serviceId) => {
                        const service = services?.find(s => s.id === serviceId);
                        return (
                          <Chip 
                            key={serviceId} 
                            label={service ? service.name : `Услуга ${serviceId}`} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {isLoadingServices ? (
                    <MenuItem disabled>Загрузка услуг...</MenuItem>
                  ) : (
                    (services || []).map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="photo_url"
                label="URL фотографии"
                value={employeeData.photo_url}
                onChange={handleInputChange}
                fullWidth
              />
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEmployee}
            disabled={createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading}
          >
            {dialogMode === 'add' ? 'Добавить' : 'Сохранить'}
            {(createEmployeeMutation.isLoading || updateEmployeeMutation.isLoading) && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог просмотра услуг сотрудника */}
      <Dialog open={openServicesDialog} onClose={handleCloseServicesDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Услуги сотрудника</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell align="right">Цена</TableCell>
                  <TableCell align="right">Длительность</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedEmployeeId && (
                  (displayEmployees.find(e => e.id === selectedEmployeeId)?.service_ids || []).map((serviceId) => {
                    const service = services?.find(s => s.id === serviceId);
                    return service ? (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell align="right">{service.price} ₽</TableCell>
                        <TableCell align="right">{service.duration} мин</TableCell>
                      </TableRow>
                    ) : null;
                  })
                )}
                {!selectedEmployeeId || 
                 (displayEmployees.find(e => e.id === selectedEmployeeId)?.service_ids || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Нет назначенных услуг
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseServicesDialog}>Закрыть</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Заменим эту логику на новую функцию
              handleNavigateToServiceManagement(selectedEmployeeId);
            }}
          >
            Редактировать услуги
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для расписания сотрудника */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={handleCloseScheduleDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ 
          sx: { 
            maxHeight: '95vh',
            maxWidth: { xs: '95%', sm: '90%', md: '85%' },
            margin: { xs: '10px', sm: '20px', md: 'auto' },
            borderRadius: { xs: 1, sm: 2 }
          } 
        }}
      >
        <DialogContent sx={{ p: 0, pb: 0 }}>
          <EmployeeSchedule 
            employeeId={selectedEmployeeId} 
            onClose={handleCloseScheduleDialog} 
          />
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этого сотрудника? Это действие невозможно отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button 
            color="error" 
            onClick={handleDeleteEmployee}
            disabled={deleteEmployeeMutation.isLoading}
          >
            Удалить
            {deleteEmployeeMutation.isLoading && (
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
        message={snackbar.severity !== 'success' && snackbar.message}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeManagement; 