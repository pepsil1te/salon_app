import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Box, Button, Paper, Avatar, Snackbar, Alert, Grid,
  Card, CardContent, CardHeader, CardActions, CardMedia, IconButton, Divider, 
  Tabs, Tab, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, 
  Badge, Chip, useMediaQuery, SwipeableDrawer, BottomNavigation, BottomNavigationAction, 
  CircularProgress, TextField, Stack, Menu, MenuItem, Skeleton, LinearProgress,
  ListItemIcon, AppBar, Toolbar, Tooltip, Backdrop, Fade, Modal, styled, useTheme, Rating,
  FormGroup, FormControlLabel, Switch, FormControl, FormLabel, FormHelperText,
  AlertTitle, ListItemButton
} from '@mui/material';
import { useAuthContext } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, parseISO, isAfter, isSameDay, addDays } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { ru } from 'date-fns/locale';
import { blueGrey } from '@mui/material/colors';

// Иконки
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CelebrationIcon from '@mui/icons-material/Celebration';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReplayIcon from '@mui/icons-material/Replay';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NoteIcon from '@mui/icons-material/Note';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { appointmentApi } from '../api/appointments';
import { userApi } from '../api/users';
import { salonApi } from '../api/salons';
import { favoritesApi } from '../api/favorites';
import { statisticsApi } from '../api/statistics';

// Стилизованные компоненты
const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 48,
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.9rem',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

// Компонент Dashboard - главная страница кабинета
const Dashboard = ({ 
  user, 
  upcomingAppointments, 
  clientStats,
  isLoadingUpcoming, 
  isLoadingStats,
  handleCancelAppointment, 
  handleOpenActionsMenu,
  navigate,
  isMobile,
  upcomingError,
  statsError,
  refetchUpcoming // Добавляем функцию обновления
}) => {
  return (
    <Grid container spacing={3}>
      {/* Приветствие и общая статистика */}
      <Grid item xs={12}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: 2,
            backgroundImage: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
            color: 'white'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom fontWeight={600}>
                Добро пожаловать, {user?.name?.split(' ')[0] || 'Гость'}!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                В личном кабинете вы можете управлять своими записями, просматривать историю посещений и многое другое.
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                onClick={() => navigate('/')}
                sx={{ 
                  borderRadius: 8,
                  px: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.85)',
                  color: '#2565e6',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                  }
                }}
              >
                Записаться на услугу
              </Button>
            </Grid>
            <Grid 
              item 
              xs={12} 
              md={5} 
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                justifyContent: 'center'
              }}
            >
              <Box 
                component="img"
                src="https://i.imgur.com/PLEyDj4.png"
                alt="Beauty salon illustration"
                sx={{ 
                  maxWidth: '90%',
                  maxHeight: 180,
                  objectFit: 'contain'
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Блок статистики */}
      <Grid item xs={12} md={4}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            height: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                Ваша статистика
              </Box>
              {statsError && (
                <Tooltip title="Невозможно загрузить статистику: сервис временно недоступен">
                  <IconButton size="small" color="warning">
                    <ReplayIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Всего визитов
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width="100%" height={40} />
                ) : (
                  <Typography variant="h4" fontWeight={600} color="primary">
                    {clientStats?.totalVisits || 0}
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Бонусов
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width="100%" height={40} />
                ) : (
                  <Typography variant="h4" fontWeight={600} color="primary">
                    {clientStats?.bonusPoints || 0}
                    <Typography component="span" variant="body2" color="text.secondary"> ₽</Typography>
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Любимый салон
                </Typography>
                {isLoadingStats ? (
                  <Skeleton variant="text" width="100%" height={24} />
                ) : (
                  <Typography variant="body1" fontWeight={500}>
                    {clientStats?.favoriteSalon?.name || 'Нет данных'}
                  </Typography>
                )}
                {!isLoadingStats && clientStats?.favoriteSalon && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => navigate(`/salon/${clientStats.favoriteSalon.id}`)}
                    sx={{ mt: 1, borderRadius: 4 }}
                  >
                    Посетить
                  </Button>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Ближайшая запись */}
      <Grid item xs={12} md={8}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 },
            height: '100%',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                Ближайшая запись
              </Box>
              {upcomingError && (
                <Tooltip title="Невозможно загрузить записи: сервис временно недоступен">
                  <IconButton size="small" color="warning" onClick={() => refetchUpcoming()}>
                    <ReplayIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Typography>
          
          {isLoadingUpcoming ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (upcomingError && !upcomingAppointments) ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexGrow: 1,
                p: 3
              }}
            >
              <Box 
                component="img"
                src="https://i.imgur.com/Mkpd2u5.png"
                alt="No appointments"
                sx={{ 
                  width: 120,
                  height: 120,
                  mb: 2,
                  opacity: 0.7
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Не удалось загрузить записи
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                Сервис записей временно недоступен. Пожалуйста, попробуйте позже.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => refetchUpcoming()}
                startIcon={<ReplayIcon />}
              >
                Попробовать снова
              </Button>
            </Box>
          ) : (!upcomingAppointments || upcomingAppointments.length === 0) ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexGrow: 1,
                p: 3
              }}
            >
              <Box 
                component="img"
                src="https://i.imgur.com/Mkpd2u5.png"
                alt="No appointments"
                sx={{ 
                  width: 120,
                  height: 120,
                  mb: 2,
                  opacity: 0.7
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                У вас пока нет записей
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/')}
                sx={{ mt: 2 }}
              >
                Записаться сейчас
              </Button>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {upcomingAppointments && upcomingAppointments.length > 0 && (
                <Card 
                  elevation={0}
                  sx={{ 
                    mt: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexGrow: 1
                  }}
                >
                  <CardMedia 
                    component="div"
                    sx={{
                      width: { xs: '100%', sm: 200 },
                      height: { xs: 140, sm: '100%' },
                      bgcolor: 'primary.light',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      p: 2
                    }}
                  >
                    <Typography variant="h4" fontWeight={600}>
                      {upcomingAppointments[0].date_time && format(new Date(upcomingAppointments[0].date_time), 'dd')}
                    </Typography>
                    <Typography variant="subtitle1">
                      {upcomingAppointments[0].date_time && format(new Date(upcomingAppointments[0].date_time), 'MMMM', { locale: ru })}
                    </Typography>
                    <Divider sx={{ width: '60%', my: 1, bgcolor: 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="h5">
                      {upcomingAppointments[0].date_time && format(new Date(upcomingAppointments[0].date_time), 'HH:mm')}
                    </Typography>
                  </CardMedia>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {upcomingAppointments[0].service_name}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PeopleAltIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Мастер: <b>{upcomingAppointments[0].employee_name}</b>
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Длительность: <b>{upcomingAppointments[0].duration} мин.</b>
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap>
                              {upcomingAppointments[0].salon_name}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Стоимость: <b>{upcomingAppointments[0].price} ₽</b>
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {upcomingAppointments[0].notes && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Заметка: {upcomingAppointments[0].notes}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleCancelAppointment(upcomingAppointments[0].id)}
                        size="small"
                      >
                        Отменить
                      </Button>
                      <Button 
                        variant="outlined"
                        onClick={() => {/* действие для изменения записи */}}
                        size="small"
                      >
                        Изменить
                      </Button>
                      <Button 
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/salon/${upcomingAppointments[0].salon_id}`)}
                      >
                        Салон
                      </Button>
                    </CardActions>
                  </Box>
                </Card>
              )}
              
              {upcomingAppointments && upcomingAppointments.length > 1 && (
                <Box sx={{ mt: 'auto', textAlign: 'center', py: 2 }}>
                  <Button 
                    variant="text" 
                    onClick={() => setCurrentTab(1)}
                    endIcon={<EventIcon />}
                  >
                    Посмотреть все записи ({upcomingAppointments.length})
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Акции и предложения */}
      <Grid item xs={12}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" gutterBottom>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalActivityIcon sx={{ mr: 1, color: 'primary.main' }} />
              Акции и специальные предложения
            </Box>
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={2}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height={140}
                  image="https://source.unsplash.com/random/600x300/?spa,beauty,1"
                  alt="Акция"
                />
                <CardContent>
                  <Chip label="До 31 мая" size="small" color="primary" sx={{ mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Скидка 20% на окрашивание
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Специальное предложение на все виды окрашивания волос в наших салонах.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Подробнее</Button>
                </CardActions>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Paper 
                elevation={2}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height={140}
                  image="https://source.unsplash.com/random/600x300/?spa,beauty,2"
                  alt="Акция"
                />
                <CardContent>
                  <Chip label="Новинка" size="small" color="secondary" sx={{ mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Комплекс "Весеннее обновление"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Полный комплекс ухода за лицом и телом по специальной цене.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Подробнее</Button>
                </CardActions>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper 
                elevation={2}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height={140}
                  image="https://source.unsplash.com/random/600x300/?spa,beauty,3"
                  alt="Акция"
                />
                <CardContent>
                  <Chip label="Для постоянных клиентов" size="small" color="warning" sx={{ mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Бонусы за рекомендации
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Приведите друга и получите 500 бонусных баллов на ваш счет.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Подробнее</Button>
                </CardActions>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Компонент Appointments - список предстоящих записей
const Appointments = ({ 
  appointments, 
  isLoading, 
  error, 
  refetch, 
  handleCancelAppointment, 
  handleOpenActionsMenu, 
  navigate,
  isMobile 
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Мои записи
        </Typography>
        <Button 
          startIcon={<ReplayIcon />} 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Обновить
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !appointments ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Сервис записей временно недоступен</AlertTitle>
          <Typography variant="body2" paragraph>
            Не удалось загрузить список ваших записей. Наши специалисты уже работают над решением проблемы.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ReplayIcon />}
            onClick={() => refetch()}
          >
            Попробовать снова
          </Button>
        </Alert>
      ) : (!appointments || appointments.length === 0) ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box 
            component="img"
            src="https://i.imgur.com/Mkpd2u5.png"
            alt="No appointments"
            sx={{ 
              width: 120,
              height: 120,
              mb: 2,
              opacity: 0.7
            }}
          />
          <Typography variant="h6" gutterBottom>
            У вас нет предстоящих записей
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Запишитесь на услугу, чтобы увидеть свои предстоящие записи здесь.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 1 }}
          >
            Записаться на услугу
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {appointments.map((appointment) => (
            <Grid item xs={12} md={6} key={appointment.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardHeader
                  title={
                    <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                      {appointment.service_name}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body2">
                        {format(new Date(appointment.date_time), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </Typography>
                    </Box>
                  }
                  action={
                    <IconButton
                      aria-label="actions"
                      onClick={(e) => handleOpenActionsMenu(e, appointment.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                
                <Divider />
                
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <PeopleAltIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {appointment.employee_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {appointment.duration} мин.
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap>
                          {appointment.salon_name}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <b>{appointment.price} ₽</b>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {appointment.notes && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <NoteIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'text-bottom' }} />
                        Заметка: {appointment.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ px: 2, py: 1.5 }}>
                  <Button 
                    size="small"
                    startIcon={<LocationOnIcon />}
                    onClick={() => navigate(`/salon/${appointment.salon_id}`)}
                  >
                    Салон
                  </Button>
                  <Button 
                    size="small"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleCancelAppointment(appointment.id)}
                    sx={{ ml: 'auto' }}
                  >
                    Отменить
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

// Компонент History - история посещений
const History = ({ 
  appointments, 
  isLoading, 
  error, 
  refetch, 
  navigate,
  isMobile 
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          История посещений
        </Typography>
        <Button 
          startIcon={<ReplayIcon />} 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Обновить
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !appointments ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Сервис истории временно недоступен</AlertTitle>
          <Typography variant="body2" paragraph>
            Не удалось загрузить историю ваших посещений. Наши специалисты уже работают над решением проблемы.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ReplayIcon />}
            onClick={() => refetch()}
          >
            Попробовать снова
          </Button>
        </Alert>
      ) : (!appointments || appointments.length === 0) ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box 
            component="img"
            src="https://i.imgur.com/WwXfNfE.png"
            alt="No history"
            sx={{ 
              width: 120,
              height: 120,
              mb: 2,
              opacity: 0.7
            }}
          />
          <Typography variant="h6" gutterBottom>
            У вас нет истории посещений
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            После посещения салона, ваши визиты будут отображаться здесь.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 1 }}
          >
            Записаться на услугу
          </Button>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <List disablePadding>
            {appointments.map((appointment, index) => (
              <React.Fragment key={appointment.id}>
                <ListItem 
                  sx={{ 
                    px: { xs: 2, sm: 3 }, 
                    py: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: { xs: 0, sm: 56 }, mb: { xs: 1, sm: 0 } }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Typography variant="subtitle1" component="span" fontWeight={500}>
                          {appointment.service_name}
                        </Typography>
                        <Chip 
                          label={appointment.status === 'completed' ? 'Завершена' : 'Отменена'} 
                          size="small" 
                          color={appointment.status === 'completed' ? 'success' : 'error'}
                          sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 0.5, sm: 0 }, mb: { xs: 0.5, sm: 0 } }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {format(new Date(appointment.date_time), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5, gap: { xs: 1, sm: 2 } }}>
                          <Typography variant="body2" color="text.secondary">
                            <PeopleAltIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'text-bottom' }} />
                            {appointment.employee_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <LocationOnIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'text-bottom' }} />
                            {appointment.salon_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: 'text-bottom' }} />
                            {appointment.price} ₽
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <Box sx={{ mt: { xs: 1, sm: 0 }, ml: { xs: 0, sm: 2 } }}>
                    {appointment.status === 'completed' && !appointment.review ? (
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<StarIcon />}
                      >
                        Оставить отзыв
                      </Button>
                    ) : appointment.review ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          Ваша оценка:
                        </Typography>
                        <Rating 
                          value={appointment.review.rating} 
                          size="small" 
                          readOnly 
                        />
                      </Box>
                    ) : null}
                  </Box>
                </ListItem>
                {index < appointments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

// Компонент Favorites - избранные салоны и мастера
const Favorites = ({ 
  favorites, 
  isLoading, 
  error, 
  refetch, 
  toggleFavorite,
  navigate,
  isMobile 
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Избранное
        </Typography>
        <Button 
          startIcon={<ReplayIcon />} 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Обновить
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !favorites ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Сервис избранного временно недоступен</AlertTitle>
          <Typography variant="body2" paragraph>
            Не удалось загрузить список избранных салонов. Наши специалисты уже работают над решением проблемы.
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<ReplayIcon />}
            onClick={() => refetch()}
          >
            Попробовать снова
          </Button>
        </Alert>
      ) : (!favorites || favorites.length === 0) ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box 
            component="img"
            src="https://i.imgur.com/1Nc3tFB.png"
            alt="No favorites"
            sx={{ 
              width: 120,
              height: 120,
              mb: 2,
              opacity: 0.7
            }}
          />
          <Typography variant="h6" gutterBottom>
            У вас нет избранных салонов
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Добавляйте салоны в избранное, чтобы быстро находить их позже.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 1 }}
          >
            Найти салоны
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((salon) => (
            <Grid item xs={12} sm={6} md={4} key={salon.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: '0.3s',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height={140}
                  image={salon.image_url || `https://source.unsplash.com/random/600x300/?salon,${salon.id}`}
                  alt={salon.name}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {salon.name}
                    </Typography>
                    <IconButton 
                      color="primary"
                      onClick={() => toggleFavorite(salon.id)}
                      size="small"
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating 
                      value={salon.rating || 0} 
                      precision={0.5} 
                      readOnly 
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({salon.reviews_count || 0})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {salon.address}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {salon.working_hours || 'Нет данных о часах работы'}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small"
                    onClick={() => navigate(`/salon/${salon.id}`)}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 4, mr: 1 }}
                  >
                    Подробнее
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => navigate(`/salon/${salon.id}/booking`)}
                    color="primary"
                    variant="contained"
                    sx={{ borderRadius: 4 }}
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

// Компонент Settings - настройки профиля и аккаунта
const Settings = ({ 
  user, 
  isLoading, 
  error, 
  submitUserProfile,
  navigate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birth_date: '',
    preferences: ''
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        preferences: user.preferences || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async () => {
    try {
      await submitUserProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Настройки профиля
        </Typography>
        {!isEditing ? (
          <Button 
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
            disabled={isLoading || error}
          >
            Редактировать
          </Button>
        ) : (
          <Box>
            <Button 
              variant="outlined"
              color="error"
              sx={{ mr: 1 }}
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button 
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
            >
              Сохранить
            </Button>
          </Box>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Сервис профиля временно недоступен</AlertTitle>
          <Typography variant="body2" paragraph>
            В данный момент невозможно загрузить или обновить данные профиля. Наши специалисты уже работают над решением проблемы.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<ReplayIcon />}
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
            >
              На главную
            </Button>
          </Box>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Основная информация */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Личная информация
                </Box>
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Полное имя"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Телефон"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={true} // Телефон нельзя изменить
                    variant="filled"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Дата рождения"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Предпочтения"
                    name="preferences"
                    multiline
                    rows={4}
                    value={formData.preferences}
                    onChange={handleChange}
                    disabled={!isEditing}
                    variant={isEditing ? "outlined" : "filled"}
                    InputProps={{
                      readOnly: !isEditing,
                    }}
                    placeholder="Опишите ваши предпочтения по услугам, мастерам и т.д."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Настройки уведомлений и безопасность */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Уведомления
                </Box>
              </Typography>
              
              <FormGroup sx={{ mt: 2 }}>
                <FormControlLabel 
                  control={<Switch checked={true} disabled={!isEditing} />} 
                  label="Напоминания о записях" 
                />
                <FormControlLabel 
                  control={<Switch checked={true} disabled={!isEditing} />} 
                  label="Специальные предложения" 
                />
                <FormControlLabel 
                  control={<Switch checked={false} disabled={!isEditing} />} 
                  label="Новости салонов" 
                />
                <FormControlLabel 
                  control={<Switch checked={true} disabled={!isEditing} />} 
                  label="Подтверждения записей" 
                />
              </FormGroup>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Безопасность
                </Box>
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<VpnKeyIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                  disabled={!isEditing}
                >
                  Изменить пароль
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<LogoutIcon />}
                  fullWidth
                  onClick={() => {
                    // Здесь должна быть функция выхода из аккаунта
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                >
                  Выход из аккаунта
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Данные аккаунта и удаление */}
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" gutterBottom color="error">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DeleteForeverIcon sx={{ mr: 1, color: 'error.main' }} />
                  Удаление аккаунта
                </Box>
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" paragraph>
                  Удаление аккаунта приведет к безвозвратной потере всех данных, включая историю записей, избранные салоны и бонусные баллы.
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<DeleteForeverIcon />}
                >
                  Удалить аккаунт
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

const ClientApp = () => {
  const { 
    user, 
    isLoading: isUserLoading, 
    error: userError,
    logout 
  } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorElActions, setAnchorElActions] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Запросы на получение данных
  const { 
    data: upcomingAppointments, 
    isLoading: isLoadingUpcoming, 
    error: upcomingError,
    refetch: refetchUpcoming
  } = useQuery(
    ['appointments', 'upcoming'], 
    () => appointmentApi.getUpcoming(),
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Ошибка при загрузке предстоящих записей:', error);
        // Здесь можно добавить код для отображения уведомления пользователю
        // например, через Snackbar или Alert
      },
      retry: 1, // Пробуем запрос повторно только 1 раз
      retryDelay: 1000 // Задержка 1 секунда между повторами
    }
  );
  
  const { 
    data: pastAppointments, 
    isLoading: isLoadingPast,
    error: pastError,
    refetch: refetchPast
  } = useQuery(
    ['appointments', 'past'], 
    () => appointmentApi.getPast(),
    {
      enabled: !!user && currentTab === 2,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Ошибка при загрузке истории записей:', error);
      },
      retry: 1,
      retryDelay: 1000
    }
  );
  
  const { 
    data: favoriteSalons, 
    isLoading: isLoadingFavorites,
    error: favoritesError,
    refetch: refetchFavorites
  } = useQuery(
    ['salons', 'favorites'], 
    () => favoritesApi.getFavoriteSalons(),
    {
      enabled: !!user && currentTab === 3,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Ошибка при загрузке избранных салонов:', error);
      },
      retry: 1,
      retryDelay: 1000
    }
  );
  
  // Получение статистики клиента
  const { 
    data: clientStats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery(
    ['clientStats'], 
    () => userApi.getClientStats(),
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Ошибка при загрузке статистики клиента:', error);
      },
      retry: 1,
      retryDelay: 1000
    }
  );
  
  // Мутации для действий
  const cancelAppointmentMutation = useMutation(
    (id) => appointmentApi.cancel(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments', 'upcoming']);
        queryClient.invalidateQueries(['appointments', 'past']);
        handleCloseActionsMenu();
        // Здесь можно добавить уведомление об успешной отмене
      },
      onError: (error) => {
        console.error('Ошибка при отмене записи:', error);
        alert(`Не удалось отменить запись: ${error.message || 'Произошла ошибка на сервере'}`);
      }
    }
  );
  
  const toggleFavoriteMutation = useMutation(
    (id) => {
      // Проверяем, есть ли салон в избранном, и в зависимости от этого добавляем или удаляем
      const salon = favoriteSalons?.find(s => s.id === id);
      return salon 
        ? favoritesApi.removeSalonFromFavorites(id) 
        : favoritesApi.addSalonToFavorites(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['salons', 'favorites']);
        // Здесь можно добавить уведомление об успешном добавлении/удалении из избранного
      },
      onError: (error) => {
        console.error('Ошибка при добавлении/удалении салона из избранного:', error);
        alert(`Не удалось обновить список избранного: ${error.message || 'Произошла ошибка на сервере'}`);
      }
    }
  );
  
  const updateProfileMutation = useMutation(
    (data) => userApi.updateProfile(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user']);
        // Здесь можно добавить уведомление об успешном обновлении профиля
      },
      onError: (error) => {
        console.error('Ошибка при обновлении профиля:', error);
        alert(`Не удалось обновить профиль: ${error.message || 'Произошла ошибка на сервере'}`);
      }
    }
  );
  
  // Обработчики действий
  const handleCancelAppointment = (id) => {
    if (window.confirm('Вы уверены, что хотите отменить запись?')) {
      cancelAppointmentMutation.mutate(id);
    }
  };
  
  const toggleFavorite = (id) => {
    toggleFavoriteMutation.mutate(id);
  };
  
  const updateProfile = (data) => {
    return updateProfileMutation.mutateAsync(data);
  };
  
  const handleOpenActionsMenu = (event, id) => {
    setAnchorElActions(event.currentTarget);
    setSelectedAppointmentId(id);
  };
  
  const handleCloseActionsMenu = () => {
    setAnchorElActions(null);
    setSelectedAppointmentId(null);
  };
  
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      logout();
      navigate('/');
    }
  };
  
  // Эффект для определения активной вкладки по URL
  useEffect(() => {
    if (location.pathname.includes('/appointments')) {
      setCurrentTab(1);
    } else if (location.pathname.includes('/history')) {
      setCurrentTab(2);
    } else if (location.pathname.includes('/favorites')) {
      setCurrentTab(3);
    } else if (location.pathname.includes('/settings')) {
      setCurrentTab(4);
    } else {
      setCurrentTab(0);
    }
  }, [location.pathname]);
  
  const tabItems = [
    { label: "Дашборд", icon: <DashboardIcon />, path: "/client" },
    { label: "Записи", icon: <EventIcon />, path: "/client/appointments" },
    { label: "История", icon: <HistoryIcon />, path: "/client/history" },
    { label: "Избранное", icon: <FavoriteIcon />, path: "/client/favorites" },
    { label: "Настройки", icon: <SettingsIcon />, path: "/client/settings" }
  ];
  
  const handleChangeTab = (index) => {
    setCurrentTab(index);
    navigate(tabItems[index].path);
  };
  
  if (isUserLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Верхняя панель навигации */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: 'primary.main',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box 
              component="img"
              src="https://i.imgur.com/QGCVXtt.png"
              alt="Лого"
              sx={{ 
                height: 32,
                width: 'auto',
                mr: 1
              }}
            />
            Beauty Salon
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {tabItems.map((item, index) => (
                <Button
                  key={index}
                  color={currentTab === index ? "primary" : "inherit"}
                  startIcon={item.icon}
                  onClick={() => handleChangeTab(index)}
                  sx={{ 
                    mx: 0.5,
                    fontWeight: currentTab === index ? 600 : 400,
                    borderRadius: 2,
                    px: 2,
                    py: 1
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Tooltip title="Уведомления">
              <IconButton
                size="large"
                color="inherit"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
              {user?.name && (
                <Box sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {user.name.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Клиент
                  </Typography>
                </Box>
              )}
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: 'primary.main',
                  cursor: 'pointer'
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                {user?.name ? user.name.charAt(0) : <AccountCircleIcon />}
              </Avatar>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Основное содержимое */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          mt: { xs: 7, sm: 8 },
          mb: { xs: 7, sm: 0 }
        }}
      >
        <Container maxWidth="lg">
          {/* Отображаем глобальное уведомление, если сервер недоступен */}
          {(upcomingError || pastError || favoritesError || statsError) && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Внимание</AlertTitle>
              Некоторые сервисы временно недоступны. Мы работаем над их восстановлением.
            </Alert>
          )}
          
          {/* Контент зависит от выбранной вкладки */}
          <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
            <Dashboard 
              user={user}
              upcomingAppointments={upcomingAppointments}
              clientStats={clientStats}
              isLoadingUpcoming={isLoadingUpcoming}
              isLoadingStats={isLoadingStats}
              handleCancelAppointment={handleCancelAppointment}
              handleOpenActionsMenu={handleOpenActionsMenu}
              navigate={navigate}
              isMobile={isMobile}
              upcomingError={upcomingError}
              statsError={statsError}
              refetchUpcoming={refetchUpcoming}
            />
          </Box>
          
          <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
            <Appointments 
              appointments={upcomingAppointments}
              isLoading={isLoadingUpcoming}
              error={upcomingError}
              refetch={refetchUpcoming}
              handleCancelAppointment={handleCancelAppointment}
              handleOpenActionsMenu={handleOpenActionsMenu}
              navigate={navigate}
              isMobile={isMobile}
            />
          </Box>
          
          <Box sx={{ display: currentTab === 2 ? 'block' : 'none' }}>
            <History 
              appointments={pastAppointments}
              isLoading={isLoadingPast}
              error={pastError}
              refetch={refetchPast}
              navigate={navigate}
              isMobile={isMobile}
            />
          </Box>
          
          <Box sx={{ display: currentTab === 3 ? 'block' : 'none' }}>
            <Favorites 
              favorites={favoriteSalons}
              isLoading={isLoadingFavorites}
              error={favoritesError}
              refetch={refetchFavorites}
              toggleFavorite={toggleFavorite}
              navigate={navigate}
              isMobile={isMobile}
            />
          </Box>
          
          <Box sx={{ display: currentTab === 4 ? 'block' : 'none' }}>
            <Settings 
              user={user}
              isLoading={updateProfileMutation.isLoading}
              error={updateProfileMutation.error}
              submitUserProfile={updateProfile}
              navigate={navigate}
            />
          </Box>
        </Container>
      </Box>
      
      {/* Нижняя навигация для мобильных устройств */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 100,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }} 
          elevation={0}
        >
          <BottomNavigation
            value={currentTab}
            onChange={(event, newValue) => {
              handleChangeTab(newValue);
            }}
            showLabels
          >
            {tabItems.map((item, index) => (
              <BottomNavigationAction 
                key={index} 
                label={item.label} 
                icon={item.icon} 
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
      
      {/* Меню профиля */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleChangeTab(4);
        }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Мой профиль
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleChangeTab(1);
        }}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          Мои записи
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleChangeTab(3);
        }}>
          <ListItemIcon>
            <FavoriteIcon fontSize="small" />
          </ListItemIcon>
          Избранное
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleLogout();
        }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Выйти
        </MenuItem>
      </Menu>
      
      {/* Меню действий для записи */}
      <Menu
        anchorEl={anchorElActions}
        open={Boolean(anchorElActions)}
        onClose={handleCloseActionsMenu}
      >
        <MenuItem onClick={() => {
          const appointment = upcomingAppointments?.find(a => a.id === selectedAppointmentId);
          if (appointment) {
            navigate(`/salon/${appointment.salon_id}`);
          }
          handleCloseActionsMenu();
        }}>
          <ListItemIcon>
            <LocationOnIcon fontSize="small" />
          </ListItemIcon>
          Перейти к салону
        </MenuItem>
        <MenuItem onClick={() => {
          handleCancelAppointment(selectedAppointmentId);
        }}>
          <ListItemIcon>
            <CancelIcon fontSize="small" />
          </ListItemIcon>
          Отменить запись
        </MenuItem>
      </Menu>
      
      {/* Модальное окно с уведомлениями */}
      <Modal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        closeAfterTransition
        slots={{
          backdrop: Backdrop
        }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={showNotifications}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2
          }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Уведомления
            </Typography>
            <List>
              <ListItem 
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  borderRadius: 2, 
                  bgcolor: 'primary.lighter'
                }}
              >
                <ListItemText
                  primary="Напоминание о записи"
                  secondary="Завтра в 14:00 у вас запись на стрижку"
                />
              </ListItem>
              <ListItem 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'success.lighter'
                }}
              >
                <ListItemText
                  primary="Специальное предложение"
                  secondary="Скидка 20% на окрашивание волос до конца недели"
                />
              </ListItem>
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setShowNotifications(false)}>
                Закрыть
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ClientApp; 