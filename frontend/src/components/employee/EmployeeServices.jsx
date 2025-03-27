import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemSecondaryAction,
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
  Divider,
  Paper
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { serviceApi } from '../../api/services';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import SpaIcon from '@mui/icons-material/Spa';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeServices = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeId, setEmployeeId] = useState(1); // TODO: Get from context or props
  const [serviceDetailsDialogOpen, setServiceDetailsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [confirmRemoveDialogOpen, setConfirmRemoveDialogOpen] = useState(false);

  // Get services for the employee
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
    refetch: refetchServices
  } = useQuery(
    ['employeeServices', employeeId],
    () => employeeApi.getServices(employeeId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!employeeId
    }
  );

  // Remove service mutation
  const removeServiceMutation = useMutation(
    () => employeeApi.removeService(employeeId, selectedService.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['employeeServices', employeeId]);
        setConfirmRemoveDialogOpen(false);
        setSelectedService(null);
      }
    }
  );

  // Filter services based on search query
  const filteredServices = services?.filter(service => 
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // View service details
  const handleViewServiceDetails = (service) => {
    setSelectedService(service);
    setServiceDetailsDialogOpen(true);
  };

  // Open remove service confirmation dialog
  const handleOpenRemoveDialog = (e, service) => {
    e.stopPropagation(); // Prevent the card click event from firing
    setSelectedService(service);
    setConfirmRemoveDialogOpen(true);
  };

  // Mock data for service list when API doesn't return anything
  const mockServices = [
    {
      id: 1,
      name: 'Женская стрижка',
      category: 'Волосы',
      price: 1500,
      duration: 60,
      description: 'Профессиональная женская стрижка с учетом типа волос и формы лица',
      active: true
    },
    {
      id: 2,
      name: 'Окрашивание волос',
      category: 'Волосы',
      price: 3000,
      duration: 120,
      description: 'Окрашивание волос профессиональными красителями',
      active: true
    },
    {
      id: 3,
      name: 'Мужская стрижка',
      category: 'Волосы',
      price: 1200,
      duration: 40,
      description: 'Классическая мужская стрижка',
      active: true
    }
  ];

  if (isLoadingServices) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
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

  const displayServices = services?.length > 0 ? services : mockServices;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Мои услуги
      </Typography>
      
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
      <Grid container spacing={2}>
        {(searchQuery ? filteredServices : displayServices).map((service) => (
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
        
        {(searchQuery ? filteredServices : displayServices).length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {searchQuery 
                  ? "Услуги по запросу не найдены" 
                  : "У вас пока нет услуг. Обратитесь к администратору для добавления услуг."}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      
      {/* Service details dialog */}
      <Dialog 
        open={serviceDetailsDialogOpen} 
        onClose={() => setServiceDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedService && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpaIcon sx={{ mr: 1 }} />
                {selectedService.name}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={selectedService.category} 
                  size="small" 
                  sx={{ mr: 1 }} 
                />
                {selectedService.active && (
                  <Chip 
                    label="Активна" 
                    color="success" 
                    size="small" 
                  />
                )}
              </Box>
              
              <Typography variant="body1" gutterBottom>
                {selectedService.description || 'Описание отсутствует'}
              </Typography>
              
              <List sx={{ bgcolor: 'background.paper', mt: 2 }}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Длительность" 
                    secondary={`${selectedService.duration} минут`} 
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <AttachMoneyIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Стоимость" 
                    secondary={`${selectedService.price} ₽`} 
                  />
                </ListItem>
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setServiceDetailsDialogOpen(false)}>
                Закрыть
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Confirm remove service dialog */}
      <Dialog 
        open={confirmRemoveDialogOpen} 
        onClose={() => setConfirmRemoveDialogOpen(false)}
      >
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите убрать услугу "{selectedService?.name}" из списка ваших услуг?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            color="error" 
            onClick={() => removeServiceMutation.mutate()}
            disabled={removeServiceMutation.isLoading}
          >
            {removeServiceMutation.isLoading ? 'Удаление...' : 'Убрать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeServices; 