import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appointmentApi } from '../../api/appointments';
import { useAuthContext } from '../../contexts/AuthContext';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { useNavigate } from 'react-router-dom';

const AppointmentList = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Загрузка списка записей пользователя
  const { data: appointments, isLoading, error } = useQuery(
    ['appointments', user?.id], 
    () => appointmentApi.getUserAppointments(user.id),
    {
      enabled: !!user?.id,
      // Кэширование данных на 5 минут
      staleTime: 5 * 60 * 1000
    }
  );

  // Мутация для отмены записи
  const cancelAppointmentMutation = useMutation(
    (data) => appointmentApi.cancel(data.appointmentId, data.reason),
    {
      onSuccess: () => {
        // Обновление списка записей после успешной отмены
        queryClient.invalidateQueries(['appointments', user?.id]);
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
        setCancelReason('');
      }
    }
  );

  // Мутация для добавления отзыва
  const addReviewMutation = useMutation(
    (data) => appointmentApi.addReview(data.appointmentId, data.reviewData),
    {
      onSuccess: () => {
        // Обновление списка записей после успешного добавления отзыва
        queryClient.invalidateQueries(['appointments', user?.id]);
        setReviewDialogOpen(false);
        setSelectedAppointment(null);
        setRating(5);
        setReviewComment('');
      }
    }
  );

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Обработчик открытия диалога отмены записи
  const handleOpenCancelDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  // Обработчик открытия диалога добавления отзыва
  const handleOpenReviewDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setReviewDialogOpen(true);
  };

  // Обработчик отмены записи
  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    
    cancelAppointmentMutation.mutate({
      appointmentId: selectedAppointment.id,
      reason: cancelReason
    });
  };

  // Обработчик добавления отзыва
  const handleAddReview = () => {
    if (!selectedAppointment) return;
    
    addReviewMutation.mutate({
      appointmentId: selectedAppointment.id,
      reviewData: {
        rating,
        comment: reviewComment
      }
    });
  };

  // Функция получения цвета статуса записи
  const getStatusColor = (status, date_time) => {
    const appointmentDate = parseISO(date_time);
    
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'pending':
        return isToday(appointmentDate) ? 'warning' : 'primary';
      default:
        return 'default';
    }
  };

  // Функция получения текста статуса записи
  const getStatusText = (status, date_time) => {
    const appointmentDate = parseISO(date_time);
    
    switch (status) {
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      case 'pending':
        return isToday(appointmentDate) ? 'Сегодня' : 'Запланирована';
      default:
        return 'Неизвестно';
    }
  };

  // Фильтрация записей по статусу в зависимости от выбранной вкладки
  const filteredAppointments = appointments ? appointments.filter(appointment => {
    const appointmentDate = parseISO(appointment.date_time);
    
    if (tabValue === 0) { // Предстоящие
      return appointment.status === 'pending' && (isToday(appointmentDate) || isAfter(appointmentDate, new Date()));
    } else if (tabValue === 1) { // Прошедшие
      return appointment.status === 'completed' || (appointment.status === 'pending' && isBefore(appointmentDate, new Date()) && !isToday(appointmentDate));
    } else if (tabValue === 2) { // Отмененные
      return appointment.status === 'cancelled';
    }
    return true;
  }) : [];

  // Сортировка записей по дате (ближайшие сначала)
  filteredAppointments.sort((a, b) => {
    const dateA = parseISO(a.date_time);
    const dateB = parseISO(b.date_time);
    return tabValue === 0 ? dateA - dateB : dateB - dateA;
  });

  // Используем только реальные данные из API
  const appointmentList = appointments || [];

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
        Ошибка при загрузке списка записей: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Мои записи
      </Typography>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Предстоящие" />
        <Tab label="Прошедшие" />
        <Tab label="Отмененные" />
      </Tabs>

      {filteredAppointments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {tabValue === 0 
              ? 'У вас нет предстоящих записей' 
              : tabValue === 1 
                ? 'У вас нет прошедших записей' 
                : 'У вас нет отмененных записей'}
          </Typography>
          {tabValue === 0 && (
            <Button 
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/salons')}
            >
              Записаться на услугу
            </Button>
          )}
        </Paper>
      ) : (
        <List>
          {filteredAppointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.date_time);
            const canCancel = appointment.status === 'pending' && 
                            (isToday(appointmentDate) || isAfter(appointmentDate, new Date()));
            const canReview = appointment.status === 'completed' && !appointment.review;
                            
            return (
              <Paper key={appointment.id} sx={{ mb: 2 }}>
                <ListItem 
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      {canCancel && (
                        <IconButton 
                          color="error" 
                          onClick={() => handleOpenCancelDialog(appointment)}
                          title="Отменить запись"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                      {canReview && (
                        <IconButton 
                          color="primary"
                          onClick={() => handleOpenReviewDialog(appointment)}
                          title="Оставить отзыв"
                        >
                          <RateReviewIcon />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">
                          {appointment.service_name}
                        </Typography>
                        <Chip
                          label={getStatusText(appointment.status, appointment.date_time)}
                          color={getStatusColor(appointment.status, appointment.date_time)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ color: 'text.primary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {format(appointmentDate, 'dd.MM.yyyy')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {format(appointmentDate, 'HH:mm')} - {format(new Date(appointmentDate.getTime() + appointment.duration * 60000), 'HH:mm')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {appointment.employee_name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {appointment.salon_name}, {appointment.salon_address}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'bold' }}>
                          Стоимость: {appointment.price} ₽
                        </Typography>
                        
                        {appointment.review && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                Ваш отзыв:
                              </Typography>
                              {Array.from({ length: appointment.review.rating }).map((_, index) => (
                                <SentimentVerySatisfiedIcon key={index} fontSize="small" color="primary" />
                              ))}
                              {Array.from({ length: 5 - appointment.review.rating }).map((_, index) => (
                                <SentimentVeryDissatisfiedIcon key={index} fontSize="small" color="disabled" />
                              ))}
                            </Box>
                            {appointment.review.comment && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {appointment.review.comment}
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        {appointment.status === 'cancelled' && appointment.cancel_reason && (
                          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            Причина отмены: {appointment.cancel_reason}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Paper>
            );
          })}
        </List>
      )}

      {/* Диалог подтверждения отмены записи */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Отменить запись?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите отменить запись на {selectedAppointment && format(parseISO(selectedAppointment.date_time), 'dd.MM.yyyy в HH:mm')}?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Причина отмены (необязательно)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleCancelAppointment} 
            color="error"
            disabled={cancelAppointmentMutation.isLoading}
          >
            {cancelAppointmentMutation.isLoading ? 'Загрузка...' : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог добавления отзыва */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
      >
        <DialogTitle>Оставить отзыв</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Поделитесь своим впечатлением о услуге "{selectedAppointment?.service_name}" в салоне "{selectedAppointment?.salon_name}".
          </DialogContentText>
          
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Оценка:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <IconButton 
                  key={index} 
                  onClick={() => setRating(index + 1)}
                  color={index < rating ? 'primary' : 'default'}
                >
                  {index < rating ? 
                    <SentimentVerySatisfiedIcon fontSize="large" /> : 
                    <SentimentVeryDissatisfiedIcon fontSize="large" />
                  }
                </IconButton>
              ))}
            </Box>
          </Box>
          
          <TextField
            margin="dense"
            id="comment"
            label="Комментарий (необязательно)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleAddReview} 
            color="primary"
            disabled={addReviewMutation.isLoading}
            variant="contained"
          >
            {addReviewMutation.isLoading ? 'Загрузка...' : 'Отправить отзыв'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentList; 