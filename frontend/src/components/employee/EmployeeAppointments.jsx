import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Skeleton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appointmentApi } from '../../api/appointments';
import { useAuthContext } from '../../contexts/AuthContext';
import { format, parseISO, isToday, isAfter, isBefore, startOfDay, endOfDay, addDays } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import { useNavigate } from 'react-router-dom';

const EmployeeAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Получение записей сотрудника на выбранную дату
  const {
    data: appointments,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['employeeAppointments', user?.id, format(selectedDate, 'yyyy-MM-dd')],
    () => appointmentApi.getEmployeeAppointments(
      user.id,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );

  // Мутация для изменения статуса записи
  const updateStatusMutation = useMutation(
    (data) => appointmentApi.updateStatus(data.appointmentId, data.status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'employeeAppointments',
          user?.id,
          format(selectedDate, 'yyyy-MM-dd')
        ]);
        setStatusDialogOpen(false);
        setSelectedAppointment(null);
        setStatusNotes('');
      }
    }
  );

  // Мутация для отмены записи
  const cancelAppointmentMutation = useMutation(
    (data) => appointmentApi.cancel(data.appointmentId, data.reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'employeeAppointments',
          user?.id,
          format(selectedDate, 'yyyy-MM-dd')
        ]);
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
        setCancelReason('');
      }
    }
  );

  // Обработчик изменения даты
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Обработчик открытия диалога изменения статуса
  const handleOpenStatusDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusDialogOpen(true);
  };

  // Обработчик открытия диалога отмены записи
  const handleOpenCancelDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  // Обработчик изменения статуса
  const handleUpdateStatus = (status) => {
    if (!selectedAppointment) return;

    updateStatusMutation.mutate({
      appointmentId: selectedAppointment.id,
      status,
      notes: statusNotes
    });
  };

  // Обработчик отмены записи
  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;

    cancelAppointmentMutation.mutate({
      appointmentId: selectedAppointment.id,
      reason: cancelReason
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

  // Функция фильтрации записей в зависимости от вкладки
  const getFilteredAppointments = () => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = parseISO(appointment.date_time);
      
      if (tabValue === 0) { // Все записи на день
        return true;
      } else if (tabValue === 1) { // Текущие (сегодняшние и будущие)
        return appointment.status === 'pending' && 
               (isToday(appointmentDate) || isAfter(appointmentDate, new Date()));
      } else if (tabValue === 2) { // Завершенные
        return appointment.status === 'completed';
      } else if (tabValue === 3) { // Отмененные
        return appointment.status === 'cancelled';
      }
      return true;
    }).sort((a, b) => parseISO(a.date_time) - parseISO(b.date_time));
  };

  // Удаляем моковые данные и используем только реальные данные из API
  const filteredAppointments = getFilteredAppointments();

  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button color="inherit" size="small" onClick={refetch}>
            Повторить
          </Button>
        }
      >
        Ошибка при загрузке записей: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Мои записи
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Выберите дату
              </Typography>
              <LocalizationProvider 
                dateAdapter={AdapterDateFns}
                adapterLocale={ruLocale}
              >
                <DatePicker 
                  label="Дата"
                  value={selectedDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Итого на {format(selectedDate, 'dd.MM.yyyy')}:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">
                        {filteredAppointments.filter(a => a.status === 'pending').length}
                      </Typography>
                      <Typography variant="body2">
                        Ожидают
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">
                        {filteredAppointments.filter(a => a.status === 'completed').length}
                      </Typography>
                      <Typography variant="body2">
                        Выполнено
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Контактная информация сотрудника */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
                  {user?.name?.[0] || 'У'}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.name || 'Сотрудник'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'employee' ? 'Специалист' : 'Администратор'}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" gutterBottom>
                Рабочее расписание:
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Пн-Пт: 09:00 - 18:00
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Сб: 10:00 - 16:00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Все" />
              <Tab label="Текущие" />
              <Tab label="Завершенные" />
              <Tab label="Отмененные" />
            </Tabs>
          </Paper>

          {filteredAppointments.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Записи не найдены
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {tabValue === 0 
                  ? "На выбранный день нет записей"
                  : tabValue === 1 
                    ? "Нет текущих записей"
                    : tabValue === 2 
                      ? "Нет завершенных записей"
                      : "Нет отмененных записей"}
              </Typography>
            </Paper>
          )}

          {filteredAppointments.length > 0 && (
            <List>
              {filteredAppointments.map((appointment) => {
                const appointmentDate = parseISO(appointment.date_time);
                const isPending = appointment.status === 'pending';
                const isCompleted = appointment.status === 'completed';
                const isCancelled = appointment.status === 'cancelled';
                
                return (
                  <Paper key={appointment.id} sx={{ mb: 2 }}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box>
                          {isPending && (
                            <>
                              <IconButton
                                color="success"
                                onClick={() => handleOpenStatusDialog(appointment)}
                                title="Отметить выполненной"
                              >
                                <CheckCircleOutlineIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenCancelDialog(appointment)}
                                title="Отменить запись"
                              >
                                <CancelIcon />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="h6" sx={{ mr: 1 }}>
                                {appointment.client_name}
                              </Typography>
                              <Chip
                                label={getStatusText(appointment.status, appointment.date_time)}
                                color={getStatusColor(appointment.status, appointment.date_time)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.client_contact}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ color: 'text.primary' }}>
                            <Typography variant="subtitle1" sx={{ mt: 1 }} component="div">
                              {appointment.service_name}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <EventIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" component="span">
                                {format(appointmentDate, 'dd.MM.yyyy')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" component="span">
                                {format(appointmentDate, 'HH:mm')} - {format(new Date(appointmentDate.getTime() + appointment.duration * 60000), 'HH:mm')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <HomeIcon fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" component="span">
                                {appointment.salon_name}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }} component="span">
                                Стоимость: {appointment.price} ₽
                              </Typography>
                            </Box>
                            
                            {appointment.notes && (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }} component="div">
                                Примечание: {appointment.notes}
                              </Typography>
                            )}
                            
                            {isCancelled && appointment.cancel_reason && (
                              <Typography variant="body2" color="error" sx={{ mt: 1 }} component="div">
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
        </Grid>
      </Grid>

      {/* Диалог изменения статуса */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      >
        <DialogTitle>Завершить запись</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Отметить запись клиента {selectedAppointment?.client_name} на {selectedAppointment && format(parseISO(selectedAppointment.date_time), 'dd.MM.yyyy в HH:mm')} как выполненную?
          </DialogContentText>
          <TextField
            margin="dense"
            id="notes"
            label="Комментарий к выполнению (необязательно)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => handleUpdateStatus('completed')}
            color="success"
            variant="contained"
            disabled={updateStatusMutation.isLoading}
          >
            {updateStatusMutation.isLoading ? 'Загрузка...' : 'Подтвердить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отмены записи */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Отменить запись</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Отменить запись клиента {selectedAppointment?.client_name} на {selectedAppointment && format(parseISO(selectedAppointment.date_time), 'dd.MM.yyyy в HH:mm')}?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Причина отмены"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleCancelAppointment}
            color="error"
            disabled={cancelAppointmentMutation.isLoading || !cancelReason.trim()}
          >
            {cancelAppointmentMutation.isLoading ? 'Загрузка...' : 'Отменить запись'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeAppointments; 