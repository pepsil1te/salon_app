import React, { useState, useEffect, useCallback } from 'react';
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
  InputLabel,
  Skeleton,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Theme
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
import CancelIcon from '@mui/icons-material/Cancel';
import { EmployeeSchedule as IEmployeeSchedule, WorkingHours, TimeOff } from '../../types/employee';
import { AuthContextType } from '../../types/auth';
import { WORK_DAYS, QUERY_KEYS, STALE_TIME } from '../../constants/employee';
import axios from 'axios';

// Используем константу из файла констант вместо моковых данных
const DEFAULT_WORKING_HOURS: WorkingHours = {
  start: '09:00',
  end: '18:00'
};

interface ScheduleData extends IEmployeeSchedule {
  working_hours: {
    [key: string]: WorkingHours;
  };
  time_off: TimeOff[];
  employee_id?: number;
}

// Функция создания дефолтного расписания на все дни недели - используется только если нужно создать новое
const createDefaultSchedule = (): { [key: string]: WorkingHours } => {
  const schedule: { [key: string]: WorkingHours } = {};
  // Создаем расписание для всех дней недели (с 1 до 7)
  for (let i = 1; i <= 7; i++) {
    schedule[i.toString()] = { ...DEFAULT_WORKING_HOURS };
  }
  return schedule;
};

// Тип для пропсов компонента
interface EmployeeScheduleProps {}

const EmployeeSchedule: React.FC<EmployeeScheduleProps> = () => {
  const { user } = useAuthContext() as AuthContextType;
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(() => startOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date>(() => endOfWeek(selectedDate, { weekStartsOn: 1 }));
  const [editMode, setEditMode] = useState<boolean>(false);
  const [scheduleData, setScheduleData] = useState<{
    working_hours: { [key: string]: { start: string; end: string } | null };
    time_off: Array<{ date: string; reason: string }>;
  }>({
    working_hours: WORK_DAYS.reduce((acc, day) => {
      acc[day] = DEFAULT_WORKING_HOURS;
      return acc;
    }, {} as { [key: string]: { start: string; end: string } | null }),
    time_off: []
  });
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState<boolean>(false);
  const [selectedDayForTimeOff, setSelectedDayForTimeOff] = useState<Date | null>(null);
  const [timeOffReason, setTimeOffReason] = useState<string>('');
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEE_SCHEDULE, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Не удалось загрузить расписание: ID пользователя не найден');
      }
      const response = await employeeApi.getSchedule(
        user.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      console.log('Loaded schedule data:', response);
      return response;
    },
    staleTime: STALE_TIME,
    enabled: !!user?.id,
    retry: 1,
    onSuccess: (fetchedData) => {
      console.log('Schedule data received:', fetchedData);
      // Проверяем, что данные есть и они в правильном формате
      if (fetchedData?.working_hours && Object.keys(fetchedData.working_hours).length > 0) {
        setScheduleData({
          working_hours: fetchedData.working_hours,
          time_off: fetchedData.time_off || []
        });
      } else {
        // Если данных нет или они в неправильном формате, используем значения по умолчанию
        console.log('Using default schedule data');
        const defaultData = {
          working_hours: WORK_DAYS.reduce((acc, day) => {
            acc[day] = DEFAULT_WORKING_HOURS;
            return acc;
          }, {} as { [key: string]: { start: string; end: string } | null }),
          time_off: []
        };
        setScheduleData(defaultData);
      }
    },
    onError: (err) => {
      console.error('Error loading schedule:', err);
      setNotification({
        open: true,
        message: `Ошибка загрузки расписания: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`,
        severity: 'error'
      });
    }
  });

  useEffect(() => {
    if (data?.working_hours && Object.keys(data.working_hours).length > 0) {
      setScheduleData({
        working_hours: data.working_hours,
        time_off: data.time_off || []
      });
    }
  }, [data]);

  // Мутация для обновления расписания
  const updateScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // Убеждаемся, что ID сотрудника включен в данные расписания
      const dataToSend = {
        ...scheduleData,
        employee_id: user.id
      };

      console.log('Sending working hours update:', { 
        employee_id: user.id,
        working_hours: dataToSend.working_hours 
      });

      const response = await employeeApi.updateSchedule(user.id, dataToSend);
      
      console.log('Schedule update response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Schedule successfully updated:', data);
      setEditMode(false);
      setNotification({
        open: true,
        message: 'Расписание успешно обновлено',
        severity: 'success'
      });
      
      // Принудительно обновляем данные из кэша после успешной мутации
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEE_SCHEDULE, user.id] });
        setTimeout(() => {
          refetch();
        }, 500);
      }
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
      setNotification({
        open: true,
        message: 'Ошибка при обновлении расписания',
        severity: 'error'
      });
    }
  });

  // Обработчик изменения даты
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setStartDate(startOfWeek(newDate, { weekStartsOn: 1 }));
      setEndDate(endOfWeek(newDate, { weekStartsOn: 1 }));
      
      // Принудительное обновление при изменении даты
      setTimeout(() => {
        console.log("Обновляем данные после изменения даты");
        refetch();
      }, 100);
    }
  };

  // Обработчик изменения рабочего времени
  const handleWorkingHoursChange = (day: string, field: keyof WorkingHours, value: string) => {
    if (!editMode) return;

    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (!newData.working_hours) {
        newData.working_hours = {};
      }
      
      if (!newData.working_hours[day]) {
        newData.working_hours[day] = { ...DEFAULT_WORKING_HOURS };
      }
      
      newData.working_hours[day][field] = value;
      
      return newData;
    });
  };

  // Обработчик сохранения расписания
  const handleSaveSchedule = () => {
    if (!user?.id) {
      console.error('Невозможно сохранить расписание: ID пользователя не найден');
      setNotification({
        open: true,
        message: 'Ошибка: ID пользователя не найден. Пожалуйста, войдите в систему снова.',
        severity: 'error'
      });
      return;
    }
    
    // Если рабочие часы не заданы, создаем дефолтные
    if (!scheduleData.working_hours || Object.keys(scheduleData.working_hours).length === 0) {
      setScheduleData(prev => ({
        ...prev,
        working_hours: createDefaultSchedule()
      }));
    }
    
    // Важно: явно устанавливаем ID сотрудника в объекте данных перед отправкой
    // Клонируем данные и добавляем ID сотрудника
    const updatedScheduleData = {
      ...scheduleData,
      employee_id: user.id
    };
    
    console.log('Saving schedule with employee_id:', user.id);
    
    // Обновляем состояние с ID сотрудника
    setScheduleData(updatedScheduleData);
    
    // Вызываем мутацию после обновления состояния
    setTimeout(() => {
      updateScheduleMutation.mutate();
    }, 0);
  };

  // Обработчик открытия диалога добавления выходного
  const handleOpenTimeOffDialog = () => {
    setSelectedDayForTimeOff(new Date());
    setTimeOffReason('');
    setTimeOffDialogOpen(true);
  };

  // Обработчик закрытия диалога добавления выходного
  const handleCloseTimeOffDialog = () => {
    setTimeOffDialogOpen(false);
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
    
    // Если в режиме редактирования, сохраняем изменения
    if (editMode) {
      handleSaveSchedule();
    }
  };

  // Обработчик удаления выходного дня
  const handleRemoveTimeOff = (index: number) => {
    setScheduleData(prev => {
      const newData = { ...prev };
      
      if (newData.time_off && newData.time_off.length > index) {
        newData.time_off = [
          ...newData.time_off.slice(0, index),
          ...newData.time_off.slice(index + 1)
        ];
      }
      
      return newData;
    });
    
    // Если в режиме редактирования, сохраняем изменения
    if (editMode) {
      handleSaveSchedule();
    }
  };

  // Проверяем, загружено ли расписание
  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!user?.id) {
    return (
      <Alert 
        severity="warning" 
        sx={{ mt: 2 }}
      >
        Для просмотра и редактирования расписания необходимо авторизоваться.
      </Alert>
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
        Ошибка при загрузке расписания: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
      </Alert>
    );
  }

  // Проверяем, настроено ли расписание
  const isScheduleConfigured = scheduleData?.working_hours && Object.keys(scheduleData.working_hours).length > 0;

  // Принудительная инициализация дефолтного расписания при редактировании
  const handleEditMode = () => {
    setEditMode(true);
    
    // Если расписание не настроено, создаем дефолтное
    if (!isScheduleConfigured) {
      console.log("Инициализация дефолтного расписания при редактировании");
      setScheduleData(prev => ({
        ...prev,
        working_hours: createDefaultSchedule(),
        employee_id: user?.id
      }));
    }
  };

  // Форматирование значений часов (обеспечивает совместимость с разными форматами с сервера)
  const formatTimeValue = (value: any) => {
    if (!value) return DEFAULT_WORKING_HOURS.start;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.hours !== undefined && value.minutes !== undefined) {
      // Если приходит в формате объекта {hours: 9, minutes: 0}
      return `${String(value.hours).padStart(2, '0')}:${String(value.minutes).padStart(2, '0')}`;
    }
    return DEFAULT_WORKING_HOURS.start;
  };

  // Компонент TextField для времени - адаптирует значение времени к разным форматам
  const TimeField = ({ day, field, label }: { day: string, field: keyof WorkingHours, label?: string }) => {
    // Получаем значение с учетом возможных форматов
    const rawValue = scheduleData?.working_hours?.[day]?.[field];
    const value = formatTimeValue(rawValue);
    
    return (
      <TextField
        type="time"
        size="small"
        label={label}
        fullWidth={isMobile}
        value={value}
        onChange={(e) => handleWorkingHoursChange(day, field, e.target.value)}
        disabled={!editMode}
        InputProps={{ inputProps: { step: 300 } }}
      />
    );
  };
  
  return (
    <Box>
      {notification.open && (
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={notification.severity} onClose={() => setNotification(prev => ({ ...prev, open: false }))}>
            {notification.message}
          </Alert>
        </Snackbar>
      )}

      {!isScheduleConfigured && !editMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Рабочее расписание не настроено. Нажмите "Редактировать расписание" для настройки.
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Рабочее расписание</Typography>
          <Box>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditMode}
              >
                Редактировать расписание
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSchedule}
                  disabled={updateScheduleMutation.isLoading}
                >
                  {updateScheduleMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {editMode && (
          <Box sx={{ display: 'flex', mb: 3, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<EventBusyIcon />}
              onClick={handleOpenTimeOffDialog}
              fullWidth={isMobile}
              sx={{ mb: { xs: 1, md: 0 } }}
            >
              Добавить выходной день
            </Button>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Стандартное рабочее время
          </Typography>

          {isMobile ? (
            // Мобильная версия таблицы расписания - карточки для каждого дня
            <Box>
              {WORK_DAYS.map((day, index) => (
                <Card key={day} sx={{ mb: 2, backgroundColor: isToday(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + index + 1))) ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{day}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TimeField 
                          day={String(index + 1)} 
                          field="start" 
                          label="Начало" 
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TimeField 
                          day={String(index + 1)} 
                          field="end" 
                          label="Конец" 
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Десктопная версия таблицы расписания
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>День недели</TableCell>
                    <TableCell>Начало работы</TableCell>
                    <TableCell>Конец работы</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {WORK_DAYS.map((day, index) => (
                    <TableRow 
                      key={day} 
                      sx={{ backgroundColor: isToday(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + index + 1))) ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}
                    >
                      <TableCell>{day}</TableCell>
                      <TableCell>
                        <TimeField 
                          day={String(index + 1)} 
                          field="start" 
                        />
                      </TableCell>
                      <TableCell>
                        <TimeField 
                          day={String(index + 1)} 
                          field="end" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" mb={2}>
          Выходные дни
        </Typography>
        {!scheduleData?.time_off || scheduleData.time_off.length === 0 ? (
          <Typography color="text.secondary">Нет запланированных выходных</Typography>
        ) : (
          <List>
            {scheduleData.time_off.map((timeOff, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  editMode && (
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveTimeOff(index)}
                    >
                      <CancelIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={format(new Date(timeOff.date), 'dd MMMM yyyy', { locale: ruLocale })}
                  secondary={timeOff.reason}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Диалог добавления выходного дня */}
      <Dialog open={timeOffDialogOpen} onClose={handleCloseTimeOffDialog}>
        <DialogTitle>Добавить выходной день</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Выберите дату и укажите причину выходного дня
          </DialogContentText>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <DatePicker
              label="Дата"
              value={selectedDayForTimeOff}
              onChange={(newValue) => setSelectedDayForTimeOff(newValue)}
              sx={{ width: '100%', mb: 2 }}
            />
          </LocalizationProvider>
          <TextField
            fullWidth
            label="Причина"
            value={timeOffReason}
            onChange={(e) => setTimeOffReason(e.target.value)}
            placeholder="Укажите причину (не обязательно)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTimeOffDialog}>
            Отмена
          </Button>
          <Button 
            variant="contained"
            onClick={handleAddTimeOff}
            disabled={!selectedDayForTimeOff}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSchedule; 