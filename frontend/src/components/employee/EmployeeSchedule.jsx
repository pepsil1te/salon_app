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
  Divider,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { employeeApi } from '../../api/employees';
import { useAuthContext } from '../../contexts/AuthContext';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay, parse, parseISO, isToday } from 'date-fns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import SaveIcon from '@mui/icons-material/Save';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const EmployeeSchedule = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState(() => endOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [editMode, setEditMode] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    working_hours: {},
    time_off: []
  });
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [selectedDayForTimeOff, setSelectedDayForTimeOff] = useState(null);
  const [timeOffReason, setTimeOffReason] = useState('');

  // Получение расписания сотрудника
  const {
    data: schedule,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['employeeSchedule', user?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    () => employeeApi.getSchedule(
      user.id,
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 минут
      onSuccess: (data) => {
        setScheduleData(data);
      }
    }
  );

  // Мутация для обновления расписания сотрудника
  const updateScheduleMutation = useMutation(
    (newSchedule) => employeeApi.updateSchedule(user.id, newSchedule),
    {
      onSuccess: (data) => {
        console.log('Расписание успешно обновлено:', data);
        setEditMode(false);
        queryClient.invalidateQueries([
          'employeeSchedule',
          user?.id,
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        ]);
      },
      onError: (error) => {
        console.error('Ошибка при обновлении расписания:', error);
        alert('Не удалось сохранить расписание. Пожалуйста, проверьте консоль для дополнительной информации.');
      }
    }
  );

  // Обработчик изменения даты
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setStartDate(startOfWeek(date, { weekStartsOn: 1 }));
    setEndDate(endOfWeek(date, { weekStartsOn: 1 }));
  };

  // Тестовые данные для расписания, если API не вернуло результаты
  const mockSchedule = {
    employee_id: user?.id || 1,
    working_hours: {
      1: { start: '09:00', end: '18:00' },
      2: { start: '09:00', end: '18:00' },
      3: { start: '09:00', end: '18:00' },
      4: { start: '09:00', end: '18:00' },
      5: { start: '09:00', end: '18:00' },
      6: { start: '10:00', end: '16:00' }
    },
    time_off: [
      { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), reason: 'Отпуск' }
    ],
    appointments: [
      { date: format(new Date(), 'yyyy-MM-dd'), count: 5 },
      { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), count: 3 }
    ]
  };

  // Initialize the scheduleData from mockSchedule if data hasn't loaded yet
  useEffect(() => {
    if (!schedule) {
      setScheduleData({
        working_hours: mockSchedule.working_hours,
        time_off: mockSchedule.time_off || []
      });
    } else {
      // Make sure schedule has well-defined working_hours and time_off
      const updatedSchedule = {
        ...schedule,
        working_hours: schedule.working_hours || {},
        time_off: schedule.time_off || []
      };
      setScheduleData(updatedSchedule);
    }
  }, [schedule]);

  // Обработчик переключения в режим редактирования
  const handleEditMode = () => {
    setEditMode(true);
  };

  // Обработчик сохранения изменений расписания
  const handleSaveSchedule = () => {
    // Make sure the scheduleData has the proper structure before saving
    const dataToSave = {
      ...scheduleData,
      working_hours: scheduleData.working_hours || {},
      time_off: scheduleData.time_off || []
    };
    console.log('Отправка данных расписания:', dataToSave);
    updateScheduleMutation.mutate(dataToSave);
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditMode(false);
    // Вернуть исходные данные
    if (schedule) {
      setScheduleData({
        ...schedule,
        working_hours: schedule.working_hours || {},
        time_off: schedule.time_off || []
      });
    } else {
      setScheduleData({
        working_hours: mockSchedule.working_hours,
        time_off: mockSchedule.time_off || []
      });
    }
  };

  // Обработчик изменения рабочего времени
  const handleWorkingHoursChange = (day, field, value) => {
    if (!editMode) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      if (!newData.working_hours[day]) {
        newData.working_hours[day] = { start: '09:00', end: '18:00' };
      }
      
      newData.working_hours[day][field] = value;
      
      return newData;
    });
  };

  // Обработчик изменения статуса рабочего дня
  const handleWorkingDayChange = (day, isWorking) => {
    if (!editMode) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      if (isWorking) {
        // Если день становится рабочим
        if (!newData.working_hours[day]) {
          newData.working_hours[day] = { start: '09:00', end: '18:00' };
        }
      } else {
        // Если день становится выходным
        if (newData.working_hours[day]) {
          delete newData.working_hours[day];
        }
      }
      
      return newData;
    });
  };

  // Меняем подход к открытию диалога - теперь не передаем дату сразу
  const handleOpenTimeOffDialog = () => {
    // Устанавливаем текущую дату как начальное значение
    setSelectedDayForTimeOff(new Date());
    setTimeOffDialogOpen(true);
  };

  // Добавим обработчик изменения даты выходного
  const handleTimeOffDateChange = (date) => {
    setSelectedDayForTimeOff(date);
  };

  // Обработчик добавления выходного дня
  const handleAddTimeOff = () => {
    if (!selectedDayForTimeOff) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.time_off) {
        newData.time_off = [];
      }
      
      newData.time_off.push({
        date: format(selectedDayForTimeOff, 'yyyy-MM-dd'),
        reason: timeOffReason || 'Личные причины'
      });
      
      return newData;
    });

    setTimeOffDialogOpen(false);
    setSelectedDayForTimeOff(null);
    setTimeOffReason('');
  };

  // Функция проверки, является ли день выходным
  const isDayOff = (date) => {
    if (!scheduleData || !scheduleData.time_off) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduleData.time_off.some(timeOff => timeOff.date === dateStr);
  };

  // Функция получения причины выходного
  const getTimeOffReason = (date) => {
    if (!scheduleData || !scheduleData.time_off) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeOff = scheduleData.time_off.find(item => item.date === dateStr);
    return timeOff ? timeOff.reason : null;
  };

  // Функция проверки, является ли день рабочим
  const isWorkingDay = (day) => {
    // Make sure to handle the case where scheduleData or working_hours might be undefined
    if (!scheduleData || !scheduleData.working_hours) return false;
    
    // Convert day to string to match the keys in working_hours object
    const dayKey = day.toString();
    return dayKey in scheduleData.working_hours;
  };

  // Подготовка данных для отображения
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const workDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  // Используем тестовые данные, если API не вернуло результаты
  const displaySchedule = schedule || mockSchedule;

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
        Ошибка при загрузке расписания: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Мое расписание
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<EventBusyIcon />}
              onClick={handleOpenTimeOffDialog}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              Добавить выходной день
            </Button>
            {editMode ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSchedule}
                  disabled={updateScheduleMutation.isLoading}
                  sx={{ fontWeight: 'bold' }}
                >
                  {updateScheduleMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleCancelEdit}
                  disabled={updateScheduleMutation.isLoading}
                >
                  Отмена
                </Button>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={handleEditMode}
              >
                Редактировать расписание
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, mb: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<EventBusyIcon />}
            onClick={handleOpenTimeOffDialog}
            fullWidth
          >
            Добавить выходной день
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Выберите неделю:
          </Typography>
          <LocalizationProvider 
            dateAdapter={AdapterDateFns}
            adapterLocale={ruLocale}
          >
            <DatePicker 
              label="Дата"
              value={selectedDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />}
              sx={{ width: 200 }}
            />
          </LocalizationProvider>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Расписание на период: {format(startDate, 'dd.MM.yyyy')} — {format(endDate, 'dd.MM.yyyy')}
          </Typography>
        </Box>

        {editMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Вы можете настроить свое стандартное рабочее расписание на каждый день недели. 
              Используйте переключатели, чтобы указать рабочие дни, и установите время начала и окончания работы.
              Также вы можете отметить определенные дни как выходные.
            </Typography>
          </Alert>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.main',
                borderBottom: '1px solid #eee',
                pb: 1
              }}>
                <AccessTimeIcon sx={{ mr: 1 }} />
                Стандартное расписание
              </Typography>
              
              <Box>
                {editMode ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      Укажите ваше стандартное рабочее время для каждого дня недели:
                    </Typography>
                    <FormGroup>
                      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                        <Paper 
                          key={day} 
                          sx={{ 
                            p: 1.5, 
                            mb: 1, 
                            display: 'flex', 
                            alignItems: 'center',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1,
                            bgcolor: isWorkingDay(day) ? 'rgba(0, 230, 118, 0.08)' : 'inherit'
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                checked={isWorkingDay(day)}
                                onChange={(e) => handleWorkingDayChange(day, e.target.checked)}
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: 100 }}>
                                {workDays[day === 0 ? 6 : day - 1]}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                          
                          {isWorkingDay(day) && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              width: '100%',
                              justifyContent: 'space-between'
                            }}>
                              <TextField
                                label="Начало"
                                type="time"
                                value={scheduleData.working_hours[day]?.start || '09:00'}
                                onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                size="small"
                                sx={{ width: '45%' }}
                              />
                              <Typography variant="body2" sx={{ mx: 1 }}>—</Typography>
                              <TextField
                                label="Конец"
                                type="time"
                                value={scheduleData.working_hours[day]?.end || '18:00'}
                                onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                size="small"
                                sx={{ width: '45%' }}
                              />
                            </Box>
                          )}
                        </Paper>
                      ))}
                    </FormGroup>
                  </Box>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {Object.entries(displaySchedule.working_hours || {}).length > 0 ? (
                      Object.entries(displaySchedule.working_hours || {}).map(([day, hours]) => (
                        <Box 
                          key={day} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            mb: 1,
                            p: 1,
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(0, 230, 118, 0.08)',
                            borderRadius: 1
                          }}
                        >
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {workDays[day === '0' ? 6 : parseInt(day) - 1]}
                          </Typography>
                          <Typography variant="body1" color="text.primary" sx={{ fontWeight: 'medium' }}>
                            {hours.start} — {hours.end}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Alert severity="warning">
                        Рабочее расписание не настроено. Нажмите "Редактировать расписание" для настройки.
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.main',
                borderBottom: '1px solid #eee',
                pb: 1
              }}>
                <EventBusyIcon sx={{ mr: 1 }} />
                Выходные дни
              </Typography>
              
              {scheduleData.time_off && scheduleData.time_off.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  {scheduleData.time_off.map((timeOff, index) => (
                    <Paper 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: 1,
                        p: 1.5,
                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                        borderRadius: 1
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {format(parseISO(timeOff.date), 'dd.MM.yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {timeOff.reason}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Выходной" 
                        color="error" 
                        size="small" 
                        sx={{ alignSelf: 'center' }}
                      />
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                  Нет отмеченных выходных дней
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.main',
                borderBottom: '1px solid #eee',
                pb: 1
              }}>
                Расписание по дням
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>День недели</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Дата</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Статус</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Рабочее время</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Записи</TableCell>
                      {editMode && <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Действия</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map((day) => {
                      const dayOfWeek = getDay(day);
                      const dayNumber = dayOfWeek === 0 ? 0 : dayOfWeek;
                      const isWorking = isWorkingDay(dayNumber);
                      const isOff = isDayOff(day);
                      const timeOffReasonText = getTimeOffReason(day);
                      const dayAppointments = displaySchedule.appointments?.find(
                        a => a.date === format(day, 'yyyy-MM-dd')
                      );
                      
                      return (
                        <TableRow 
                          key={format(day, 'yyyy-MM-dd')}
                          sx={{ 
                            bgcolor: isToday(day) 
                              ? 'rgba(33, 150, 243, 0.08)' 
                              : isOff 
                                ? 'rgba(244, 67, 54, 0.08)' 
                                : isWorking 
                                  ? 'rgba(0, 230, 118, 0.08)' 
                                  : 'inherit',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)',
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {workDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1]}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography 
                                variant="body1"
                                sx={{ fontWeight: isToday(day) ? 'bold' : 'normal' }}
                              >
                                {format(day, 'dd.MM.yyyy')}
                              </Typography>
                              {isToday(day) && (
                                <Chip
                                  label="Сегодня"
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {isOff ? (
                              <Chip
                                label="Выходной"
                                size="small"
                                color="error"
                                title={timeOffReasonText}
                              />
                            ) : isWorking ? (
                              <Chip
                                label="Рабочий день"
                                size="small"
                                color="success"
                              />
                            ) : (
                              <Chip
                                label="Выходной"
                                size="small"
                                color="default"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {isWorking && !isOff ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  {displaySchedule.working_hours && displaySchedule.working_hours[dayNumber] ? 
                                    `${displaySchedule.working_hours[dayNumber].start} — ${displaySchedule.working_hours[dayNumber].end}` : 
                                    'Не указано'}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Выходной
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {dayAppointments ? (
                              <Chip
                                label={`${dayAppointments.count} записей`}
                                size="small"
                                color="primary"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Нет записей
                              </Typography>
                            )}
                          </TableCell>
                          {editMode && (
                            <TableCell>
                              <Button
                                variant="outlined"
                                size="small"
                                color="primary"
                                startIcon={<EventBusyIcon />}
                                onClick={handleOpenTimeOffDialog}
                              >
                                Отметить как выходной
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={timeOffDialogOpen}
        onClose={() => setTimeOffDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Добавить выходной день
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Выберите дату выходного дня:
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <DatePicker
              label="Дата выходного"
              value={selectedDayForTimeOff}
              onChange={handleTimeOffDateChange}
              renderInput={(params) => (
                <TextField {...params} fullWidth sx={{ mb: 3 }} />
              )}
              minDate={new Date()}
            />
          </LocalizationProvider>
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Укажите причину:
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Причина"
            type="text"
            fullWidth
            value={timeOffReason}
            onChange={(e) => setTimeOffReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setTimeOffDialogOpen(false)}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={handleAddTimeOff}
            color="primary"
            variant="contained"
            startIcon={<EventBusyIcon />}
          >
            Добавить выходной
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSchedule; 