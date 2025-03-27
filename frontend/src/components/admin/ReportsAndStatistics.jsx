import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Stack,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useQuery } from 'react-query';
import { statisticsApi } from '../../api/statistics';
import { salonApi } from '../../api/salons';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  AttachMoney as AttachMoneyIcon,
  Event as EventIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import PeopleIcon from '@mui/icons-material/People';
import SpaIcon from '@mui/icons-material/Spa';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ReportsAndStatistics = () => {
  const { user } = useAuthContext();
  const [reportType, setReportType] = useState('revenue');
  const [selectedSalon, setSelectedSalon] = useState(user?.role === 'admin' ? 'all' : (user?.salon_id?.toString() || ''));
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [tabValue, setTabValue] = useState(0);
  const printRef = useRef(null);

  // Убедимся, что даты всегда валидны
  const validStartDate = dateRange.startDate instanceof Date && !isNaN(dateRange.startDate) 
    ? dateRange.startDate 
    : startOfMonth(new Date());
    
  const validEndDate = dateRange.endDate instanceof Date && !isNaN(dateRange.endDate)
    ? dateRange.endDate
    : endOfMonth(new Date());

  // Форматированные даты для запросов
  const formattedStartDate = format(validStartDate, 'yyyy-MM-dd');
  const formattedEndDate = format(validEndDate, 'yyyy-MM-dd');

  // Загрузка списка салонов
  const {
    data: salons,
    isLoading: isLoadingSalons
  } = useQuery(
    ['salons'],
    () => salonApi.getAll(),
    {
      staleTime: 10 * 60 * 1000, // 10 минут
      enabled: user?.role === 'admin' // Загружаем салоны только для админа
    }
  );

  // Загрузка общей статистики дашборда (только для админа)
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError
  } = useQuery(
    ['statistics', 'dashboard', formattedStartDate, formattedEndDate],
    () => statisticsApi.getDashboard({
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      enabled: user?.role === 'admin' // Removed tab condition to always fetch when admin
    }
  );

  // Загрузка статистики по сотрудникам
  const {
    data: employeeStatsData,
    isLoading: isLoadingEmployeeStats,
    error: employeeStatsError
  } = useQuery(
    [
      'statistics', 
      'employees', 
      selectedSalon !== 'all' ? selectedSalon : null,
      formattedStartDate, 
      formattedEndDate
    ],
    () => statisticsApi.getEmployeeStatistics({
      salonId: selectedSalon !== 'all' ? selectedSalon : undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      enabled: (user?.role === 'admin' || selectedSalon !== 'all') // Removed tab condition
    }
  );

  // Загрузка статистики по услугам
  const {
    data: serviceStatsData,
    isLoading: isLoadingServiceStats,
    error: serviceStatsError
  } = useQuery(
    [
      'statistics', 
      'services', 
      selectedSalon !== 'all' ? selectedSalon : null,
      formattedStartDate, 
      formattedEndDate
    ],
    () => statisticsApi.getServiceStatistics({
      salonId: selectedSalon !== 'all' ? selectedSalon : undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      enabled: (user?.role === 'admin' || selectedSalon !== 'all') // Removed tab condition
    }
  );

  // Загрузка финансовой статистики
  const {
    data: financialStatsData,
    isLoading: isLoadingFinancialStats,
    error: financialStatsError
  } = useQuery(
    [
      'statistics', 
      'financial', 
      selectedSalon !== 'all' ? selectedSalon : null,
      formattedStartDate, 
      formattedEndDate,
      reportType
    ],
    () => statisticsApi.getFinancialStatistics({
      salonId: selectedSalon !== 'all' ? selectedSalon : undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      enabled: (user?.role === 'admin' || selectedSalon !== 'all'), // Removed tab condition to always fetch
      refetchOnWindowFocus: false
    }
  );

  // Загрузка статистики конкретного салона
  const {
    data: salonStatsData,
    isLoading: isLoadingSalonStats,
    error: salonStatsError
  } = useQuery(
    [
      'statistics', 
      'salon', 
      selectedSalon,
      formattedStartDate, 
      formattedEndDate
    ],
    () => statisticsApi.getSalonStatistics(selectedSalon, {
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 минут
      enabled: selectedSalon !== 'all' && selectedSalon !== '', // This is fine as is
      retry: 1,
      refetchOnWindowFocus: false
    }
  );

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleSalonChange = (event) => {
    setSelectedSalon(event.target.value);
  };

  const handleStartDateChange = (date) => {
    setDateRange(prev => ({ ...prev, startDate: date }));
  };

  const handleEndDateChange = (date) => {
    setDateRange(prev => ({ ...prev, endDate: date }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Функция для фильтрации данных отчета по выбранным параметрам
  const getFilteredReportData = () => {
    if (!financialStatsData) return [];
    
    const reportData = financialStatsData.daily_stats.filter(item => {
      const itemDate = new Date(item.date);
      const dateCondition = isWithinInterval(itemDate, {
        start: validStartDate,
        end: validEndDate
      });
      
      const salonCondition = selectedSalon === 'all' || 
                             (item.salon_name && item.salon_name.includes(
                               salons?.find(s => s.id.toString() === selectedSalon)?.name || ''
                             ));
      
      return dateCondition && salonCondition;
    });

    return reportData;
  };

  // Расчет итоговых значений для отчета
  const calculateTotals = (data) => {
    if (!data || data.length === 0) {
      return { appointments_count: 0, revenue: 0 };
    }

    return data.reduce((acc, item) => {
      return {
        appointments_count: acc.appointments_count + (item.appointments_count || 0),
        revenue: acc.revenue + (item.revenue || 0)
      };
    }, { appointments_count: 0, revenue: 0 });
  };

  const filteredReportData = getFilteredReportData();
  const totals = calculateTotals(filteredReportData);

  const isAdmin = user?.role === 'admin';
  const displaySalons = salons || [];

  // Функция для экспорта данных в Excel-совместимый CSV
  const exportToCSV = () => {
    if (!filteredReportData || filteredReportData.length === 0) return;
    
    // Создаем HTML-таблицу для Excel - Excel может открывать HTML как красивую таблицу
    const reportTitle = reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям';
    const salonTitle = selectedSalon === 'all' 
      ? 'Все салоны' 
      : `Салон: ${displaySalons.find(s => s.id.toString() === selectedSalon)?.name || ''}`;
    const dateRangeStr = `Период: ${format(validStartDate, 'dd.MM.yyyy')} - ${format(validEndDate, 'dd.MM.yyyy')}`;
    
    let html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table {border-collapse: collapse; width: 100%; margin-top: 10px;}
          th {background-color: #4472C4; color: white; font-weight: bold; text-align: center; border: 1px solid #2F528F;}
          td {border: 1px solid #B4C6E7; padding: 5px;}
          .header {font-size: 16pt; font-weight: bold; margin-bottom: 10px;}
          .subheader {font-size: 12pt; margin-bottom: 5px;}
          .date {font-size: 10pt; color: #444;}
          .total-row {font-weight: bold; background-color: #EDF2F9;}
          .number {text-align: right;}
          .center {text-align: center;}
        </style>
      </head>
      <body>
        <div class="header">${reportTitle}</div>
        <div class="subheader">${salonTitle}</div>
        <div class="date">${dateRangeStr}</div>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              ${selectedSalon === 'all' ? '<th>Салон</th>' : ''}
              <th>Количество записей</th>
              <th>Завершено</th>
              <th>Отменено</th>
              <th>Выручка (₽)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Добавляем строки данных
    filteredReportData.forEach(row => {
      const date = format(new Date(row.date), 'dd.MM.yyyy');
      html += `
        <tr>
          <td>${date}</td>
          ${selectedSalon === 'all' ? `<td>${row.salon_name || 'Без названия'}</td>` : ''}
          <td class="number">${row.appointments_count || 0}</td>
          <td class="number">${row.completed_count || 0}</td>
          <td class="number">${row.cancelled_count || 0}</td>
          <td class="number">${(row.revenue || 0).toLocaleString('ru-RU')}</td>
        </tr>
      `;
    });
    
    // Добавляем итоговую строку
    const totalCompleted = filteredReportData.reduce((acc, row) => acc + (row.completed_count || 0), 0);
    const totalCancelled = filteredReportData.reduce((acc, row) => acc + (row.cancelled_count || 0), 0);
    
    html += `
          <tr class="total-row">
            <td>Итого</td>
            ${selectedSalon === 'all' ? '<td></td>' : ''}
            <td class="number">${totals.appointments_count || 0}</td>
            <td class="number">${totalCompleted}</td>
            <td class="number">${totalCancelled}</td>
            <td class="number">${(totals.revenue || 0).toLocaleString('ru-RU')}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 20px; font-size: 9pt; color: #666;">
        Отчет сформирован: ${format(new Date(), 'dd.MM.yyyy HH:mm')}
      </div>
      </body>
      </html>
    `;
    
    // Кодируем HTML для скачивания
    const encodedHtml = encodeURIComponent(html);
    const dataUrl = 'data:text/html;charset=utf-8,' + encodedHtml;
    
    // Создаем и активируем ссылку для скачивания
    const link = document.createElement('a');
    link.setAttribute('href', dataUrl);
    
    // Улучшенное имя файла с указанием салона и типа отчета
    const fileNamePrefix = reportType === 'revenue' ? 'Финансовый_отчет' : 'Отчет_по_записям';
    const salonName = selectedSalon === 'all' ? 'Все_салоны' : 
      `Салон_${displaySalons.find(s => s.id.toString() === selectedSalon)?.name.replace(/\s+/g, '_') || 'неизвестный'}`;
    const dateStr = `${format(validStartDate, 'dd-MM-yyyy')}_${format(validEndDate, 'dd-MM-yyyy')}`;
    
    link.setAttribute('download', `${fileNamePrefix}_${salonName}_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Функция для печати только содержимого отчета
  const handlePrint = () => {
    // Проверяем, что мы находимся на вкладке Финансы
    if (tabValue !== 3) {
      console.error('Печать доступна только на вкладке "Финансы"');
      alert('Пожалуйста, перейдите на вкладку "Финансы" для печати отчета');
      return;
    }
    
    // Проверяем доступность данных для печати
    if (!filteredReportData || filteredReportData.length === 0 || !printRef || !printRef.current) {
      console.error('Отсутствуют данные для печати или не найден DOM-элемент');
      alert('Невозможно распечатать отчет. Убедитесь, что в выбранном периоде есть данные.');
      return;
    }
    
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    
    // Создаем стили для печати
    const printStyles = `
      <style>
        @media print {
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 10px; }
          h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:last-child td { font-weight: bold; }
          .print-header { padding-bottom: 15px; border-bottom: 1px solid #ddd; margin-bottom: 15px; }
          .print-footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
          .no-print { display: none !important; }
        }
      </style>
    `;
    
    // Формируем заголовок отчета
    const reportTitle = reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям';
    const salonTitle = selectedSalon === 'all' 
      ? 'Все салоны' 
      : `Салон: ${displaySalons.find(s => s.id.toString() === selectedSalon)?.name || ''}`;
    const dateRange = `Период: ${format(validStartDate, 'dd.MM.yyyy')} - ${format(validEndDate, 'dd.MM.yyyy')}`;
    
    // Создаем содержимое для печати с улучшенной разметкой
    const printContent = `
      <html>
      <head>
        <title>${reportTitle}</title>
        ${printStyles}
      </head>
      <body>
        <div class="print-header">
          <h1>${reportTitle}</h1>
          <p><strong>${salonTitle}</strong></p>
          <p>${dateRange}</p>
        </div>
        <div class="print-content">
          ${printContents}
        </div>
        <div class="print-footer">
          <p>Отчет сформирован: ${format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
          <p>© Система управления салоном красоты</p>
        </div>
      </body>
      </html>
    `;
    
    try {
      // Создаем новое окно для печати вместо замены текущего документа
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для этого сайта, чтобы распечатать отчет.');
        return;
      }
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Запускаем печать после полной загрузки содержимого
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        // Закрываем окно после печати (или через 2 секунды, если пользователь отменил печать)
        setTimeout(function() {
          try {
            printWindow.close();
          } catch (e) {
            console.error('Ошибка при закрытии окна печати:', e);
          }
        }, 2000);
      };
    } catch (error) {
      console.error('Ошибка при печати:', error);
      alert('Произошла ошибка при подготовке документа к печати. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Карточки с ключевыми показателями
  const KeyMetricsCards = () => {
    // Для админа показываем общую статистику, для сотрудника - статистику по его салону
    const statsData = isAdmin ? dashboardData : salonStatsData;
    const isLoading = isAdmin ? isLoadingDashboard : isLoadingSalonStats;
    const error = isAdmin ? dashboardError : salonStatsError;

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 4 }}>
          Ошибка при загрузке данных: {error.message}
        </Alert>
      );
    }

    if (!statsData) {
      return (
        <Alert severity="info" sx={{ mb: 4 }}>
          {isAdmin 
            ? "Выберите период для отображения статистики" 
            : "Выберите салон и период для отображения статистики"
          }
        </Alert>
      );
    }

    // Защитно извлекаем данные статистики с проверками на существование
    const adminStats = isAdmin ? (statsData?.appointment_stats || {}) : {};
    const salonData = !isAdmin ? (statsData?.salon_stats || {}) : {};

    // Безопасно получаем все нужные значения
    const revenue = isAdmin ? (adminStats.revenue || 0) : (salonData.total_revenue || 0);
    const total = isAdmin ? (adminStats.total || 0) : (salonData.total_appointments || 0);
    const completed = isAdmin ? (adminStats.completed || 0) : (salonData.completed_appointments || 0);
    const cancelled = isAdmin ? (adminStats.cancelled || 0) : (salonData.cancelled_appointments || 0);

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Общая выручка</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">
                  {revenue.toLocaleString()} ₽
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Всего записей</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="primary" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">
                  {total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Завершенные</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="success" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">
                  {completed}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>Отмененные</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="error" sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4">
                  {cancelled}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Таблица популярных услуг
  const PopularServicesTable = () => {
    // Для админа показываем общую статистику, для сотрудника - статистику по его салону
    const statsData = isAdmin ? serviceStatsData : salonStatsData;
    
    // Combined loading state:
    // - For admins: check serviceStatsData loading
    // - For employees: check salonStatsData loading
    const isLoading = isAdmin ? isLoadingServiceStats : isLoadingSalonStats;
    
    const error = isAdmin ? serviceStatsError : salonStatsError;

    // Debug logging
    React.useEffect(() => {
      if (statsData) {
        console.log('PopularServicesTable - statsData:', statsData);
        
        if (isAdmin) {
          console.log('Admin services data structure:', {
            services: statsData.services,
            categories: statsData.categories
          });
        } else {
          console.log('Employee salon_stats data structure:', {
            salon_stats: statsData.salon_stats,
            popular_services: statsData.popular_services,
            top_employees: statsData.top_employees
          });
        }
      }
    }, [statsData, isAdmin]);

    if (isLoading) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Популярные услуги" />
          <Divider />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Загрузка данных...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Популярные услуги" />
          <Divider />
          <CardContent>
            <Alert severity="error" sx={{ mb: 4 }}>
              Ошибка при загрузке данных: {error.message}
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (!statsData) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Популярные услуги" />
          <Divider />
          <CardContent>
            <Alert severity="info">
              Нет данных для отображения. Проверьте выбранный период и салон.
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Безопасно получаем массив услуг с проверкой на существование и структуру данных
    const services = isAdmin 
      ? (statsData?.services || [])
      : (statsData?.popular_services || []);

    console.log('Services to display:', services);

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Популярные услуги" />
        <Divider />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Услуга</TableCell>
                  <TableCell align="right">Количество записей</TableCell>
                  <TableCell align="right">Выручка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.length > 0 ? (
                  services.map((service, index) => (
                    <TableRow key={service.id || index}>
                      <TableCell>{service.name || 'Без названия'}</TableCell>
                      <TableCell align="right">
                        {service.booking_count || 0}
                      </TableCell>
                      <TableCell align="right">
                        {((service.revenue || 0).toLocaleString())} ₽
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Нет данных для отображения. Попробуйте выбрать другой период времени.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Таблица лучших сотрудников
  const TopEmployeesTable = () => {
    // Для админа показываем общую статистику, для сотрудника - статистику по его салону
    const statsData = isAdmin ? employeeStatsData : salonStatsData;
    const isLoading = isAdmin ? isLoadingEmployeeStats : isLoadingSalonStats;
    const error = isAdmin ? employeeStatsError : salonStatsError;

    // Debug logging
    React.useEffect(() => {
      if (statsData) {
        console.log('TopEmployeesTable - statsData:', statsData);
        
        if (isAdmin) {
          // Now employeeStatsData is already the array of employees
          console.log('Admin employee stats array:', Array.isArray(statsData), statsData);
        } else {
          console.log('Employee top_employees data structure:', {
            salon_stats: statsData.salon_stats,
            top_employees: statsData.top_employees
          });
        }
      }
    }, [statsData, isAdmin]);

    if (isLoading) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Лучшие сотрудники" />
          <Divider />
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Загрузка данных...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Лучшие сотрудники" />
          <Divider />
          <CardContent>
            <Alert severity="error">
              Ошибка при загрузке данных: {error.message}
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (!statsData) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader title="Лучшие сотрудники" />
          <Divider />
          <CardContent>
            <Alert severity="info">
              Нет данных для отображения. Проверьте выбранный период и салон.
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Безопасно извлекаем данные о сотрудниках - now correctly formatted by the API
    const employees = isAdmin 
      ? (Array.isArray(statsData) ? statsData : [])
      : (statsData?.top_employees || []);

    console.log('Employees to display:', employees);

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Лучшие сотрудники" />
        <Divider />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Сотрудник</TableCell>
                  {isAdmin && <TableCell>Салон</TableCell>}
                  <TableCell align="right">Записей</TableCell>
                  <TableCell align="right">Выручка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees && employees.length > 0 ? (
                  employees.map((employee, index) => (
                    <TableRow key={employee.id || index}>
                      <TableCell>
                        {isAdmin 
                          ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Без имени'
                          : employee.name || 'Без имени'
                        }
                      </TableCell>
                      {isAdmin && (
                        <TableCell>{employee.salon_name || 'Не указан'}</TableCell>
                      )}
                      <TableCell align="right">
                        {isAdmin 
                          ? employee.completed_appointments || 0
                          : employee.appointment_count || 0
                        }
                      </TableCell>
                      <TableCell align="right">
                        {((isAdmin 
                          ? (employee.total_revenue || 0)
                          : (employee.revenue || 0)
                        ).toLocaleString())} ₽
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} align="center">
                      Нет данных для отображения. Попробуйте выбрать другой период времени.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Таблица с результатами отчета
  const ReportTable = () => {
    if (isLoadingFinancialStats) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (financialStatsError) {
      return (
        <Alert severity="error" sx={{ mb: 4 }}>
          Ошибка при загрузке данных: {financialStatsError.message}
        </Alert>
      );
    }

    // Безопасно извлекаем данные отчета
    const safeFilteredReportData = filteredReportData || [];
    const safeTotals = totals || { appointments_count: 0, revenue: 0 };

    if (safeFilteredReportData.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Нет данных для выбранного периода и салона
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        <div ref={printRef}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  {selectedSalon === 'all' && <TableCell>Салон</TableCell>}
                  <TableCell align="right">Количество записей</TableCell>
                  <TableCell align="right">Завершено</TableCell>
                  <TableCell align="right">Отменено</TableCell>
                  <TableCell align="right">Выручка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeFilteredReportData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(row.date), 'dd.MM.yyyy')}</TableCell>
                    {selectedSalon === 'all' && <TableCell>{row.salon_name || 'Без названия'}</TableCell>}
                    <TableCell align="right">{row.appointments_count || 0}</TableCell>
                    <TableCell align="right">{row.completed_count || 0}</TableCell>
                    <TableCell align="right">{row.cancelled_count || 0}</TableCell>
                    <TableCell align="right">{((row.revenue || 0).toLocaleString())} ₽</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ fontWeight: 'bold' }}>
                  <TableCell colSpan={selectedSalon === 'all' ? 2 : 1} sx={{ fontWeight: 'bold' }}>Итого</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{safeTotals.appointments_count || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {safeFilteredReportData.reduce((acc, row) => acc + (row.completed_count || 0), 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {safeFilteredReportData.reduce((acc, row) => acc + (row.cancelled_count || 0), 0)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{((safeTotals.revenue || 0).toLocaleString())} ₽</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    );
  };

  // Форма для создания отчета
  const ReportForm = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel id="report-type-label">Тип отчета</InputLabel>
            <Select
              labelId="report-type-label"
              id="report-type"
              value={reportType}
              label="Тип отчета"
              onChange={handleReportTypeChange}
            >
              <MenuItem value="revenue">Финансовый отчет</MenuItem>
              <MenuItem value="appointments">Отчет по записям</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isAdmin}>
            <InputLabel id="salon-label">Салон</InputLabel>
            <Select
              labelId="salon-label"
              id="salon-select"
              value={selectedSalon}
              label="Салон"
              onChange={handleSalonChange}
            >
              {isAdmin && <MenuItem value="all">Все салоны</MenuItem>}
              {isLoadingSalons ? (
                <MenuItem disabled>Загрузка салонов...</MenuItem>
              ) : (
                displaySalons.map((salon) => (
                  <MenuItem key={salon.id} value={salon.id.toString()}>
                    {salon.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата начала"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата окончания"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              disabled={
                isLoadingFinancialStats || 
                !financialStatsData || 
                (filteredReportData && filteredReportData.length === 0)
              }
              onClick={exportToCSV}
              title="Экспортировать данные в Excel формате"
            >
              Экспорт
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              disabled={
                tabValue !== 3 || // Активируем только на вкладке Финансы
                isLoadingFinancialStats || 
                !financialStatsData || 
                (filteredReportData && filteredReportData.length === 0)
              }
              onClick={handlePrint}
              title={tabValue !== 3 ? 
                "Печать доступна только на вкладке Финансы" : 
                "Распечатать отчет"
              }
            >
              Печать
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Отчеты и статистика
      </Typography>
      
      <ReportForm />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="reports tabs"
        >
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Обзор" 
          />
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            label="Сотрудники" 
          />
          <Tab 
            icon={<SpaIcon />} 
            iconPosition="start" 
            label="Услуги" 
          />
          <Tab 
            icon={<AttachMoneyIcon />}
            iconPosition="start" 
            label="Финансы" 
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <KeyMetricsCards />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PopularServicesTable />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopEmployeesTable />
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Статистика по сотрудникам
        </Typography>
        <TopEmployeesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Статистика по услугам
        </Typography>
        <PopularServicesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          {reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям'}
        </Typography>
        <ReportTable />
      </TabPanel>
    </Box>
  );
};

export default ReportsAndStatistics; 