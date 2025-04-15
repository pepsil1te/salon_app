import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
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
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  HowToReg as HowToRegIcon,
  Check as CheckIcon
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

// Add missing a11yProps function
function a11yProps(index) {
  return {
    id: `reports-tab-${index}`,
    'aria-controls': `reports-tabpanel-${index}`,
  };
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
                      <TableCell align="center">{employee.position || 'Сотрудник'}</TableCell>
                      <TableCell align="center">{employee.appointments_count}</TableCell>
                      <TableCell align="center" sx={{ color: 'success.main' }}>{employee.completed_count}</TableCell>
                      <TableCell align="center" sx={{ color: 'error.main' }}>{employee.cancelled_count}</TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: theme.palette.primary.main
                        }}
                      >
                        {employee.total_earnings.toLocaleString('ru-RU')} ₽
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
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{ 
          display: 'flex', 
          flexDirection: ['column', 'row'],
          justifyContent: 'space-between',
          alignItems: ['flex-start', 'center'],
          background: primaryGradient,
          borderRadius: '10px',
          padding: '16px 24px',
          mb: 3,
          boxShadow: cardBoxShadow,
          color: 'white',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BarChartIcon sx={{ fontSize: 30 }} />
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Отчёты и Статистика
      </Typography>
            <Typography variant="body2">
              Анализ эффективности работы и ключевых показателей бизнеса
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton 
            aria-label="Справка" 
            onClick={toggleHelp}
            sx={{ 
              color: 'white',
              opacity: 0.8,
              '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' },
              boxShadow: helpOpen ? buttonShadow : 'none',
              transform: helpOpen ? hoverTransform : 'none',
            }}
          >
            <HelpOutlineIcon />
          </IconButton>
        </Box>
      </Box>
      
      {helpOpen && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setHelpOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Как работать с отчётами</AlertTitle>
          <Typography variant="body2" paragraph>
            Выберите интересующий вас салон, период времени и тип отчета. Вы можете:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            <Box component="li"><strong>Аналитика:</strong> Обзор ключевых показателей и графики</Box>
            <Box component="li"><strong>Отчеты по выручке:</strong> Доход по дням и источникам</Box>
            <Box component="li"><strong>Статистика услуг:</strong> Популярность и доходность услуг</Box>
            <Box component="li"><strong>Данные по сотрудникам:</strong> Производительность и загруженность</Box>
            <Box component="li"><strong>Расписание сотрудников:</strong> График работы и заработок</Box>
          </Box>
          <Typography variant="body2">
            Вы также можете скачать или распечатать любой отчет для дальнейшего анализа.
          </Typography>
        </Alert>
      )}
      
      <ReportForm />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="report tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: isMobile ? '0.825rem' : '0.875rem',
              minHeight: isMobile ? 48 : 56,
              minWidth: isMobile ? 'auto' : 120,
            },
            '& .Mui-selected': {
              fontWeight: 600,
            }
          }}
        >
          <Tab 
            icon={<BarChartIcon fontSize="small" />} 
            iconPosition="start" 
            label={isMobile ? "Аналитика" : "Аналитика и дашборд"} 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<AttachMoneyIcon fontSize="small" />} 
            iconPosition="start" 
            label="Выручка" 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<SpaIcon fontSize="small" />} 
            iconPosition="start" 
            label="Услуги" 
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<PeopleIcon fontSize="small" />} 
            iconPosition="start" 
            label="Сотрудники" 
            {...a11yProps(3)} 
          />
          <Tab 
            icon={<EventIcon fontSize="small" />} 
            iconPosition="start" 
            label="Расписание" 
            {...a11yProps(4)} 
          />
        </Tabs>
      </Box>
      
      {/* Аналитика и дашборд */}
      <TabPanel value={tabValue} index={0}>
        <KeyMetricsCards />
      </TabPanel>

      {/* Отчеты по выручке */}
      <TabPanel value={tabValue} index={1}>
        <ReportTable />
      </TabPanel>

      {/* Статистика по услугам */}
      <TabPanel value={tabValue} index={2}>
            <PopularServicesTable />
      </TabPanel>

      {/* Статистика по сотрудникам */}
      <TabPanel value={tabValue} index={3}>
            <TopEmployeesTable />
      </TabPanel>
      
      {/* Расписание сотрудников */}
      <TabPanel value={tabValue} index={4}>
        <EmployeeScheduleAndEarningsTable />
      </TabPanel>
    </Box>
  );
};

// Context for sharing report parameters between components
const ReportsContext = React.createContext({});
const useReportsContext = () => React.useContext(ReportsContext);

// Helper function to get correct Russian plural form
const pluralize = (number, words) => {
  const cases = [2, 0, 1, 1, 1, 2];
  const index = (number % 100 > 4 && number % 100 < 20) ? 2 : cases[Math.min(number % 10, 5)];
  return words[index];
};

// Employee Schedule and Earnings Table with check-in tracking
const EmployeeScheduleAndEarningsTable = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState({ success: false, message: '', error: false });
  
  // Get the necessary context from parent component
  const { selectedSalon, formattedStartDate, formattedEndDate } = useReportsContext();
  
  // Format today's date for API call
  const todayFormatted = format(selectedDate, 'yyyy-MM-dd');
  
  // Load employee schedules
  const {
    data: scheduleData,
    isLoading: isLoadingSchedules,
    error: scheduleError,
    refetch: refetchSchedules
  } = useQuery(
    [
      'statistics', 
      'employeeSchedules', 
      selectedSalon !== 'all' ? selectedSalon : null,
      formattedStartDate, 
      formattedEndDate,
      selectedDate // Add selected date as a dependency to force refresh on date change
    ],
    () => statisticsApi.getEmployeeSchedules({
      salonId: selectedSalon !== 'all' ? selectedSalon : undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      enabled: (user?.role === 'admin' || selectedSalon !== 'all')
    }
  );
  
  // Load employee earnings for the same period
  const {
    data: earningsData,
    isLoading: isLoadingEarnings,
    error: earningsError
  } = useQuery(
    [
      'statistics', 
      'employeeEarnings', 
      selectedSalon !== 'all' ? selectedSalon : null,
      formattedStartDate, 
      formattedEndDate
    ],
    () => statisticsApi.getEmployeeEarnings({
      salonId: selectedSalon !== 'all' ? selectedSalon : undefined,
      startDate: formattedStartDate,
      endDate: formattedEndDate
    }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: (user?.role === 'admin' || selectedSalon !== 'all')
    }
  );
  
  // Handle employee check-in
  const handleCheckIn = async (employee, date) => {
    try {
      setCheckingIn(true);
      
      // Get day of week for the selected date (0-6, Sunday is 0)
      const dayOfWeek = date.getDay();
      const dayOfWeekStr = dayOfWeek.toString();
      
      // Full day name mapping
      const fullDayNames = {
        0: 'Воскресенье', 1: 'Понедельник', 2: 'Вторник', 
        3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота'
      };
      const fullDayName = fullDayNames[dayOfWeek];
      
      // Get working hours for this day - check both numeric and full name formats
      const workingHours = employee.working_hours || {};
      let daySchedule = workingHours[dayOfWeekStr];
      
      // If not found by numeric key, try full day name
      if (!daySchedule || !daySchedule.start || !daySchedule.end || daySchedule.is_working === false) {
        daySchedule = workingHours[fullDayName];
      }
      
      if (!daySchedule || !daySchedule.start || !daySchedule.end || daySchedule.is_working === false) {
        setCheckInStatus({
          success: false,
          error: true,
          message: 'Этот сотрудник не назначен на работу в этот день'
        });
        return;
      }
      
      // Call API to check in employee
      const response = await statisticsApi.checkInEmployee({
        employeeId: employee.employee_id,
        date: format(date, 'yyyy-MM-dd'),
        checkinTime: new Date().toISOString()
      });
      
      setCheckInStatus({
        success: true,
        error: false,
        message: 'Сотрудник успешно отмечен'
      });
      
      // Refresh the data
      await refetchSchedules();
      
    } catch (error) {
      console.error('Error checking in employee:', error);
      setCheckInStatus({
        success: false,
        error: true,
        message: error.message || 'Произошла ошибка при отметке сотрудника'
      });
    } finally {
      setCheckingIn(false);
    }
  };
  
  // Open check-in dialog
  const openCheckInDialog = (employee) => {
    setSelectedEmployee(employee);
    setCheckInDialogOpen(true);
    setCheckInStatus({ success: false, message: '', error: false });
  };
  
  // Close check-in dialog
  const closeCheckInDialog = () => {
    setCheckInDialogOpen(false);
    
    // If check-in was successful, refresh the data
    if (checkInStatus.success) {
      setTimeout(() => {
        refetchSchedules();
      }, 500);
    }
  };
  
  // Submit check-in
  const submitCheckIn = async () => {
    if (!selectedEmployee) return;
    
    try {
      await handleCheckIn(selectedEmployee, selectedDate);
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };
  
  // Helper function for day name abbreviation
  const getDayAbbr = (dayName) => {
    const abbr = {
      'Понедельник': 'Пн',
      'Вторник': 'Вт',
      'Среда': 'Ср',
      'Четверг': 'Чт',
      'Пятница': 'Пт',
      'Суббота': 'Сб',
      'Воскресенье': 'Вс'
    };
    return abbr[dayName] || dayName.substring(0, 2);
  };
  
  // Process and combine data
  const combinedData = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return [];
    
    return scheduleData.map(employee => {
      // Find earnings for this employee
      const earnings = earningsData?.find(e => 
        e.employee_id === employee.employee_id
      ) || { total_earnings: 0, appointments_count: 0 };
      
      // Combine the data
      return {
        ...employee,
        total_earnings: earnings.total_earnings || 0,
        appointments_count: earnings.appointments_count || 0
      };
    });
  }, [scheduleData, earningsData]);
  
  // Get unique salon names
  const salonNames = useMemo(() => {
    if (!combinedData || !Array.isArray(combinedData)) return [];
    
    const uniqueSalons = [...new Set(combinedData.map(item => item.salon_name))];
    return uniqueSalons.filter(Boolean).sort();
  }, [combinedData]);
  
  // Loading state
  if ((isLoadingSchedules || isLoadingEarnings) && !scheduleData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if ((scheduleError || earningsError) && !scheduleData) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Ошибка загрузки данных о сотрудниках. Пожалуйста, попробуйте позже.
      </Alert>
    );
  }
  
  // Empty state
  if ((!combinedData || !combinedData.length) && !isLoadingSchedules) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Нет данных о расписании сотрудников за выбранный период
      </Alert>
    );
  }

  // Render work schedule in a more intuitive calendar-like format
  const renderWorkSchedule = (employee) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const fullDayNames = {
      0: 'Воскресенье', 1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота',
      'Вс': 'Воскресенье', 'Пн': 'Понедельник', 'Вт': 'Вторник', 'Ср': 'Среда', 'Чт': 'Четверг', 'Пт': 'Пятница', 'Сб': 'Суббота'
    };
    
    // Get working hours from employee data
    const workingHours = employee.working_hours || {};
    
    // Debug: log the working hours to console to see format
    console.log(`Employee ${employee.employee_name} working hours:`, workingHours);
    
    // Days to display (numeric format: 0-6 for Sun-Sat)
    const daysToRender = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun order
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
        {daysToRender.map(dayNum => {
          const today = new Date();
          const isToday = today.getDay() === dayNum;
          const dayName = days[dayNum];
          const fullDayName = fullDayNames[dayNum];
          
          // Check for working hours in different formats
          let dayData = null;
          let isWorkingDay = false;
          
          // Check FULL day name (e.g. "Понедельник")
          if (workingHours[fullDayName] && 
              typeof workingHours[fullDayName] === 'object' && 
              workingHours[fullDayName].start && 
              workingHours[fullDayName].end &&
              workingHours[fullDayName].is_working !== false) {
            dayData = workingHours[fullDayName];
            isWorkingDay = true;
          }
          // Check numeric key
          else if (workingHours[dayNum.toString()] && 
              typeof workingHours[dayNum.toString()] === 'object' && 
              workingHours[dayNum.toString()].start && 
              workingHours[dayNum.toString()].end &&
              workingHours[dayNum.toString()].is_working !== false) {
            dayData = workingHours[dayNum.toString()];
            isWorkingDay = true;
          }
          // Check abbreviation
          else if (workingHours[dayName] && 
              typeof workingHours[dayName] === 'object' &&
              workingHours[dayName].start && 
              workingHours[dayName].end &&
              workingHours[dayName].is_working !== false) {
            dayData = workingHours[dayName];
            isWorkingDay = true;
          }
          
          // Determine text to display
          let displayText;
          
          if (isWorkingDay && dayData) {
            displayText = `${dayName} ${dayData.start}-${dayData.end}`;
          } else {
            displayText = `${dayName} выходной`;
          }
          
          return (
            <Chip
              key={dayNum}
              size="small"
              label={displayText}
              color={isToday ? "primary" : isWorkingDay ? "success" : "default"}
              variant={isToday ? "filled" : "outlined"}
          sx={{ 
                fontSize: '0.75rem',
                fontWeight: isToday ? 500 : 400,
                borderRadius: '12px',
                backgroundImage: isToday 
                  ? 'linear-gradient(to right, #4f46e5, #3f6ec6)'
                  : isWorkingDay 
                    ? 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))'
                    : 'none',
                '& .MuiChip-label': {
                  padding: '2px 8px',
                }
              }}
            />
          );
        })}
      </Box>
    );
  };

  // Desktop version of schedule table cell
  const renderScheduleTableCell = (employee) => {
    return (
      <TableCell>
        {renderWorkSchedule(employee)}
      </TableCell>
    );
  };

  // Mobile version of schedule display
  const renderMobileSchedule = (employee) => {
    return (
      <>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          График работы:
        </Typography>
        {renderWorkSchedule(employee)}
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ 
            display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Расписание и заработок сотрудников
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <DatePicker
              label="Дата для отметки"
              value={selectedDate}
              onChange={(newDate) => {
                setSelectedDate(newDate);
                // Force refresh when date changes
                setTimeout(() => {
                  refetchSchedules();
                }, 100);
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  size="small" 
                  sx={{ 
                    width: isMobile ? '100%' : 200,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    } 
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Box>
        
        {scheduleError && (
          <Alert severity="error">
            Ошибка при загрузке расписания: {scheduleError.message}
          </Alert>
        )}
      </Box>
      
      {!isMobile && (
        <Paper 
          sx={{ 
            overflow: 'hidden', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
            mb: 3, 
            borderRadius: 3 
          }}
          elevation={3}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="employee schedule table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Сотрудник</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Салон</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>График работы</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Статус</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Заработок</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salonNames.map(salonName => (
                  <React.Fragment key={salonName}>
                    <TableRow
                      sx={{
                        bgcolor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.primary.dark, 0.15)
                          : alpha(theme.palette.primary.light, 0.15)
                      }}
                    >
                      <TableCell 
                        colSpan={5} 
                        sx={{ 
                          fontWeight: 600, 
                          py: 1
                        }}
                      >
                        {salonName}
                      </TableCell>
                    </TableRow>
                    
                    {combinedData
                      .filter(employee => employee.salon_name === salonName)
                      .map((employee, index) => {
                        // Find today's schedule
                        const todaySchedule = employee.schedule?.find(s => 
                          s.date === todayFormatted
                        ) || { is_working: false };
                        
                        return (
                          <TableRow 
                            key={employee.employee_id}
                            sx={{ 
                              '&:nth-of-type(odd)': { 
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.action.hover, 0.05)
                                  : alpha(theme.palette.action.hover, 0.05)
                              },
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark' 
                                  ? alpha(theme.palette.action.hover, 0.1)
                                  : alpha(theme.palette.action.hover, 0.1)
                              }
                            }}
                          >
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {employee.employee_name}
        </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.position}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {employee.salon_name}
                            </TableCell>
                            {renderScheduleTableCell(employee)}
                            <TableCell align="center">
                              {todaySchedule.is_working ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                  {todaySchedule.checked_in ? (
                                    <>
                                      <Chip 
                                        size="small"
                                        label={`Отмечен в ${todaySchedule.checkin_time}`}
                                        color={todaySchedule.is_late ? "warning" : "success"}
                                        icon={todaySchedule.is_late ? <AccessTimeIcon /> : <CheckCircleIcon />}
                                        sx={{
                                          borderRadius: '12px',
                                          backgroundImage: todaySchedule.is_late
                                            ? 'linear-gradient(to right, #f59e0b, #d97706)'
                                            : 'linear-gradient(to right, #10b981, #059669)'
                                        }}
                                      />
                                      {todaySchedule.is_late && (
                                        <Typography variant="caption" color="warning.main" sx={{ fontWeight: 500 }}>
                                          Опоздание
                                        </Typography>
                                      )}
                                    </>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="primary"
                                      onClick={() => openCheckInDialog(employee)}
                                      startIcon={<HowToRegIcon />}
                                      sx={{
                                        borderRadius: '20px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
                                        textTransform: 'none',
                                        '&:hover': {
                                          background: 'linear-gradient(to right, #4338ca, #3b82f6)',
                                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        }
                                      }}
                                    >
                                      Отметить
                                    </Button>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Не работает сегодня
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {new Intl.NumberFormat('ru-RU', {
                                  style: 'currency',
                                  currency: 'RUB',
                                  minimumFractionDigits: 0
                                }).format(employee.total_earnings || 0)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.appointments_count || 0} 
                                {' '}
                                {pluralize(employee.appointments_count || 0, ['запись', 'записи', 'записей'])}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    }
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* For mobile devices - card style */}
      {isMobile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {salonNames.map(salonName => (
            <Box key={salonName} sx={{ mb: 2 }}>
        <Typography 
                variant="subtitle1" 
          sx={{ 
                  fontWeight: 600,
                  p: 1.5,
                  borderRadius: '12px 12px 0 0',
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.dark, 0.15)
                    : alpha(theme.palette.primary.light, 0.15),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {salonName}
        </Typography>
              
              {combinedData
                .filter(employee => employee.salon_name === salonName)
                .map(employee => {
                  // Find today's schedule
                  const todaySchedule = employee.schedule?.find(s => 
                    s.date === todayFormatted
                  ) || { is_working: false };
                  
                  return (
                    <Paper 
                      key={employee.employee_id}
                      elevation={2}
          sx={{ 
                        mb: 2,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        p: 2, 
                        borderBottom: '1px solid', 
                        borderColor: theme.palette.divider,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {employee.employee_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.position}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                              minimumFractionDigits: 0
                            }).format(employee.total_earnings || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.appointments_count || 0} {pluralize(employee.appointments_count || 0, ['запись', 'записи', 'записей'])}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                          Статус сегодня:
                        </Typography>
                        
                        {todaySchedule.is_working ? (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            {todaySchedule.checked_in ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon color={todaySchedule.is_late ? "warning" : "success"} />
                                <Box>
                                  <Typography variant="body2">
                                    Отмечен в {todaySchedule.checkin_time}
                                  </Typography>
                                  {todaySchedule.is_late && (
                                    <Typography variant="caption" color="warning.main">
                                      Опоздание более 15 минут
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            ) : (
                              <Typography variant="body2">
                                Сегодня работает с {todaySchedule.start_time} до {todaySchedule.end_time}
                              </Typography>
                            )}
                            
                            {!todaySchedule.checked_in && (
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => openCheckInDialog(employee)}
                                startIcon={<HowToRegIcon />}
                                sx={{
                                  borderRadius: '20px',
                                  background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
                                  textTransform: 'none',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  '&:hover': {
                                    background: 'linear-gradient(to right, #4338ca, #3b82f6)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  }
                                }}
                              >
                                Отметить
                              </Button>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                            Не работает сегодня
                          </Typography>
                        )}
                        
                        {renderMobileSchedule(employee)}
                      </Box>
                    </Paper>
                  );
                })
              }
            </Box>
          ))}
        </Box>
      )}
      
      {/* Check-in Dialog - Modern design */}
      <Dialog
        open={checkInDialogOpen}
        onClose={closeCheckInDialog}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            maxWidth: isMobile ? '95%' : '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: theme.palette.divider,
          pb: 1
        }}>
          Отметка о приходе на работу
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedEmployee && (
            <Box>
              <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
                gap: 1, 
                mb: 2,
                pb: 1,
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.5)
              }}>
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main,
                    background: 'linear-gradient(45deg, #4f46e5, #3b82f6)'
                  }}
                >
                  {selectedEmployee.employee_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {selectedEmployee.employee_name}
        </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedEmployee.position}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Дата:
                </Typography>
                <Chip 
                  label={format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: '12px' }}
                />
              </Box>
              
              {checkInStatus.message && (
                <Alert 
                  severity={checkInStatus.error ? "error" : "success"}
                  sx={{ 
                    mb: 2,
                    borderRadius: '12px'
                  }}
                >
                  {checkInStatus.message}
                </Alert>
              )}
              
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Время:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {format(new Date(), 'HH:mm:ss')}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', color: 'text.secondary' }}>
                Вы уверены, что хотите отметить сотрудника как присутствующего на работе?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={closeCheckInDialog} 
            disabled={checkingIn}
            variant="outlined"
            sx={{
              borderRadius: '20px',
              textTransform: 'none'
            }}
          >
            Отмена
          </Button>
          <Button 
            onClick={submitCheckIn}
            variant="contained"
            color="primary"
            disabled={checkingIn || checkInStatus.success}
            startIcon={checkingIn ? <CircularProgress size={20} /> : <CheckIcon />}
            sx={{
              borderRadius: '20px',
              background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(to right, #4338ca, #3b82f6)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
              }
            }}
          >
            {checkingIn ? 'Отмечаем...' : 'Отметить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const ReportsAndStatisticsWithContext = (props) => {
  const contextValue = useReportsContext();
  return (
    <ReportsContext.Provider value={contextValue}>
      <ReportsAndStatistics {...props} />
    </ReportsContext.Provider>
  );
};

export default ReportsAndStatisticsWithContext; 