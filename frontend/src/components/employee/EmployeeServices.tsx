import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Skeleton,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { serviceApi } from '../../api/services';
import { useAuthContext } from '../../contexts/AuthContext';
import { QUERY_KEYS, STALE_TIME } from '../../constants/employee';
import SearchIcon from '@mui/icons-material/Search';
import SpaIcon from '@mui/icons-material/Spa';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Service } from '../../types/employee';
import { AuthContextType } from '../../types/auth';

const EmployeeServices: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext() as AuthContextType;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [serviceDetailsDialogOpen, setServiceDetailsDialogOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [confirmRemoveDialogOpen, setConfirmRemoveDialogOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState<boolean>(false);
  const [availableServicesSearchQuery, setAvailableServicesSearchQuery] = useState<string>('');

  // Get services for the employee
  const { data: services, isLoading, error, refetch } = useQuery<Service[], Error>(
    [QUERY_KEYS.EMPLOYEE_SERVICES, user?.id],
    () => employeeApi.getServices(user?.id as number),
    {
      enabled: !!user?.id,
      staleTime: STALE_TIME,
      onError: (error) => {
        setNotification({
          open: true,
          message: `Ошибка при загрузке услуг: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Get all available services in the salon
  const { data: availableServices, isLoading: isLoadingAvailableServices } = useQuery<Service[], Error>(
    [QUERY_KEYS.ALL_SERVICES, user?.salon_id],
    () => serviceApi.getBySalon(user?.salon_id as number),
    {
      enabled: !!user?.salon_id,
      staleTime: STALE_TIME,
      onError: (error) => {
        setNotification({
          open: true,
          message: `Ошибка при загрузке доступных услуг: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Add service mutation
  const addServiceMutation = useMutation<void, Error, number>(
    (serviceId) => employeeApi.assignService(user?.id as number, serviceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.EMPLOYEE_SERVICES, user?.id]);
        setAddServiceDialogOpen(false);
        setNotification({
          open: true,
          message: 'Услуга успешно добавлена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setNotification({
          open: true,
          message: `Ошибка при добавлении услуги: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Remove service mutation
  const removeServiceMutation = useMutation<void, Error, number>(
    (serviceId) => employeeApi.removeService(user?.id as number, serviceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QUERY_KEYS.EMPLOYEE_SERVICES, user?.id]);
        setConfirmRemoveDialogOpen(false);
        setSelectedService(null);
        setNotification({
          open: true,
          message: 'Услуга успешно удалена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setNotification({
          open: true,
          message: `Ошибка при удалении услуги: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Filter services based on search query
  const filteredServices = services?.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter available services that are not already assigned to the employee
  const filteredAvailableServices = availableServices?.filter(service => {
    // Check if the service is already assigned to the employee
    const isAlreadyAssigned = services?.some(s => s.id === service.id) || false;
    
    // Check if the service matches the search query
    const matchesSearch = 
      service.name.toLowerCase().includes(availableServicesSearchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(availableServicesSearchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(availableServicesSearchQuery.toLowerCase()));
    
    // Only include services that are not already assigned and match the search
    return !isAlreadyAssigned && matchesSearch;
  }) || [];

  // View service details
  const handleViewServiceDetails = (service: Service) => {
    setSelectedService(service);
    setServiceDetailsDialogOpen(true);
  };

  // Open remove service confirmation dialog
  const handleOpenRemoveDialog = (e: React.MouseEvent, service: Service) => {
    e.stopPropagation(); // Prevent the card click event from firing
    setSelectedService(service);
    setConfirmRemoveDialogOpen(true);
  };

  // Handle remove service
  const handleRemoveService = () => {
    if (selectedService) {
      removeServiceMutation.mutate(selectedService.id);
    }
  };

  // Handle add service from available services
  const handleAddService = (serviceId: number) => {
    addServiceMutation.mutate(serviceId);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => refetch()}
          >
            Повторить
          </Button>
        }
      >
        Ошибка при загрузке услуг: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Мои услуги
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setAddServiceDialogOpen(true)}
        >
          Добавить услугу
        </Button>
      </Box>
      
      {/* Search bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск услуг..."
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
      
      {/* Service list */}
      <Grid container spacing={3}>
        {filteredServices.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Услуги не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery 
                  ? "По вашему запросу ничего не найдено" 
                  : "У вас пока нет услуг. Нажмите 'Добавить услугу', чтобы выбрать услуги из списка доступных."}
              </Typography>
            </Box>
          </Grid>
        )}
        
        {filteredServices.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6
                }
              }}
              onClick={() => handleViewServiceDetails(service)}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div" sx={{ mb: 1 }} noWrap>
                    {service.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={(e) => handleOpenRemoveDialog(e, service)}
                    title="Убрать из моих услуг"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    icon={<SpaIcon />} 
                    label={service.category} 
                    size="small" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  {service.active && (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Активна" 
                      color="success" 
                      size="small"
                      sx={{ mb: 1 }} 
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {service.duration} мин
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoneyIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {service.price} ₽
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Service Details Dialog */}
      <Dialog 
        open={serviceDetailsDialogOpen} 
        onClose={() => setServiceDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedService?.name}
        </DialogTitle>
        <DialogContent>
          {selectedService && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={<SpaIcon />} 
                  label={selectedService.category} 
                  sx={{ mr: 1 }} 
                />
                {selectedService.active && (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Активна" 
                    color="success" 
                  />
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {selectedService.description}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Длительность: {selectedService.duration} мин
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Стоимость: {selectedService.price} ₽
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setServiceDetailsDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Service Confirmation Dialog */}
      <Dialog
        open={confirmRemoveDialogOpen}
        onClose={() => setConfirmRemoveDialogOpen(false)}
      >
        <DialogTitle>
          Удалить услугу?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить услугу "{selectedService?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleRemoveService}
            color="error"
            disabled={removeServiceMutation.isLoading}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog
        open={addServiceDialogOpen}
        onClose={() => setAddServiceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Добавить услуги
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              placeholder="Поиск доступных услуг..."
              value={availableServicesSearchQuery}
              onChange={(e) => setAvailableServicesSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {isLoadingAvailableServices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredAvailableServices.length === 0 ? (
            <Alert severity="info">
              {availableServicesSearchQuery 
                ? "По вашему запросу ничего не найдено" 
                : "Все доступные услуги уже добавлены к вашему профилю"}
            </Alert>
          ) : (
            <List sx={{ width: '100%' }}>
              {filteredAvailableServices.map((service) => (
                <React.Fragment key={service.id}>
                  <ListItem 
                    secondaryAction={
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddService(service.id)}
                        disabled={addServiceMutation.isLoading}
                      >
                        Добавить
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{service.name}</Typography>
                          <Chip 
                            icon={<SpaIcon />} 
                            label={service.category} 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                          {service.active && (
                            <Chip 
                              icon={<CheckCircleIcon />} 
                              label="Активна" 
                              color="success" 
                              size="small"
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {service.duration} мин
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {service.price} ₽
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddServiceDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeServices; 