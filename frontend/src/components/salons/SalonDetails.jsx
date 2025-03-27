import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia,
  Grid,
  Rating,
  Chip,
  Divider,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { salonApi } from '../../api/salons';
import { serviceApi } from '../../api/services';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const SalonDetails = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();

  // Запрос данных о салоне
  const { 
    data: salon, 
    isLoading: isLoadingSalon, 
    error: salonError 
  } = useQuery(['salon', salonId], () => salonApi.getById(salonId));

  // Запрос данных об услугах салона
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError
  } = useQuery(['salonServices', salonId], () => serviceApi.getBySalon(salonId));

  // Обработчик для кнопки записи на услугу
  const handleBookService = (serviceId) => {
    navigate(`/salon/${salonId}/service/${serviceId}/book`);
  };

  // Форматирование данных о рабочих часах
  const getWorkingHoursFormatted = (workingHours) => {
    if (!workingHours) return [];
    
    const days = [
      'Воскресенье', 'Понедельник', 'Вторник', 
      'Среда', 'Четверг', 'Пятница', 'Суббота'
    ];
    
    return Object.entries(workingHours).map(([day, hours]) => ({
      day: days[day],
      hours: hours.start + ' - ' + hours.end
    }));
  };

  if (isLoadingSalon) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (salonError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" variant="h6" align="center">
          Ошибка при загрузке информации о салоне: {salonError.message}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/salons')}>
            Вернуться к списку салонов
          </Button>
        </Box>
      </Box>
    );
  }

  // Используем тестовые данные, если API не вернуло результаты
  const salonData = salon || {
    id: salonId,
    name: 'Салон красоты "Элегант"',
    address: 'ул. Пушкина, д. 10',
    contact_info: { 
      phone: '+7 (999) 123-45-67', 
      email: 'elegant@example.com',
      website: 'www.elegant-salon.com',
      instagram: '@elegant_salon'
    },
    working_hours: {
      1: { start: '09:00', end: '20:00' },
      2: { start: '09:00', end: '20:00' },
      3: { start: '09:00', end: '20:00' },
      4: { start: '09:00', end: '20:00' },
      5: { start: '09:00', end: '20:00' },
      6: { start: '10:00', end: '18:00' }
    },
    description: 'Салон красоты "Элегант" предлагает широкий спектр услуг по уходу за волосами, лицом и телом. Наши мастера имеют многолетний опыт работы и используют только качественные материалы и косметику. Мы стремимся создать комфортную атмосферу для каждого клиента и помочь ему выглядеть и чувствовать себя лучше.'
  };

  // Используем тестовые данные для услуг, если API не вернуло результаты
  const serviceList = services || [
    {
      id: 1,
      name: 'Женская стрижка',
      duration: 60,
      price: 1500,
      category: 'Волосы',
      description: 'Женская стрижка любой сложности',
      employee_names: ['Анна Иванова', 'Елена Петрова']
    },
    {
      id: 2,
      name: 'Мужская стрижка',
      duration: 45,
      price: 1000,
      category: 'Волосы',
      description: 'Мужская стрижка + мытье головы',
      employee_names: ['Сергей Смирнов']
    },
    {
      id: 3,
      name: 'Маникюр классический',
      duration: 60,
      price: 1200,
      category: 'Ногти',
      description: 'Классический маникюр с покрытием',
      employee_names: ['Мария Сидорова']
    },
    {
      id: 4,
      name: 'Окрашивание волос',
      duration: 120,
      price: 3500,
      category: 'Волосы',
      description: 'Окрашивание волос любой сложности',
      employee_names: ['Анна Иванова', 'Елена Петрова']
    }
  ];

  // Группировка услуг по категориям
  const groupedServices = serviceList.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  const workingHours = getWorkingHoursFormatted(salonData.working_hours);

  return (
    <Box sx={{ mb: 4 }}>
      <Button 
        startIcon={<Box sx={{ mr: -0.5, transform: 'rotate(180deg)' }}>→</Box>} 
        onClick={() => navigate('/salons')}
        sx={{ mb: 2 }}
      >
        Назад к списку салонов
      </Button>
      
      <Card sx={{ mb: 3 }}>
        <CardMedia
          component="img"
          height="200"
          image={`https://source.unsplash.com/random/800x200/?salon,beauty,spa&sig=${salonId}`}
          alt={salonData.name}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" component="div" gutterBottom>
                {salonData.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Rating value={4.7} precision={0.1} size="small" readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  4.7 (124 отзыва)
                </Typography>
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {salonData.description}
              </Typography>
            </Box>
            
            <Chip 
              label="Популярный" 
              color="primary" 
            />
          </Box>
        </CardContent>
      </Card>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Контактная информация
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <LocationOnIcon />
                </ListItemIcon>
                <ListItemText primary={salonData.address} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={salonData.contact_info.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={salonData.contact_info.email} />
              </ListItem>
            </List>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Часы работы
            </Typography>
            <List dense>
              {workingHours.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <AccessTimeIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.day} 
                    secondary={item.hours} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Услуги
            </Typography>
            
            {isLoadingServices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            ) : servicesError ? (
              <Typography color="error">
                Ошибка при загрузке услуг: {servicesError.message}
              </Typography>
            ) : (
              Object.entries(groupedServices).map(([category, services]) => (
                <Box key={category} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {category}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {services.map((service) => (
                    <Card key={service.id} sx={{ mb: 2 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="h6">
                              {service.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Длительность: {service.duration} мин.
                            </Typography>
                            {service.description && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {service.description}
                              </Typography>
                            )}
                            
                            {service.employee_names && service.employee_names.length > 0 && (
                              <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                  Мастера:
                                </Typography>
                                {service.employee_names.map((name, idx) => (
                                  <Chip
                                    key={idx}
                                    avatar={<Avatar>{name[0]}</Avatar>}
                                    label={name}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="h6" color="primary">
                              {service.price} ₽
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              startIcon={<EventAvailableIcon />}
                              sx={{ mt: 1 }}
                              onClick={() => handleBookService(service.id)}
                            >
                              Записаться
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalonDetails; 