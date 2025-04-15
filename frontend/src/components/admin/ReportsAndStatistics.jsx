import React, { useState, useRef, useEffect } from 'react';
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
  AlertTitle,
  alpha
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
  TimelineOutlined as TimelineIcon,
  Close as CloseIcon
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

const ReportsAndStatistics = ({ salonId, reportType: initialReportType }) => {
  const { user } = useAuthContext();
  const [reportType, setReportType] = useState(initialReportType || 'revenue');
  const [selectedSalon, setSelectedSalon] = useState(
    salonId ? salonId.toString() : 
    user?.role === 'admin' ? 'all' : (user?.salon_id?.toString() || '')
  );
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

  // Градиенты и стили для UI компонентов
  const primaryGradient = 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)';
  const secondaryGradient = 'linear-gradient(90deg, #FF8E53 0%, #FE6B8B 100%)';
  const infoGradient = 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)';
  const successGradient = 'linear-gradient(90deg, #00b09b 0%, #96c93d 100%)';
  
  const cardBoxShadow = '0 8px 24px rgba(149, 157, 165, 0.2)';
  const buttonShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
  const hoverTransform = 'translateY(-3px)';

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

  // Effect to update state when props change
  useEffect(() => {
    console.log('ReportsAndStatistics props:', { salonId, initialReportType });
    
    // Update salon selection if salonId prop changes
    if (salonId) {
      console.log('Setting selected salon from props:', salonId);
      setSelectedSalon(salonId.toString());
    }
    
    // Update report type if initialReportType prop changes
    if (initialReportType) {
      console.log('Setting report type from props:', initialReportType);
      setReportType(initialReportType);
      
      // Also set the appropriate tab based on report type
      if (initialReportType === 'revenue') {
        setTabValue(0); // Financial tab
      } else if (initialReportType === 'appointments') {
        setTabValue(2); // Services tab or appointments tab
      }
    }
  }, [salonId, initialReportType]);

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
    // Формируем заголовок отчета
    const reportTitle = reportType === 'revenue' ? 'Финансовый отчет' : 'Отчет по записям';
    const salonTitle = selectedSalon === 'all' 
      ? 'Все салоны' 
      : `Салон: ${displaySalons.find(s => s.id.toString() === selectedSalon)?.name || ''}`;
    const dateRange = `Период: ${format(validStartDate, 'dd.MM.yyyy')} - ${format(validEndDate, 'dd.MM.yyyy')}`;
    const currentDate = format(new Date(), 'dd.MM.yyyy HH:mm');
    
    // Создаем расширенные стили для печати
    const printStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        @page {
          size: A4;
          margin: 1.5cm;
        }
        
        body {
          font-family: 'Roboto', Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
          line-height: 1.5;
          font-size: 11pt;
        }
        
        .container {
          max-width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #6a11cb;
        }
        
        .header h1 {
          font-size: 22pt;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #6a11cb;
        }
        
        .header .info {
          font-size: 11pt;
          color: #555;
        }
        
        .summary-box {
          background-color: #f8f9fc;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
          border-left: 4px solid #6a11cb;
        }
        
        .summary-title {
          font-size: 14pt;
          font-weight: 500;
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .summary-label {
          font-weight: 500;
          color: #555;
        }
        
        .summary-value {
          font-weight: 700;
        }
        
        .success-text {
          color: #0caa41;
        }
        
        .error-text {
          color: #e53935;
        }
        
        .highlight-text {
          color: #6a11cb;
          font-size: 14pt;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          font-size: 10pt;
        }
        
        thead {
          background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
          color: white;
        }
        
        th {
          padding: 12px 15px;
          font-weight: 700;
          text-align: left;
          border: none;
        }
        
        td {
          padding: 10px 15px;
          border-bottom: 1px solid #ddd;
        }
        
        tr:nth-child(even) {
          background-color: #f8f9fc;
        }
        
        tr:hover {
          background-color: #f1f1fe;
        }
        
        .total-row {
          background-color: #f0f4ff !important;
          font-weight: 700;
        }
        
        .total-row td {
          border-top: 2px solid #6a11cb;
          border-bottom: none;
          padding-top: 15px;
        }
        
        .number-cell {
          text-align: right;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 9pt;
          color: #777;
          text-align: center;
          page-break-inside: avoid;
        }
        
        .company-info {
          font-weight: 500;
          margin-bottom: 5px;
        }
        
        .print-date {
          font-style: italic;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;
    
    // Рассчитываем итоги для отображения
    const totalCompleted = filteredReportData.reduce((acc, row) => acc + (row.completed_count || 0), 0);
    const totalCancelled = filteredReportData.reduce((acc, row) => acc + (row.cancelled_count || 0), 0);
    const completionRate = Math.round((totalCompleted / (totals.appointments_count || 1)) * 100);
    const cancellationRate = Math.round((totalCancelled / (totals.appointments_count || 1)) * 100);
    
    // Составляем HTML таблицу с данными
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            ${selectedSalon === 'all' ? '<th>Салон</th>' : ''}
            <th class="number-cell">Записей</th>
            <th class="number-cell">Завершено</th>
            <th class="number-cell">Отменено</th>
            <th class="number-cell">Выручка</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    filteredReportData.forEach((row) => {
      tableHTML += `
        <tr>
          <td>${format(new Date(row.date), 'dd.MM.yyyy')}</td>
          ${selectedSalon === 'all' ? `<td>${row.salon_name || 'Без названия'}</td>` : ''}
          <td class="number-cell">${row.appointments_count || 0}</td>
          <td class="number-cell success-text">${row.completed_count || 0}</td>
          <td class="number-cell error-text">${row.cancelled_count || 0}</td>
          <td class="number-cell">${(row.revenue || 0).toLocaleString('ru-RU')} ₽</td>
        </tr>
      `;
    });
    
    // Добавляем итоговую строку
    tableHTML += `
        <tr class="total-row">
          <td>${selectedSalon === 'all' ? 'Итого по всем салонам' : 'Итого'}</td>
          ${selectedSalon === 'all' ? '<td></td>' : ''}
          <td class="number-cell">${totals.appointments_count || 0}</td>
          <td class="number-cell success-text">${totalCompleted}</td>
          <td class="number-cell error-text">${totalCancelled}</td>
          <td class="number-cell highlight-text">${(totals.revenue || 0).toLocaleString('ru-RU')} ₽</td>
        </tr>
      </tbody>
    </table>
    `;
    
    // Создаем содержимое для печати
    const printContent = `
      <html>
      <head>
        <title>${reportTitle}</title>
        <meta charset="UTF-8">
        ${printStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
          <h1>${reportTitle}</h1>
            <div class="info">${salonTitle}</div>
            <div class="info">${dateRange}</div>
        </div>
          
          <div class="summary-box">
            <div class="summary-title">Сводная информация</div>
            <div class="summary-row">
              <div class="summary-label">Всего записей:</div>
              <div class="summary-value">${totals.appointments_count || 0}</div>
        </div>
            <div class="summary-row">
              <div class="summary-label">Завершено записей:</div>
              <div class="summary-value success-text">${totalCompleted} (${completionRate}%)</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Отменено записей:</div>
              <div class="summary-value error-text">${totalCancelled} (${cancellationRate}%)</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Общая выручка:</div>
              <div class="summary-value highlight-text">${(totals.revenue || 0).toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
          
          ${tableHTML}
          
          <div class="footer">
            <div class="company-info">BEAUTY SALON MANAGER</div>
            <div class="print-date">Отчет сформирован: ${currentDate}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Создаем новое окно для печати
      const printWindow = window.open('', '_blank');
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Запускаем печать после полной загрузки содержимого
      printWindow.onload = function() {
        printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // Закрываем окно после печати (или через 2 секунды, если пользователь отменил печать)
        setTimeout(() => {
          try {
            printWindow.close();
          } catch (e) {
            console.error('Ошибка при закрытии окна печати:', e);
          }
        }, 2000);
      }, 500);
      };
  };

  // Функция для помощи - открывает подсказки
  const toggleHelp = () => {
    setHelpOpen(!helpOpen);
  };

  // KeyMetricsCards с улучшенным дизайном
  const KeyMetricsCards = () => {
    const isLoading = isLoadingDashboard || isLoadingFinancialStats || isLoadingSalonStats;
    const error = dashboardError || financialStatsError || salonStatsError;
    
    const data = selectedSalon === 'all' 
      ? dashboardData 
      : salonStatsData;
    
    const financialData = financialStatsData || {};

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Ошибка загрузки данных</AlertTitle>
          Не удалось загрузить метрики. Попробуйте позже.
        </Alert>
      );
    }

    const metrics = [
      {
        title: 'Общая выручка',
        value: financialData.totalRevenue || 0,
        format: (val) => `${val.toLocaleString('ru-RU')} ₽`,
        icon: <AttachMoneyIcon />,
        gradient: primaryGradient,
        change: financialData.revenueChange || 0
      },
      {
        title: 'Количество записей',
        value: data?.totalAppointments || 0,
        format: (val) => val.toLocaleString('ru-RU'),
        icon: <EventIcon />,
        gradient: secondaryGradient,
        change: data?.appointmentsChange || 0
      },
      {
        title: 'Средний чек',
        value: financialData.averageOrderValue || 0,
        format: (val) => `${val.toLocaleString('ru-RU')} ₽`,
        icon: <PieChartIcon />,
        gradient: infoGradient,
        change: financialData.aovChange || 0
      },
      {
        title: 'Загруженность',
        value: data?.occupancyRate || 0,
        format: (val) => `${val}%`,
        icon: <TimelineIcon />,
        gradient: successGradient,
        change: data?.occupancyChange || 0
      }
    ];
    
      return (
      <Grid container spacing={3}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                borderRadius: 3,
                boxShadow: cardBoxShadow,
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: hoverTransform,
                  boxShadow: '0 12px 28px rgba(149, 157, 165, 0.3)'
                }
              }}
            >
              <Box 
                sx={{ 
                  background: metric.gradient, 
                  py: 1.5, 
                  px: 2, 
                  borderTopLeftRadius: 12, 
                  borderTopRightRadius: 12
                }}
              >
                <Typography variant="subtitle1" color="white" sx={{ fontWeight: 'bold' }}>
                  {metric.title}
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {metric.format(metric.value)}
                </Typography>
                    {metric.change !== undefined && (
                      <Chip 
                        label={`${metric.change >= 0 ? '+' : ''}${metric.change}%`} 
                        size="small"
                        color={metric.change >= 0 ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold' }}
                      />
                    )}
              </Box>
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: theme.palette.background.paper,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      color: theme.palette.primary.main
                    }}
                  >
                    {metric.icon}
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        ))}
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

    // Безопасно извлекаем данные об услугах
    const services = isAdmin 
      ? (Array.isArray(serviceStatsData) ? serviceStatsData : [])
      : (salonStatsData?.top_services || []);

    if (isMobile) {
      return (
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: cardBoxShadow,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              py: 2, 
              px: 2.5, 
              background: secondaryGradient,
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <SpaIcon sx={{ mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Популярные услуги
            </Typography>
              </Box>
          
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Ошибка загрузки данных
              </Alert>
            ) : services.length > 0 ? (
              <List disablePadding>
                {services.map((service, index) => (
                  <React.Fragment key={service.id || index}>
                    {index > 0 && <Divider />}
                    <ListItem 
                      sx={{ 
                        py: 2, 
                        px: 2.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {service.name || 'Без названия'}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={`${service.booking_count || 0} записей`}
                            sx={{ 
                              fontWeight: 'bold',
                              background: `${secondaryGradient}`,
                              color: 'white' 
                            }}
                        />
                      </Box>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Категория: {service.category || 'Без категории'}
                      </Typography>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.primary.main
                            }}
                          >
                            {((service.revenue || 0).toLocaleString('ru-RU'))} ₽
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <SpaIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Нет данных об услугах
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Попробуйте изменить период времени
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
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
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: cardBoxShadow,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            py: 2, 
            px: 3, 
            background: secondaryGradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <SpaIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Популярные услуги
          </Typography>
            </Box>
        
        <Divider />
        
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 3 }}>
              <AlertTitle>Ошибка загрузки данных</AlertTitle>
              {error.message}
            </Alert>
          ) : services.length > 0 ? (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Услуга
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Категория
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Количество записей
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Выручка
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow 
                      key={service.id || index}
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {service.name || 'Без названия'}
                      </TableCell>
                      <TableCell align="center">
                        {service.category || 'Без категории'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={service.booking_count || 0}
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            background: `${secondaryGradient}`,
                            color: 'white' 
                          }}
                        />
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main
                        }}
                      >
                        {((service.revenue || 0).toLocaleString('ru-RU'))} ₽
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <SpaIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Нет данных о популярных услугах
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Попробуйте выбрать другой период времени
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 1,
                  background: secondaryGradient,
                  borderRadius: 2,
                  boxShadow: buttonShadow,
                  '&:hover': {
                    background: secondaryGradient,
                    transform: hoverTransform,
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
                  }
                }}
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

    // Безопасно извлекаем данные о сотрудниках
    const employees = isAdmin 
      ? (Array.isArray(statsData) ? statsData : [])
      : (statsData?.top_employees || []);

    if (isMobile) {
      return (
        <Card 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            boxShadow: cardBoxShadow,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              py: 2, 
              px: 2.5, 
              background: infoGradient,
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <PeopleIcon sx={{ mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Лучшие сотрудники
            </Typography>
              </Box>
          
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                Ошибка загрузки данных
              </Alert>
            ) : employees && employees.length > 0 ? (
              <List disablePadding>
                {employees.map((employee, index) => (
                  <React.Fragment key={employee.id || index}>
                    {index > 0 && <Divider />}
                    <ListItem 
                      sx={{ 
                        py: 2, 
                        px: 2.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
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
                            sx={{ 
                              fontWeight: 'bold',
                              background: `${infoGradient}`,
                              color: 'white' 
                            }}
                        />
                      </Box>
                      {isAdmin && (
                        <Typography variant="body2" color="text.secondary">
                          Салон: {employee.salon_name || 'Не указан'}
                        </Typography>
                      )}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {employee.position || 'Сотрудник'}
                          </Typography>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.primary.main
                            }}
                          >
                            {((isAdmin 
                          ? (employee.total_revenue || 0)
                          : (employee.revenue || 0)
                            ).toLocaleString('ru-RU'))} ₽
                      </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Нет данных о сотрудниках
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Попробуйте изменить период времени
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
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
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: cardBoxShadow,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            py: 2, 
            px: 3, 
            background: infoGradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <PeopleIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Лучшие сотрудники
          </Typography>
            </Box>
        
        <Divider />
        
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: theme.palette.primary.main }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 3 }}>
              <AlertTitle>Ошибка загрузки данных</AlertTitle>
              {error.message}
            </Alert>
          ) : employees && employees.length > 0 ? (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Сотрудник
                    </TableCell>
                    {isAdmin && (
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold',
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.primary.dark, 0.8) 
                            : alpha(theme.palette.primary.light, 0.1)  
                        }}
                      >
                        Салон
                      </TableCell>
                    )}
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Должность
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Записей
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 'bold',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.8) 
                          : alpha(theme.palette.primary.light, 0.1)  
                      }}
                    >
                      Выручка
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee, index) => (
                    <TableRow 
                      key={employee.id || index}
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {isAdmin 
                          ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Без имени'
                          : employee.name || 'Без имени'
                        }
                      </TableCell>
                      {isAdmin && (
                        <TableCell>{employee.salon_name || 'Не указан'}</TableCell>
                      )}
                      <TableCell align="center">
                        {employee.position || 'Сотрудник'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={isAdmin 
                          ? employee.completed_appointments || 0
                          : employee.appointment_count || 0
                        }
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            background: `${infoGradient}`,
                            color: 'white' 
                          }}
                        />
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main
                        }}
                      >
                        {((isAdmin 
                          ? (employee.total_revenue || 0)
                          : (employee.revenue || 0)
                        ).toLocaleString('ru-RU'))} ₽
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Нет данных о лучших сотрудниках
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Попробуйте выбрать другой период времени
              </Typography>
              <Button 
                variant="contained" 
                sx={{ 
                  mt: 1,
                  background: infoGradient,
                  borderRadius: 2,
                  boxShadow: buttonShadow,
                  '&:hover': {
                    background: infoGradient,
                    transform: hoverTransform,
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
                  }
                }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      );
    }

    if (financialStatsError) {
      return (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: cardBoxShadow 
          }}
        >
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
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: 'linear-gradient(145deg, #f9f9f9 0%, #ffffff 100%)',
            boxShadow: cardBoxShadow,
            borderLeft: '4px solid',
            borderColor: 'warning.main' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <InfoIcon color="warning" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                  variant="contained" 
                  size="small"
                  sx={{ 
                    background: primaryGradient,
                    borderRadius: 2,
                    boxShadow: buttonShadow,
                    '&:hover': {
                      background: primaryGradient,
                      transform: hoverTransform,
                      boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
                    }
                  }}
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
                  variant="contained" 
                  size="small"
                  sx={{ 
                    background: secondaryGradient,
                    borderRadius: 2,
                    boxShadow: buttonShadow,
                    '&:hover': {
                      background: secondaryGradient,
                      transform: hoverTransform,
                      boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
                    }
                  }}
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
                    sx={{
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
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
            <Card 
              sx={{ 
                mb: 4, 
                borderRadius: 3,
                boxShadow: cardBoxShadow,
                overflow: 'hidden'
              }}
            >
              <Box 
                sx={{ 
                  p: 2, 
                  background: primaryGradient,
                  color: 'white',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Итоговые данные</Typography>
                <Typography variant="body2">
                  {format(validStartDate, 'dd.MM.yyyy')} - {format(validEndDate, 'dd.MM.yyyy')}
                </Typography>
              </Box>
              
              <List disablePadding>
                <ListItem 
                  divider 
                  sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <ListItemText primary="Всего записей" />
                  <Typography variant="body1" fontWeight="medium">
                    {safeTotals.appointments_count || 0}
                  </Typography>
                </ListItem>
                <ListItem 
                  divider
                  sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <ListItemText 
                    primary="Завершено"
                    secondary={`${Math.round((totalCompleted / (safeTotals.appointments_count || 1)) * 100)}% от общего числа`}
                  />
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    {totalCompleted}
                  </Typography>
                </ListItem>
                <ListItem 
                  divider
                  sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <ListItemText 
                    primary="Отменено"
                    secondary={`${Math.round((totalCancelled / (safeTotals.appointments_count || 1)) * 100)}% от общего числа`}
                  />
                  <Typography variant="body1" fontWeight="medium" color="error.main">
                    {totalCancelled}
                  </Typography>
                </ListItem>
                <ListItem sx={{ 
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.08)
                  }
                }}>
                  <ListItemText 
                    primary="Общая выручка" 
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      background: primaryGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {((safeTotals.revenue || 0).toLocaleString('ru-RU'))} ₽
                  </Typography>
                </ListItem>
              </List>
            </Card>
            
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 4,
                mb: 2,
                fontWeight: 'bold' 
              }}
            >
              <EventIcon sx={{ mr: 1 }} />
              Детализация по дням
            </Typography>
            
            {safeFilteredReportData.map((row, index) => (
              <Accordion 
                key={index} 
                sx={{ 
                  mb: 1, 
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  '&:before': {
                    display: 'none'
                  },
                  '&.Mui-expanded': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    background: 'linear-gradient(90deg, rgba(103, 58, 183, 0.05) 0%, rgba(255,255,255,0) 100%)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {format(new Date(row.date), 'dd.MM.yyyy')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {row.appointments_count || 0} записей
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main
                        }}
                      >
                        {((row.revenue || 0).toLocaleString('ru-RU'))} ₽
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
                    <ListItem sx={{ py: 1, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <ListItemText primary="Выручка" primaryTypographyProps={{ fontWeight: 'bold' }} />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: theme.palette.primary.main 
                        }}
                      >
                        {((row.revenue || 0).toLocaleString('ru-RU'))} ₽
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
          <Card 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              boxShadow: cardBoxShadow
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                background: 'linear-gradient(145deg, rgba(103, 58, 183, 0.05) 0%, rgba(255,255,255,0) 100%)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
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
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    sx={{ 
                      background: primaryGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    <strong>Общая выручка:</strong> {((safeTotals.revenue || 0).toLocaleString('ru-RU'))} ₽
                </Typography>
              </Box>
            </Box>
            </Box>
          </Card>
        
          <TableContainer 
            component={Card} 
            sx={{ 
              borderRadius: 3,
              boxShadow: cardBoxShadow,
              overflow: 'hidden' 
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: primaryGradient }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Дата</TableCell>
                  {selectedSalon === 'all' && <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Салон</TableCell>}
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Количество записей</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Завершено</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Отменено</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Выручка</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeFilteredReportData.map((row, index) => (
                  <TableRow 
                    key={index} 
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>{format(new Date(row.date), 'dd.MM.yyyy')}</TableCell>
                    {selectedSalon === 'all' && <TableCell>{row.salon_name || 'Без названия'}</TableCell>}
                    <TableCell align="right">{row.appointments_count || 0}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{row.completed_count || 0}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{row.cancelled_count || 0}</TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.primary.main
                      }}
                    >
                      {((row.revenue || 0).toLocaleString('ru-RU'))} ₽
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.dark, 0.15) 
                    : alpha(theme.palette.primary.light, 0.15)  
                }}>
                  <TableCell colSpan={selectedSalon === 'all' ? 2 : 1} sx={{ fontWeight: 'bold' }}>Итого</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{safeTotals.appointments_count || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {totalCompleted}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {totalCancelled}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      background: primaryGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {((safeTotals.revenue || 0).toLocaleString('ru-RU'))} ₽
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    );
  };

  // Обновленный ReportForm с современным дизайном
  const ReportForm = () => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, rgba(27,27,27,1) 0%, rgba(40,40,40,1) 100%)' 
          : 'linear-gradient(145deg, #f9f9f9 0%, #ffffff 100%)',
        boxShadow: cardBoxShadow
      }}
    >
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        alignItems={{ xs: 'stretch', md: 'flex-end' }}
      >
        {user?.role === 'admin' && (
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel id="salon-select-label">Салон</InputLabel>
            <Select
              labelId="salon-select-label"
              id="salon-select"
              value={selectedSalon}
              onChange={handleSalonChange}
              label="Салон"
              disabled={isLoadingSalons}
              sx={{ 
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
                }
              }}
            >
              <MenuItem value="all">Все салоны</MenuItem>
              {salons?.map((salon) => (
                  <MenuItem key={salon.id} value={salon.id.toString()}>
                    {salon.name}
                  </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl fullWidth sx={{ minWidth: 200 }}>
          <InputLabel id="report-type-label">Тип отчёта</InputLabel>
          <Select
            labelId="report-type-label"
            id="report-type"
            value={reportType}
            onChange={handleReportTypeChange}
            label="Тип отчёта"
            sx={{ 
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
              }
            }}
          >
            <MenuItem value="revenue">Выручка</MenuItem>
            <MenuItem value="appointments">Записи</MenuItem>
            <MenuItem value="services">Услуги</MenuItem>
            <MenuItem value="clients">Клиенты</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
            label="Начало периода"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
            renderInput={(params) => (
              <TextField 
                {...params} 
                fullWidth 
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                } 
              }}
            />
            )}
          />
            <DatePicker
            label="Конец периода"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
            renderInput={(params) => (
              <TextField 
                {...params} 
                fullWidth 
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }} 
              />
            )}
            />
          </LocalizationProvider>
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
            onClick={handlePrint}
            variant="contained"
              startIcon={<PrintIcon />}
            sx={{
              background: primaryGradient,
              boxShadow: buttonShadow,
              borderRadius: 2,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                background: primaryGradient,
                transform: hoverTransform,
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            Печать
        </Button>
        <Button
            onClick={exportToCSV}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              background: secondaryGradient,
              boxShadow: buttonShadow,
              borderRadius: 2,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                background: secondaryGradient,
                transform: hoverTransform,
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            CSV
        </Button>
      </Box>
      </Stack>
    </Paper>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            background: primaryGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
        Отчеты и статистика
      </Typography>
        <IconButton 
          onClick={toggleHelp}
          sx={{ 
            color: theme.palette.primary.main, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            }
          }}
          aria-label="Справка по отчетам"
        >
          <HelpOutlineIcon />
        </IconButton>
      </Box>
      
      {helpOpen && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: infoGradient,
            color: 'white',
            boxShadow: cardBoxShadow
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <InfoIcon sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Справка по отчетам
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                В этом разделе вы можете просматривать различные отчеты и статистику по работе салона.
              </Typography>
              <Typography variant="body2">
                • <strong>Выручка</strong> - финансовые показатели за период<br />
                • <strong>Записи</strong> - данные о записях клиентов<br />
                • <strong>Услуги</strong> - статистика по популярности услуг<br />
                • <strong>Клиенты</strong> - информация о клиентах и их активности
              </Typography>
            </Box>
            <IconButton 
              onClick={toggleHelp} 
              sx={{ 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                }
              }}
              aria-label="Закрыть справку"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
      
      <ReportForm />
      
      <Box sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              fontWeight: 'bold',
              transition: 'all 0.3s',
              '&:hover': {
                color: theme.palette.primary.main,
                opacity: 1
              }
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 1.5
            }
          }}
        >
          <Tab 
            icon={<BarChartIcon />} 
            label="Общие метрики" 
            iconPosition="start"
          />
          <Tab 
            icon={<SpaIcon />} 
            label="Популярные услуги" 
            iconPosition="start"
          />
          <Tab 
            icon={<PeopleIcon />} 
            label="Топ сотрудников" 
            iconPosition="start"
          />
          <Tab 
            icon={<AttachMoneyIcon />}
            label="Детальный отчет" 
            iconPosition="start"
          />
        </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <KeyMetricsCards />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
          <PopularServicesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
          <TopEmployeesTable />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <ReportTable />
      </TabPanel>
      </Box>
    </Box>
  );
};

export default ReportsAndStatistics; 