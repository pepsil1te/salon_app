import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import { useQuery } from 'react-query';
import { employeeApi } from '../../api/employees';
import { useAuthContext } from '../../contexts/AuthContext';
import { format, addDays, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// Компонент для отображения статистики в виде карточки
const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          bgcolor: `${color}.light`, 
          p: 1, 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EmployeePerformance = () => {
  const { user } = useAuthContext();
  
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(() => endOfMonth(new Date()));
  const [customStartDate, setCustomStartDate] = useState(subDays(new Date(), 30));
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // Функция для обновления дат в зависимости от выбранного периода
  const updateDatesByPeriod = (newPeriod) => {
    const today = new Date();
    
    switch (newPeriod) {
      case 'week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case '3months':
        setStartDate(startOfMonth(subMonths(today, 2)));
        setEndDate(endOfMonth(today));
        break;
      case 'custom':
        setStartDate(customStartDate);
        setEndDate(customEndDate);
        break;
      default:
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
    }
  };

  // Обработчик изменения периода
  const handlePeriodChange = (event) => {
    const newPeriod = event.target.value;
    setPeriod(newPeriod);
    updateDatesByPeriod(newPeriod);
  };

  // Обработчик изменения пользовательской даты начала
  const handleCustomStartDateChange = (date) => {
    setCustomStartDate(date);
    if (period === 'custom') {
      setStartDate(date);
    }
  };

  // Обработчик изменения пользовательской даты окончания
  const handleCustomEndDateChange = (date) => {
    setCustomEndDate(date);
    if (period === 'custom') {
      setEndDate(date);
    }
  };

  // Обработчик применения пользовательского периода
  const handleApplyCustomDates = () => {
    setStartDate(customStartDate);
    setEndDate(customEndDate);
  };

  // Get performance data
  const { data: performanceData, isLoading, error, refetch } = useQuery(
    ['employeePerformance', user?.id, { start: startDate, end: endDate }],
    () => {
      if (!user?.id) {
        throw new Error('ID сотрудника не найден');
      }
      return employeeApi.getPerformance(
        user.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
    },
    {
      enabled: !!user?.id,
      onError: (error) => {
        console.error('Ошибка при загрузке статистики:', error);
      }
    }
  );

  // Заменяем моковые данные на пустые объекты/значения
  const defaultEmptyPerformance = {
    total_appointments: 0,
    completed_appointments: 0,
    cancelled_appointments: 0,
    revenue: 0,
    average_rating: 0,
    services_performed: 0,
    appointments_by_day: {},
    revenue_by_day: {},
    most_popular_services: []
  };

  // Используем только данные из API
  const displayPerformance = performanceData || defaultEmptyPerformance;

  // Расчет процента выполненных записей
  const completionRate = displayPerformance?.total_appointments > 0
    ? Math.round((displayPerformance?.completed_appointments / displayPerformance?.total_appointments) * 100)
    : 0;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ошибка при загрузке данных о производительности: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Моя производительность
      </Typography>

      {/* Фильтры периода */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="period-select-label">Период</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                value={period}
                label="Период"
                onChange={handlePeriodChange}
              >
                <MenuItem value="week">Текущая неделя</MenuItem>
                <MenuItem value="month">Текущий месяц</MenuItem>
                <MenuItem value="3months">Последние 3 месяца</MenuItem>
                <MenuItem value="custom">Произвольный период</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {period === 'custom' && (
            <>
              <Grid item xs={12} md={3}>
                <LocalizationProvider 
                  dateAdapter={AdapterDateFns}
                  adapterLocale={ruLocale}
                >
                  <DatePicker 
                    label="Начало периода"
                    value={customStartDate}
                    onChange={handleCustomStartDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider 
                  dateAdapter={AdapterDateFns}
                  adapterLocale={ruLocale}
                >
                  <DatePicker 
                    label="Конец периода"
                    value={customEndDate}
                    onChange={handleCustomEndDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  variant="contained" 
                  onClick={handleApplyCustomDates}
                  fullWidth
                >
                  Применить
                </Button>
              </Grid>
            </>
          )}
          
          {period !== 'custom' && (
            <Grid item xs={12} md={9}>
              <Typography variant="body2" color="text.secondary">
                Период: с {format(startDate, 'dd.MM.yyyy')} по {format(endDate, 'dd.MM.yyyy')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Общая статистика */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Общая статистика
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Всего записей"
            value={displayPerformance?.total_appointments || 0}
            icon={<EqualizerIcon sx={{ color: 'primary.main' }} />}
            color="primary"
            subtitle={`Выполнено: ${completionRate}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Выручка"
            value={`${(displayPerformance?.revenue || 0).toLocaleString()} ₽`}
            icon={<AttachMoneyIcon sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Клиентов"
            value={displayPerformance?.services_performed || 0}
            icon={<PeopleIcon sx={{ color: 'info.main' }} />}
            color="info"
            subtitle={`Услуг: ${displayPerformance?.services_performed || 0}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Средний рейтинг"
            value={(displayPerformance?.average_rating || 0).toFixed(1)}
            icon={<StarIcon sx={{ color: 'warning.main' }} />}
            color="warning"
            subtitle={`На основе ${(displayPerformance?.ratings || []).reduce((acc, curr) => acc + (curr?.count || 0), 0)} отзывов`}
          />
        </Grid>
      </Grid>

      {/* Детальная статистика */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Топ услуг
              </Typography>
              <List>
                {(displayPerformance?.most_popular_services || []).map((service, index) => (
                  <ListItem key={index} divider={index < (displayPerformance?.most_popular_services?.length || 0) - 1}>
                    <ListItemIcon>
                      <ThumbUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={service?.name || 'Неизвестная услуга'} 
                      secondary={`${service?.count || 0} записей • ${(service?.revenue || 0).toLocaleString()} ₽`} 
                    />
                    <Chip 
                      label={`${Math.round(((service?.count || 0) / (displayPerformance?.total_appointments || 1)) * 100)}%`} 
                      color="primary" 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Услуги по категориям
              </Typography>
              <List>
                {(displayPerformance?.services_by_category || []).map((category, index) => (
                  <ListItem key={index} divider={index < (displayPerformance?.services_by_category?.length || 0) - 1}>
                    <ListItemText 
                      primary={category?.category || 'Неизвестная категория'} 
                      secondary={`${category?.count || 0} записей • ${(category?.revenue || 0).toLocaleString()} ₽`} 
                    />
                    <Chip 
                      label={`${Math.round(((category?.count || 0) / (displayPerformance?.total_appointments || 1)) * 100)}%`} 
                      color="primary" 
                      size="small" 
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Рабочее время
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">
                      {displayPerformance?.working_hours?.scheduled || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Запланировано часов
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">
                      {displayPerformance?.working_hours?.actual || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Отработано часов
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Коэффициент загрузки: {Math.round((displayPerformance?.working_hours?.utilization_rate || 0) * 100)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статус записей
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h5">
                        {displayPerformance?.completed_appointments || 0}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Выполнено
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CancelIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="h5">
                        {displayPerformance?.cancelled_appointments || 0}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Отменено
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Коэффициент завершения
                </Typography>
                <Typography variant="h5" color="success.main">
                  {completionRate}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeePerformance; 