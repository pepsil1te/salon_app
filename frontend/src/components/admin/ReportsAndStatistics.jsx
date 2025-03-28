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
  CircularProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  AlertTitle
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
  GetApp as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  HelpOutline as HelpOutlineIcon,
  TimelineOutlined as TimelineIcon
} from '@mui/icons-material';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
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
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Добавляем определение мобильного представления
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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

  // Функция для помощи - открывает подсказки
  const toggleHelp = () => {
    setHelpOpen(!helpOpen);
  };

  // Карточки с ключевыми показателями
  const KeyMetricsCards = () => {
    // Для админа показываем общую статистику, для сотрудника - статистику по его салону
    const statsData = isAdmin ? dashboardData : salonStatsData;
    const isLoading = isAdmin ? isLoadingDashboard : isLoadingSalonStats;
    const error = isAdmin ? dashboardError : salonStatsError;

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4, flexDirection: 'column', gap: 2 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Загрузка показателей...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 4 }}>
          <AlertTitle>Ошибка при загрузке данных</AlertTitle>
          {error.message}
        </Alert>
      );
    }

    if (!statsData) {
      return (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '4px solid', borderColor: 'info.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <InfoIcon color="info" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Как начать работу с отчетами
              </Typography>
              <Typography variant="body1" paragraph>
                {isAdmin 
                  ? "Чтобы увидеть статистику, выберите период в форме выше. Вы можете фильтровать данные по типу отчета и салону." 
                  : "Для просмотра статистики выберите период в форме выше. Данные будут показаны для вашего салона."
                }
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                size="small"
                onClick={() => {
                  setDateRange({
                    startDate: subDays(new Date(), 30),
                    endDate: new Date()
                  });
                }}
              >
                Показать данные за последние 30 дней
              </Button>
            </Box>
          </Box>
        </Paper>
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
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1 }}>Общая выручка</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="primary" sx={{ fontSize: isMobile ? 30 : 40, mr: 1 }} />
                <Typography variant={isMobile ? "h5" : "h4"}>
                  {revenue.toLocaleString()} ₽
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1 }}>Всего записей</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="primary" sx={{ fontSize: isMobile ? 30 : 40, mr: 1 }} />
                <Typography variant={isMobile ? "h5" : "h4"}>
                  {total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1 }}>Завершенные</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="success" sx={{ fontSize: isMobile ? 30 : 40, mr: 1 }} />
                <Typography variant={isMobile ? "h5" : "h4"}>
                  {completed}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 1 }}>Отмененные</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon color="error" sx={{ fontSize: isMobile ? 30 : 40, mr: 1 }} />
                <Typography variant={isMobile ? "h5" : "h4"}>
                  {cancelled}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Таблица популярных услуг - модифицированная для мобильных устройств
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

    // Безопасно извлекаем данные об услугах
    const services = isAdmin 
      ? (Array.isArray(serviceStatsData) ? serviceStatsData : [])
      : (salonStatsData?.top_services || []);
      
    // console.log('Services to display:', services);

    if (isMobile) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Популярные услуги</Typography>
              </Box>
            }
            sx={{ pb: 1 }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Загрузка...
                </Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            ) : services.length > 0 ? (
              <List disablePadding>
                {services.map((service, index) => (
                  <React.Fragment key={service.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      sx={{ 
                        py: 1.5, 
                        px: 1,
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {service.name || 'Без названия'}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`${service.booking_count || 0} записей`}
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" align="right" sx={{ alignSelf: 'flex-end' }}>
                        Выручка: {((service.revenue || 0).toLocaleString())} ₽
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <SpaIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  Нет данных о популярных услугах
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Попробуйте выбрать другой период времени или проверьте настройки фильтров.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setDateRange({
                      startDate: subDays(new Date(), 30),
                      endDate: new Date()
                    });
                  }}
                >
                  Показать за последние 30 дней
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Популярные услуги</Typography>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, alignItems: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Загрузка данных об услугах...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Ошибка</AlertTitle>
              {error.message}
            </Alert>
          ) : services.length > 0 ? (
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
                  {services.map((service, index) => (
                    <TableRow key={service.id || index}>
                      <TableCell>{service.name || 'Без названия'}</TableCell>
                      <TableCell align="right">
                        {service.booking_count || 0}
                      </TableCell>
                      <TableCell align="right">
                        {((service.revenue || 0).toLocaleString())} ₽
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <SpaIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Нет данных о популярных услугах
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Возможные причины:
              </Typography>
              <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left', mb: 3 }}>
                <Typography component="div" variant="body2" color="text.secondary">
                  • Выбранный период не содержит данных о записях
                </Typography>
                <Typography component="div" variant="body2" color="text.secondary">
                  • В выбранном салоне пока не было оказано услуг
                </Typography>
                <Typography component="div" variant="body2" color="text.secondary">
                  • Данные ещё не обработаны системой
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => {
                  setDateRange({
                    startDate: subDays(new Date(), 30),
                    endDate: new Date()
                  });
                }}
              >
                Показать за последние 30 дней
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Таблица лучших сотрудников - модифицированная для мобильных устройств
  const TopEmployeesTable = () => {
    // Для админа показываем общую статистику, для сотрудника - статистику по его салону
    const statsData = isAdmin ? employeeStatsData : salonStatsData;
    const isLoading = isAdmin ? isLoadingEmployeeStats : isLoadingSalonStats;
    const error = isAdmin ? employeeStatsError : salonStatsError;

    // Debug logging
    React.useEffect(() => {
      // Отключаем вывод отладочных сообщений в консоль
      // if (statsData) {
      //   console.log('TopEmployeesTable - statsData:', statsData);
      //   
      //   if (isAdmin) {
      //     // Now employeeStatsData is already the array of employees
      //     console.log('Admin employee stats array:', Array.isArray(statsData), statsData);
      //   } else {
      //     console.log('Employee top_employees data structure:', {
      //       salon_stats: statsData.salon_stats,
      //       top_employees: statsData.top_employees
      //     });
      //   }
      // }
    }, [statsData, isAdmin]);

    // Безопасно извлекаем данные о сотрудниках
    const employees = isAdmin 
      ? (Array.isArray(statsData) ? statsData : [])
      : (statsData?.top_employees || []);

    // console.log('Employees to display:', employees);

    if (isMobile) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Лучшие сотрудники</Typography>
              </Box>
            }
            sx={{ pb: 1 }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 1 : 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Загрузка...
                </Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            ) : employees && employees.length > 0 ? (
              <List disablePadding>
                {employees.map((employee, index) => (
                  <React.Fragment key={employee.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      sx={{ 
                        py: 1.5, 
                        px: 1,
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                          {isAdmin 
                            ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Без имени'
                            : employee.name || 'Без имени'
                          }
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`${isAdmin 
                            ? employee.completed_appointments || 0
                            : employee.appointment_count || 0} записей`}
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      {isAdmin && (
                        <Typography variant="body2" color="text.secondary">
                          Салон: {employee.salon_name || 'Не указан'}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" align="right" sx={{ alignSelf: 'flex-end' }}>
                        Выручка: {((isAdmin 
                          ? (employee.total_revenue || 0)
                          : (employee.revenue || 0)
                        ).toLocaleString())} ₽
                      </Typography>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  Нет данных о лучших сотрудниках
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Попробуйте выбрать другой период времени или проверьте настройки фильтров.
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setDateRange({
                      startDate: subDays(new Date(), 30),
                      endDate: new Date()
                    });
                  }}
                >
                  Показать за последние 30 дней
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Лучшие сотрудники</Typography>
            </Box>
          }
        />
        <Divider />
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3, alignItems: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Загрузка данных о сотрудниках...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Ошибка</AlertTitle>
              {error.message}
            </Alert>
          ) : employees && employees.length > 0 ? (
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
                  {employees.map((employee, index) => (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Нет данных о лучших сотрудниках
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Возможные причины:
              </Typography>
              <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'left', mb: 3 }}>
                <Typography component="div" variant="body2" color="text.secondary">
                  • Выбранный период не содержит данных о записях
                </Typography>
                <Typography component="div" variant="body2" color="text.secondary">
                  • В выбранном салоне еще не было завершенных записей
                </Typography>
                <Typography component="div" variant="body2" color="text.secondary">
                  • Данные еще не обработаны системой
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => {
                  setDateRange({
                    startDate: subDays(new Date(), 30),
                    endDate: new Date()
                  });
                }}
              >
                Показать за последние 30 дней
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Таблица с результатами отчета - адаптированная для мобильных устройств
  const ReportTable = () => {
    if (isLoadingFinancialStats) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 4, flexDirection: 'column', gap: 2 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Загрузка финансовых данных...
          </Typography>
        </Box>
      );
    }

    if (financialStatsError) {
      return (
        <Alert severity="error" sx={{ mb: 4 }}>
          <AlertTitle>Ошибка при загрузке данных</AlertTitle>
          {financialStatsError.message}
        </Alert>
      );
    }

    // Безопасно извлекаем данные отчета
    const safeFilteredReportData = filteredReportData || [];
    const safeTotals = totals || { appointments_count: 0, revenue: 0 };

    if (safeFilteredReportData.length === 0) {
      return (
        <Paper sx={{ p: 3, mb: 4, borderLeft: '4px solid', borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <InfoIcon color="warning" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Нет данных для выбранного периода
              </Typography>
              <Typography variant="body1" paragraph>
                Для выбранного периода и салона не найдено финансовых данных. Попробуйте изменить параметры отчета.
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1 
              }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => {
                    setDateRange({
                      startDate: startOfMonth(new Date()),
                      endDate: endOfMonth(new Date())
                    });
                  }}
                >
                  Текущий месяц
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => {
                    setDateRange({
                      startDate: subDays(new Date(), 30),
                      endDate: new Date()
                    });
                  }}
                >
                  Последние 30 дней
                </Button>
                {isAdmin && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    onClick={() => {
                      setSelectedSalon('all');
                    }}
                    disabled={selectedSalon === 'all'}
                  >
                    Все салоны
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

    const totalCompleted = safeFilteredReportData.reduce((acc, row) => acc + (row.completed_count || 0), 0);
    const totalCancelled = safeFilteredReportData.reduce((acc, row) => acc + (row.cancelled_count || 0), 0);
    
    if (isMobile) {
      return (
        <Box sx={{ mt: 3 }}>
          <div ref={printRef}>
            <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden', borderRadius: 1 }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'primary.main', 
                color: 'primary.contrastText',
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4
              }}>
                <Typography variant="h6">Итоговые данные</Typography>
                <Typography variant="body2">
                  {format(validStartDate, 'dd.MM.yyyy')} - {format(validEndDate, 'dd.MM.yyyy')}
                </Typography>
              </Box>
              <List disablePadding>
                <ListItem divider>
                  <ListItemText primary="Всего записей" />
                  <Typography variant="body1" fontWeight="medium">
                    {safeTotals.appointments_count || 0}
                  </Typography>
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="Завершено"
                    secondary={`${Math.round((totalCompleted / (safeTotals.appointments_count || 1)) * 100)}% от общего числа`}
                  />
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    {totalCompleted}
                  </Typography>
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="Отменено"
                    secondary={`${Math.round((totalCancelled / (safeTotals.appointments_count || 1)) * 100)}% от общего числа`}
                  />
                  <Typography variant="body1" fontWeight="medium" color="error.main">
                    {totalCancelled}
                  </Typography>
                </ListItem>
                <ListItem sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <ListItemText 
                    primary="Общая выручка" 
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {((safeTotals.revenue || 0).toLocaleString())} ₽
                  </Typography>
                </ListItem>
              </List>
            </Paper>
            
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 4 }}>
              <EventIcon sx={{ mr: 1 }} />
              Детализация по дням
            </Typography>
            
            {safeFilteredReportData.map((row, index) => (
              <Accordion key={index} sx={{ mb: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {format(new Date(row.date), 'dd.MM.yyyy')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {row.appointments_count || 0} записей
                      </Typography>
                      <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                        {((row.revenue || 0).toLocaleString())} ₽
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <List disablePadding>
                    {selectedSalon === 'all' && (
                      <ListItem sx={{ py: 1 }}>
                        <ListItemText primary="Салон" />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {row.salon_name || 'Без названия'}
                        </Typography>
                      </ListItem>
                    )}
                    <ListItem sx={{ py: 1 }}>
                      <ListItemText primary="Количество записей" />
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {row.appointments_count || 0}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemText primary="Завершено" />
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                        {row.completed_count || 0}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemText primary="Отменено" />
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                        {row.cancelled_count || 0}
                      </Typography>
                    </ListItem>
                    <ListItem sx={{ py: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                      <ListItemText primary="Выручка" primaryTypographyProps={{ fontWeight: 'bold' }} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {((row.revenue || 0).toLocaleString())} ₽
                      </Typography>
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        <div ref={printRef}>
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям'}
                </Typography>
                <Typography variant="body1">
                  Период: {format(validStartDate, 'dd.MM.yyyy')} - {format(validEndDate, 'dd.MM.yyyy')}
                </Typography>
                {selectedSalon !== 'all' && (
                  <Typography variant="body1">
                    Салон: {displaySalons.find(s => s.id.toString() === selectedSalon)?.name || 'Неизвестный салон'}
                  </Typography>
                )}
              </Box>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                borderLeft: '1px solid',
                borderColor: 'divider',
                pl: 3
              }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Всего записей:</strong> {safeTotals.appointments_count || 0}
                </Typography>
                <Typography variant="body1" gutterBottom color="success.main">
                  <strong>Завершено:</strong> {totalCompleted} ({Math.round((totalCompleted / (safeTotals.appointments_count || 1)) * 100)}%)
                </Typography>
                <Typography variant="body1" gutterBottom color="error.main">
                  <strong>Отменено:</strong> {totalCancelled} ({Math.round((totalCancelled / (safeTotals.appointments_count || 1)) * 100)}%)
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  <strong>Общая выручка:</strong> {((safeTotals.revenue || 0).toLocaleString())} ₽
                </Typography>
              </Box>
            </Box>
          </Paper>
        
          <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 1 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                  <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Дата</TableCell>
                  {selectedSalon === 'all' && <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Салон</TableCell>}
                  <TableCell align="right" sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Количество записей</TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Завершено</TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Отменено</TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.primary.contrastText, fontWeight: 'bold' }}>Выручка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeFilteredReportData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{format(new Date(row.date), 'dd.MM.yyyy')}</TableCell>
                    {selectedSalon === 'all' && <TableCell>{row.salon_name || 'Без названия'}</TableCell>}
                    <TableCell align="right">{row.appointments_count || 0}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{row.completed_count || 0}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{row.cancelled_count || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{((row.revenue || 0).toLocaleString())} ₽</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell colSpan={selectedSalon === 'all' ? 2 : 1} sx={{ fontWeight: 'bold' }}>Итого</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{safeTotals.appointments_count || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {totalCompleted}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {totalCancelled}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>{((safeTotals.revenue || 0).toLocaleString())} ₽</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    );
  };

  // Форма для создания отчета - адаптированная для мобильных устройств
  const ReportForm = () => (
    <Paper 
      sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 3,
        borderTop: '4px solid',
        borderColor: 'primary.main',
      }}
      elevation={2}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <TimelineIcon sx={{ mr: 1 }} /> 
        Параметры отчета
        <IconButton 
          size="small" 
          sx={{ ml: 1 }} 
          onClick={toggleHelp}
          aria-label="Показать справку"
        >
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Typography>
      
      {helpOpen && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Как работать с отчетами</AlertTitle>
          <Typography variant="body2" paragraph>
            1. Выберите тип отчета (финансовый или по записям)
          </Typography>
          <Typography variant="body2" paragraph>
            2. {isAdmin ? "Выберите салон или 'Все салоны'" : "Отчет показывается для вашего салона"}
          </Typography>
          <Typography variant="body2" paragraph>
            3. Укажите период (начальная и конечная даты)
          </Typography>
          <Typography variant="body2">
            4. Используйте вкладки ниже для просмотра разных типов статистики
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={isMobile ? 2 : 3} alignItems="center">
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
          <FormControl fullWidth disabled={!isAdmin} size={isMobile ? "small" : "medium"}>
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
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: isMobile ? "small" : "medium" 
                } 
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={6} md={2}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата окончания"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              slotProps={{ 
                textField: { 
                  fullWidth: true, 
                  size: isMobile ? "small" : "medium" 
                } 
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Stack 
            direction={isMobile ? "row" : "row"} 
            spacing={1} 
            justifyContent={{ xs: 'space-between', md: 'flex-end' }}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              size={isMobile ? "small" : "medium"}
              disabled={
                isLoadingFinancialStats || 
                !financialStatsData || 
                (filteredReportData && filteredReportData.length === 0)
              }
              onClick={exportToCSV}
              title="Экспортировать данные в Excel формате"
            >
              {isMobile ? "Excel" : "Экспорт в Excel"}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              size={isMobile ? "small" : "medium"}
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
              {isMobile ? "Печать" : "Печать отчета"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          color="primary"
          startIcon={<EventIcon />}
          size="small"
          onClick={() => {
            setDateRange({
              startDate: startOfMonth(new Date()),
              endDate: endOfMonth(new Date())
            });
          }}
          sx={{ mr: 1 }}
        >
          Текущий месяц
        </Button>
        <Button
          color="primary"
          startIcon={<EventIcon />}
          size="small"
          onClick={() => {
            setDateRange({
              startDate: subDays(new Date(), 7),
              endDate: new Date()
            });
          }}
          sx={{ mr: 1 }}
        >
          Последние 7 дней
        </Button>
        <Button
          color="primary"
          startIcon={<EventIcon />}
          size="small"
          onClick={() => {
            setDateRange({
              startDate: subDays(new Date(), 30),
              endDate: new Date()
            });
          }}
        >
          Последние 30 дней
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Box>
      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        gutterBottom
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1,
          mb: 3
        }}
      >
        <BarChartIcon sx={{ mr: 1 }} />
        Отчеты и статистика
      </Typography>
      
      <ReportForm />
      
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        mb: 3,
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="reports tabs"
          centered={!isMobile}
          sx={{
            '& .MuiTab-root': {
              minHeight: isMobile ? '60px' : '72px',
              minWidth: isMobile ? '80px' : '120px',
            }
          }}
        >
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition={isMobile ? "top" : "start"} 
            label={isMobile ? "Обзор" : "Обзор"} 
            aria-label="Обзор"
          />
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition={isMobile ? "top" : "start"} 
            label={isMobile ? "Сотрудники" : "Сотрудники"} 
            aria-label="Сотрудники"
          />
          <Tab 
            icon={<SpaIcon />} 
            iconPosition={isMobile ? "top" : "start"} 
            label={isMobile ? "Услуги" : "Услуги"} 
            aria-label="Услуги"
          />
          <Tab 
            icon={<AttachMoneyIcon />}
            iconPosition={isMobile ? "top" : "start"} 
            label={isMobile ? "Финансы" : "Финансы"} 
            aria-label="Финансы"
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <KeyMetricsCards />
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} md={6}>
            <PopularServicesTable />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopEmployeesTable />
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          gutterBottom
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mb: 2
          }}
        >
          <PeopleIcon sx={{ mr: 1 }} />
          Статистика по сотрудникам
        </Typography>
        <TopEmployeesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          gutterBottom
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mb: 2
          }}
        >
          <SpaIcon sx={{ mr: 1 }} />
          Статистика по услугам
        </Typography>
        <PopularServicesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          gutterBottom
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mb: 2
          }}
        >
          <AttachMoneyIcon sx={{ mr: 1 }} />
          {reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям'}
        </Typography>
        <ReportTable />
      </TabPanel>
    </Box>
  );
};

export default ReportsAndStatistics; 