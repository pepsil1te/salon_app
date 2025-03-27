import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Grid,
  Rating,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { salonApi } from '../../api/salons';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';

const SalonList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalons, setFilteredSalons] = useState([]);

  // Загрузка списка салонов - настраиваем с фиксированным ключом и отключаем авто-рефетчинг
  const { data: salons, isLoading, error } = useQuery(
    'salons', // Фиксированный ключ без метки времени
    () => salonApi.getAll(),
    {
      staleTime: 300000, // 5 минут - данные свежие
      refetchOnMount: false, // Не обновлять при монтировании
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
      refetchInterval: false, // Отключаем автоматическое обновление
    }
  );

  // Обновление отфильтрованного списка при поиске или изменении данных
  useEffect(() => {
    if (salons) {
      const filtered = salons.filter(salon => 
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSalons(filtered);
    }
  }, [salons, searchQuery]);

  // Переход на страницу салона
  const handleViewSalon = (salonId) => {
    navigate(`/salon/${salonId}`);
  };

  // Получение дней работы в текстовом формате
  const getWorkingDaysText = (workingHours) => {
    if (!workingHours) return 'Нет данных';
    
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const workingDays = Object.keys(workingHours).map(day => parseInt(day));
    
    if (workingDays.length === 7) return 'Ежедневно';
    if (workingDays.length === 5 && !workingDays.includes(0) && !workingDays.includes(6)) {
      return 'Пн-Пт';
    }
    
    return workingDays.map(day => days[day]).join(', ');
  };

  // Получение часов работы в текстовом формате
  const getWorkingHoursText = (workingHours, dayOfWeek = new Date().getDay()) => {
    if (!workingHours || !workingHours[dayOfWeek]) return 'Закрыто сегодня';
    
    const hours = workingHours[dayOfWeek];
    return `${hours.start} - ${hours.end}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error" variant="h6" align="center">
          Ошибка при загрузке салонов: {error.message}
        </Typography>
      </Box>
    );
  }

  // Используем тестовые данные, если API не вернуло результаты
  const displaySalons = filteredSalons.length > 0 ? filteredSalons : (
    // Если API недоступно, показываем пустой массив вместо тестовых данных
    []
  );

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Поиск салонов по названию или адресу"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <SortIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {displaySalons.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Салоны не найдены
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {displaySalons.map((salon) => (
            <Grid item xs={12} key={salon.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {salon.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {salon.address}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {getWorkingDaysText(salon.working_hours)}, {getWorkingHoursText(salon.working_hours)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label="Популярный" 
                      size="small" 
                      color="primary" 
                      sx={{ mr: 1 }} 
                    />
                    <Rating value={4.5} precision={0.5} size="small" readOnly />
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleViewSalon(salon.id)}
                  >
                    Подробнее
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    color="primary" 
                    onClick={() => navigate(`/salon/${salon.id}/book`)}
                    sx={{ ml: 'auto' }}
                  >
                    Записаться
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SalonList; 