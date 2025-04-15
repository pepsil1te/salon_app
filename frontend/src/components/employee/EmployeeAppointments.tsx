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
import { AppointmentDetails } from '../../types/employee';
import { AuthContextType } from '../../types/auth';

interface User {
  id: number;
  name: string;
  role: string;
}

interface StatusUpdateData {
  appointmentId: number;
  status: 'completed' | 'cancelled';
  notes?: string;
}

interface CancelData {
  appointmentId: number;
  reason: string;
}

const EmployeeAppointments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext() as AuthContextType;
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDetails | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');

  // Получение записей сотрудника на выбранную дату
  const {
    data: appointments,
    isLoading,
    error,
    refetch
  } = useQuery<AppointmentDetails[], Error>(
    ['employeeAppointments', user?.id, format(selectedDate, 'yyyy-MM-dd')],
    () => appointmentApi.getEmployeeAppointments(
      user?.id as number,
      format(selectedDate, 'yyyy-MM-dd')
    ),
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 минут
    }
  );

  // Мутация для изменения статуса записи
  const updateStatusMutation = useMutation<AppointmentDetails, Error, StatusUpdateData>(
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
  const cancelAppointmentMutation = useMutation<AppointmentDetails, Error, CancelData>(
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
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Обработчик изменения вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Обработчик открытия диалога изменения статуса
  const handleOpenStatusDialog = (appointment: AppointmentDetails) => {
    setSelectedAppointment(appointment);
    setStatusDialogOpen(true);
  };

  // Обработчик открытия диалога отмены записи
  const handleOpenCancelDialog = (appointment: AppointmentDetails) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  // Обработчик изменения статуса
  const handleUpdateStatus = (status: 'completed' | 'cancelled') => {
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
  const getStatusColor = (status: string, date_time: string): "success" | "error" | "warning" | "primary" | "default" => {
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
  const getStatusText = (status: string, date_time: string): string => {
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
  const getFilteredAppointments = (): AppointmentDetails[] => {
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
    }).sort((a, b) => parseISO(a.date_time).getTime() - parseISO(b.date_time).getTime());
  };

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
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => refetch()}
          >
            Повторить
          </Button>
        }
      >
        Ошибка при загрузке записей: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* ... остальной JSX код ... */}
    </Box>
  );
};

export default EmployeeAppointments; 