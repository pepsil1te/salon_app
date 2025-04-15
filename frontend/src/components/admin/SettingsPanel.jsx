import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Backdrop,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  ListItemAvatar,
  Badge,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  BottomNavigation,
  BottomNavigationAction,
  Drawer,
  Fab,
  AppBar,
  InputAdornment,
  FormGroup,
  Checkbox,
  FormHelperText
} from '@mui/material';
import { 
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  ColorLens as ColorLensIcon,
  Backup as BackupIcon,
  DeleteForever as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Info as InfoIcon,
  Fingerprint as FingerprintIcon,
  ExitToApp as ExitToAppIcon,
  Settings as SettingsIcon,
  Telegram as TelegramIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import settingsApi from '../../api/settings';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { alpha } from '@mui/material/styles';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

// Начальное состояние настроек для случая, когда данные ещё не загружены
const initialSettings = {
  general: {
    companyName: '',
    adminEmail: '',
    defaultLanguage: 'ru',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    telegramBotToken: ''
  },
  appearance: {
    theme: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    enableDarkMode: false,
    showLogo: true,
    density: 'standard',
    enableAnimations: true,
    enableBlur: true,
    roundedCorners: true,
    showIcons: true,
    showLabels: true
  },
  notification: {
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    marketingEmails: false,
    reminderTime: 24 // hours before appointment
  },
  security: {
    twoFactorAuth: false,
    passwordExpiryDays: 90,
    sessionTimeout: 30, // minutes
    allowRegistration: true
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 30, // days
    lastBackup: new Date().toISOString()
  }
};

const SettingsPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState(initialSettings);
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogMode, setUserDialogMode] = useState('add'); // 'add' or 'edit'
  const [loading, setLoading] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Для адаптивного дизайна
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Получаем функции управления темой и языком из контекста
  const { 
    theme: currentTheme, 
    language: currentLanguage,
    setTheme, 
    setLanguage,
    appearanceSettings,
    updateAppearanceSettings
  } = useThemeLanguage();

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  // Эффект для синхронизации настроек с глобальным состоянием
  useEffect(() => {
    if (isDataLoaded) {
      // Если настройки уже загружены, синхронизируем их с текущей темой/языком
      if (currentTheme !== settings.appearance.theme) {
        handleTextChange('appearance', 'theme', currentTheme);
      }
      if (currentLanguage !== settings.general.defaultLanguage) {
        handleTextChange('general', 'defaultLanguage', currentLanguage);
      }
    }
  }, [isDataLoaded, currentTheme, currentLanguage]);

  // При первой загрузке, синхронизируем контекст с настройками из базы данных
  useEffect(() => {
    if (isDataLoaded && appearanceSettings) {
      // Обновляем настройки внешнего вида в контексте
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          ...appearanceSettings
        }
      }));
    }
  }, [isDataLoaded, appearanceSettings]);

  // Функция применения темы
  const applyTheme = (theme) => {
    // Используем функцию setTheme из контекста
    setTheme(theme);
  };

  // Функция смены языка
  const changeLanguage = (language) => {
    // Используем функцию setLanguage из контекста
    setLanguage(language);
  };

  // Обработчик изменения языка
  const handleLanguageChange = (language) => {
    // Меняем язык приложения
    changeLanguage(language);
    
    // Обновляем состояние
    handleTextChange('general', 'defaultLanguage', language);
  };

  // Обработчик изменения темы
  const handleThemeChange = (themeValue) => {
    // Применяем новую тему
    setTheme(themeValue);
    
    // Обновляем состояние
    handleTextChange('appearance', 'theme', themeValue);
  };

  // Функция загрузки настроек с сервера
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getSettings();
      
      // Объединяем полученные настройки с дефолтными, чтобы убедиться, что все поля присутствуют
      const mergedSettings = {
        general: { ...initialSettings.general, ...response.general },
        appearance: { ...initialSettings.appearance, ...response.appearance },
        notification: { ...initialSettings.notification, ...response.notification },
        security: { ...initialSettings.security, ...response.security },
        backup: { ...initialSettings.backup, ...response.backup }
      };
      
      setSettings(mergedSettings);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке настроек. Используются значения по умолчанию.',
        severity: 'error'
      });
      setIsDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Функция загрузки пользователей с сервера
  const fetchUsers = async () => {
    try {
      const response = await settingsApi.getUsers();
      setUsers(response);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке списка пользователей.',
        severity: 'error'
      });
    }
  };

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Обработчик изменения текстовых полей
  const handleTextChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Обработчик изменения переключателей
  const handleSwitchChange = (section, field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.checked
      }
    }));
  };

  // Обработчик сохранения настроек
  const handleSaveSettings = async (section) => {
    try {
      setLoading(true);
      const response = await settingsApi.updateSettings(section, settings[section]);
      
      setSnackbar({
        open: true,
        message: `Настройки раздела "${section}" успешно сохранены`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Ошибка при сохранении настроек раздела ${section}:`, error);
      setSnackbar({
        open: true,
        message: `Ошибка при сохранении настроек раздела "${section}"`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработчик создания резервной копии
  const handleCreateBackup = async () => {
    try {
      setLoadingBackup(true);
      const response = await settingsApi.createBackup();
      
      // Обновляем timestamp последнего бэкапа
      setSettings(prev => ({
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: response.timestamp
        }
      }));
      
      // Сохраняем обновлённые настройки на сервере
      await settingsApi.updateSettings('backup', {
        ...settings.backup,
        lastBackup: response.timestamp
      });
      
      setSnackbar({
        open: true,
        message: 'Резервная копия успешно создана',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при создании резервной копии:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при создании резервной копии',
        severity: 'error'
      });
    } finally {
      setLoadingBackup(false);
    }
  };

  // Обработчик закрытия snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Открытие диалога добавления пользователя
  const handleOpenAddUserDialog = () => {
    setUserDialogMode('add');
    setSelectedUser({
      name: '',
      email: '',
      role: 'employee',
      status: 'active'
    });
    setOpenUserDialog(true);
  };

  // Открытие диалога редактирования пользователя
  const handleOpenEditUserDialog = (user) => {
    setSelectedUser(user);
    setUserDialogMode('edit');
    setOpenUserDialog(true);
  };

  // Закрытие диалога пользователя
  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setSelectedUser(null);
  };

  // Обработчик изменения полей пользователя
  const handleUserChange = (field, value) => {
    setSelectedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Сохранение пользователя
  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      if (!selectedUser) return;
      
      // Обновление роли пользователя (только для сотрудников)
      if (selectedUser.user_type === 'employee') {
        await settingsApi.updateUserRole(selectedUser.id, selectedUser.role, selectedUser.user_type);
      }
      
      // Обновление статуса пользователя
      await settingsApi.updateUserStatus(selectedUser.id, selectedUser.status, selectedUser.user_type);
      
      // Закрываем диалог
      handleCloseUserDialog();
      
      // Обновляем список пользователей
      fetchUsers();
      
      setSnackbar({
        open: true,
        message: 'Данные пользователя успешно обновлены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при сохранении пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при сохранении пользователя',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Получение цвета чипа статуса пользователя
  const getUserStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  // Получение текста роли пользователя
  const getUserRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'employee':
        return 'Сотрудник';
      default:
        return role;
    }
  };

  // Обработчик изменения роли пользователя
  const handleRoleChange = async (userId, newRole, userType) => {
    try {
      await settingsApi.updateUserRole(userId, newRole, userType);
      
      // После успешного обновления обновляем список пользователей
      fetchUsers();
      
      setSnackbar({
        open: true,
        message: 'Роль пользователя успешно обновлена',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при обновлении роли пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении роли пользователя',
        severity: 'error'
      });
    }
  };

  // Обработчик изменения статуса пользователя
  const handleStatusChange = async (userId, newStatus, userType) => {
    try {
      await settingsApi.updateUserStatus(userId, newStatus, userType);
      
      // После успешного обновления обновляем список пользователей
      fetchUsers();
      
      setSnackbar({
        open: true,
        message: 'Статус пользователя успешно обновлен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при обновлении статуса пользователя:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при обновлении статуса пользователя',
        severity: 'error'
      });
    }
  };

  // Обработчик открытия диалога удаления пользователя
  const handleOpenDeleteDialog = (user) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  // Обработчик закрытия диалога удаления пользователя
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  // Обработчик удаления пользователя
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await settingsApi.deleteUser(userToDelete.id, userToDelete.user_type);
      
      // Закрываем диалог
      handleCloseDeleteDialog();
      
      // Обновляем список пользователей
      fetchUsers();
      
      setSnackbar({
        open: true,
        message: 'Пользователь успешно удален',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при удалении пользователя:', error);
      
      // Проверяем, есть ли сообщение об ошибке
      const errorMessage = error.response?.data?.message || 'Ошибка при удалении пользователя';
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Названия вкладок и связанные с ними иконки
  const tabOptions = [
    { label: "Общие", icon: <PersonIcon /> },
    { label: "Внешний вид", icon: <ColorLensIcon /> },
    { label: "Уведомления", icon: <NotificationsIcon /> },
    { label: "Безопасность", icon: <SecurityIcon /> },
    { label: "Резервное копирование", icon: <BackupIcon /> },
    { label: "Пользователи", icon: <PersonIcon /> }
  ];

  // Обработчик выбора вкладки из выпадающего списка
  const handleMobileTabChange = (event) => {
    setTabValue(Number(event.target.value));
    setMobileMenuOpen(false);
  };

  // Переключение мобильного меню
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Определяем общие стили для карточек и компонентов
  const cardStyle = {
    borderRadius: 2,
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(25, 30, 40, 0.5)' : 'rgba(255, 255, 255, 0.9)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
      transform: 'translateY(-4px)'
    }
  };

  // Общий стиль для заголовков карточек
  const cardHeaderStyle = {
    p: isMobile ? 2 : 3,
    '& .MuiCardHeader-action': {
      m: isMobile ? 0 : 'auto',
    },
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(90deg, rgba(63,81,181,0.15) 0%, rgba(33,33,45,0.05) 100%)' 
      : 'linear-gradient(90deg, rgba(63,81,181,0.1) 0%, rgba(245,245,250,0.05) 100%)',
  };

  // Общий стиль для кнопок "Сохранить"
  const saveButtonStyle = {
    background: 'linear-gradient(45deg, #3f51b5 30%, #5c6bc0 90%)',
    boxShadow: '0 3px 10px rgba(63, 81, 181, 0.3)',
    '&:hover': {
      background: 'linear-gradient(45deg, #303f9f 30%, #3f51b5 90%)',
      boxShadow: '0 5px 14px rgba(63, 81, 181, 0.4)'
    }
  };

  // Обработчик сохранения настроек внешнего вида
  const handleSaveAppearance = async () => {
    try {
      setLoading(true);
      
      // Разделяем персональные и глобальные настройки
      const { theme, ...globalAppearanceSettings } = settings.appearance;
      
      // Сначала обновляем тему через контекст - это персональная настройка
      setTheme(theme);
      
      console.log('Сохранение глобальных настроек внешнего вида:', globalAppearanceSettings);
      
      // Затем обновляем глобальные настройки через контекст
      const success = await updateAppearanceSettings(globalAppearanceSettings);
      
      if (!success) {
        throw new Error('Не удалось обновить настройки внешнего вида');
      }
      
      setSnackbar({
        open: true,
        message: 'Настройки внешнего вида успешно сохранены и применены',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при сохранении настроек внешнего вида:', error);
      setSnackbar({
        open: true,
        message: `Ошибка при сохранении настроек внешнего вида: ${error.message || 'Неизвестная ошибка'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Обновляем стиль заголовка раздела настроек
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(90deg, rgba(63,81,181,0.15) 0%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(90deg, rgba(63,81,181,0.1) 0%, rgba(250,250,250,0) 100%)',
        borderRadius: 2,
        py: 2,
        px: 3
      }}>
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 0.5 
            }}
          >
        Настройки
      </Typography>
          <Typography variant="body2" color="text.secondary">
            Управление настройками приложения
          </Typography>
        </Box>
      </Box>
      
      {/* Десктопная версия вкладок - с улучшенным дизайном */}
      {!isMobile && (
        <Paper 
          elevation={0} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <AppBar position="static" 
            sx={{ 
              borderRadius: isMobile ? '6px 6px 0 0' : '8px 8px 0 0',
              backgroundImage: 'none',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)'
            }}
          >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
              sx={{ 
                minHeight: isMobile ? 48 : 64,
                '& .MuiTab-root': {
                  minHeight: isMobile ? 48 : 64,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  }
                }
              }}
            >
              <Tab label="Общие" {...a11yProps(0)} />
              <Tab label="Telegram" {...a11yProps(1)} />
              <Tab label="Уведомления" {...a11yProps(2)} />
              <Tab label="Безопасность" {...a11yProps(3)} />
          </Tabs>
          </AppBar>
        </Paper>
      )}
      
      {/* Мобильная версия с выпадающим списком и улучшенным дизайном */}
      {isMobile && (
        <>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 0.5, 
              mb: 4, 
              display: 'flex', 
              alignItems: 'center',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 25px rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            <Button 
              variant="text" 
              onClick={toggleMobileMenu}
              startIcon={tabOptions[tabValue].icon}
              endIcon={<MenuIcon />}
              fullWidth
              sx={{ 
                justifyContent: 'space-between', 
                p: 1.5,
                color: 'text.primary',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              {tabOptions[tabValue].label}
            </Button>
          </Paper>
          
          <Drawer
            anchor="bottom"
            open={mobileMenuOpen}
            onClose={toggleMobileMenu}
            PaperProps={{
              sx: {
                maxHeight: '70%',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                pb: 2,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, rgba(35,35,45,1) 0%, rgba(20,20,30,1) 100%)' 
                  : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,245,250,1) 100%)',
                boxShadow: '0 -5px 25px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2,
                px: 1
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Выберите раздел
                </Typography>
                <IconButton 
                  onClick={toggleMobileMenu}
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <List>
                {tabOptions.map((tab, index) => (
                  <ListItem 
                    key={index} 
                    button 
                    onClick={() => {
                      setTabValue(index);
                      setMobileMenuOpen(false);
                    }}
                    selected={tabValue === index}
                    sx={{ 
                      mb: 1.5, 
                      borderRadius: 2,
                      bgcolor: tabValue === index 
                        ? theme.palette.mode === 'dark' 
                          ? 'rgba(63, 81, 181, 0.15)' 
                          : 'rgba(63, 81, 181, 0.1)'
                        : 'inherit',
                      border: tabValue === index ? '1px solid' : 'none',
                      borderColor: tabValue === index 
                        ? theme.palette.mode === 'dark' 
                          ? 'rgba(63, 81, 181, 0.3)' 
                          : 'rgba(63, 81, 181, 0.2)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      transform: tabValue === index ? 'scale(1.02)' : 'scale(1)',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(63, 81, 181, 0.2)' 
                          : 'rgba(63, 81, 181, 0.15)',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: tabValue === index 
                            ? 'primary.main' 
                            : theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.1)' 
                              : 'rgba(0,0,0,0.05)',
                          color: tabValue === index 
                            ? '#fff' 
                            : theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.8)' 
                              : 'rgba(0,0,0,0.6)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {tab.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={tab.label} 
                      primaryTypographyProps={{ 
                        fontWeight: tabValue === index ? 600 : 400,
                        color: tabValue === index ? 'primary.main' : 'text.primary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
        </>
      )}
      
      {/* Улучшенный дизайн загрузочного экрана */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)',
        }}
        open={loading && !isDataLoaded}
      >
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2 
          }}
        >
          <CircularProgress 
            color="primary" 
            size={60}
            thickness={4}
            sx={{ 
              boxShadow: '0 0 20px rgba(63, 81, 181, 0.5)' 
            }}
          />
          <Typography 
            variant="h6"
            sx={{
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            Загрузка настроек...
          </Typography>
        </Box>
      </Backdrop>
      
      {/* Обновленная карточка общих настроек */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={cardStyle}>
          <CardHeader 
            title="Общие настройки" 
            titleTypographyProps={{ 
              variant: isMobile ? 'h6' : 'h5',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.8)'
            }}
            action={
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={cardHeaderStyle}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Название компании"
                  value={settings.general.companyName}
                  onChange={(e) => handleTextChange('general', 'companyName', e.target.value)}
                  margin="normal"
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email администратора"
                  value={settings.general.adminEmail}
                  onChange={(e) => handleTextChange('general', 'adminEmail', e.target.value)}
                  margin="normal"
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  disabled={loading} 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel>Язык по умолчанию</InputLabel>
                  <Select
                    value={settings.general.defaultLanguage}
                    label="Язык по умолчанию"
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <MenuItem value="ru">Русский</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telegram Bot Token"
                  value={settings.general.telegramBotToken || ''}
                  onChange={(e) => handleTextChange('general', 'telegramBotToken', e.target.value)}
                  margin="normal"
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                  placeholder="Введите token бота"
                  helperText="Используется для отправки уведомлений"
                  InputProps={{
                    sx: { 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 3 : 4, 
              display: 'flex', 
              justifyContent: 'flex-end',
              flexDirection: isMobile ? 'column' : 'row',
              '& .MuiButton-root': {
                width: isMobile ? '100%' : 'auto',
                mt: isMobile ? 1 : 0,
              }
            }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
            sx={{ 
                  ...saveButtonStyle,
                  px: 3,
                  py: 1,
                  borderRadius: 2
                }}
              >
                {loading ? 
                  <CircularProgress size={24} sx={{ color: '#fff' }} /> : 
                  'Сохранить настройки'
                }
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек внешнего вида */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={cardStyle}>
          <CardHeader 
            title="Настройки внешнего вида" 
            titleTypographyProps={{ 
              variant: isMobile ? 'h6' : 'h5',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.8)'
            }}
            action={
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={cardHeaderStyle}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight={500}>
              Основные настройки
            </Typography>
            <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Цветовая схема будет применена для всех пользователей системы. Светлая или темная тема устанавливается индивидуально каждым пользователем в своём аккаунте.
                </Alert>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  disabled={loading} 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel>Тема оформления (персональная настройка)</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    label="Тема оформления (персональная настройка)"
                    onChange={(e) => handleThemeChange(e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <MenuItem value="light">Светлая</MenuItem>
                    <MenuItem value="dark">Темная</MenuItem>
                    <MenuItem value="system">Системная (как в Telegram)</MenuItem>
                  </Select>
                  <FormHelperText>
                    Эта настройка сохраняется только для вашего аккаунта и не влияет на других пользователей
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom fontWeight={500} sx={{ mt: 2 }}>
              Цветовая схема (для всех пользователей)
            </Typography>
            <Box sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            }}>
              <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Основной цвет
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {['#1976d2', '#2196f3', '#0d47a1', '#673ab7', '#9c27b0', '#e91e63', '#f44336', '#ff9800', '#4caf50', '#009688', '#607d8b'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => handleTextChange('appearance', 'primaryColor', color)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: color,
                          cursor: 'pointer',
                          border: settings.appearance.primaryColor === color ? '2px solid white' : 'none',
                          boxShadow: settings.appearance.primaryColor === color ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                  
                <TextField
                  fullWidth
                    size="small"
                    label="Пользовательский цвет"
                  type="color"
                  value={settings.appearance.primaryColor}
                  onChange={(e) => handleTextChange('appearance', 'primaryColor', e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                    sx={{ mt: 1 }}
                />
                  
                  <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: settings.appearance.primaryColor, color: '#fff', textAlign: 'center' }}>
                    <Typography variant="body2">Предпросмотр</Typography>
                  </Box>
              </Grid>
                
              <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Акцентный цвет
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {['#ff9800', '#ff5722', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => handleTextChange('appearance', 'secondaryColor', color)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: color,
                          cursor: 'pointer',
                          border: settings.appearance.secondaryColor === color ? '2px solid white' : 'none',
                          boxShadow: settings.appearance.secondaryColor === color ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                  
                <TextField
                  fullWidth
                    size="small"
                    label="Пользовательский цвет"
                  type="color"
                  value={settings.appearance.secondaryColor}
                  onChange={(e) => handleTextChange('appearance', 'secondaryColor', e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                    sx={{ mt: 1 }}
                />
                  
                  <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: settings.appearance.secondaryColor, color: '#fff', textAlign: 'center' }}>
                    <Typography variant="body2">Предпросмотр</Typography>
                  </Box>
              </Grid>
              </Grid>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom fontWeight={500}>
              Визуальные эффекты (для всех пользователей)
            </Typography>
            <Paper elevation={0} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', mb: 3 }}>
              <List disablePadding>
                <ListItem sx={{ 
                  p: 2, 
                  borderBottom: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                }}>
                  <ListItemText
                    primary="Анимации интерфейса"
                    secondary="Плавные переходы и эффекты в интерфейсе"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.appearance.enableAnimations !== false}
                      onChange={handleSwitchChange('appearance', 'enableAnimations')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem sx={{ 
                  p: 2, 
                  borderBottom: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                }}>
                  <ListItemText
                    primary="Эффект размытия"
                    secondary="Эффект матового стекла для элементов интерфейса"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.appearance.enableBlur !== false}
                      onChange={handleSwitchChange('appearance', 'enableBlur')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem sx={{ 
                  p: 2
                }}>
                  <ListItemText
                    primary="Закругленные углы"
                    secondary="Повышенное закругление углов элементов"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.appearance.roundedCorners !== false}
                      onChange={handleSwitchChange('appearance', 'roundedCorners')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
            
            <Typography variant="subtitle1" gutterBottom fontWeight={500}>
              Элементы интерфейса (для всех пользователей)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset" sx={{ mt: 1 }} disabled={loading}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Отображение элементов в меню
                  </Typography>
                  <FormGroup>
                <FormControlLabel
                  control={
                        <Checkbox 
                          checked={settings.appearance.showIcons !== false} 
                          onChange={(e) => handleTextChange('appearance', 'showIcons', e.target.checked)}
                          size={isMobile ? "small" : "medium"}
                        />
                      }
                      label="Показывать иконки"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={settings.appearance.showLabels !== false} 
                          onChange={(e) => handleTextChange('appearance', 'showLabels', e.target.checked)}
                          size={isMobile ? "small" : "medium"}
                        />
                      }
                      label="Показывать подписи"
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)', 
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    <Typography variant="body1">Показывать логотип</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Отображать логотип салона в интерфейсе
                    </Typography>
                  </Box>
                    <Switch
                    checked={settings.appearance.showLogo !== false}
                      onChange={handleSwitchChange('appearance', 'showLogo')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 3 : 4, 
              display: 'flex', 
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              '& .MuiButton-root': {
                width: isMobile ? '100%' : 'auto',
                mt: isMobile ? 1 : 0,
              }
            }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // Reset to default appearance settings
                  setSettings(prev => ({
                    ...prev,
                    appearance: {
                      ...initialSettings.appearance,
                      theme: currentTheme // Keep current theme
                    }
                  }));
                }}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Сбросить настройки
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveAppearance()}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
                sx={{
                  ...saveButtonStyle,
                  px: 3,
                  py: 1,
                  borderRadius: 2
                }}
              >
                {loading ? 
                  <CircularProgress size={24} sx={{ color: '#fff' }} /> : 
                  'Сохранить настройки'
                }
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек уведомлений */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={cardStyle}>
          <CardHeader 
            title="Настройки уведомлений" 
            titleTypographyProps={{ 
              variant: isMobile ? 'h6' : 'h5',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.8)'
            }}
            action={
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={cardHeaderStyle}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(0, 150, 136, 0.1)', border: '1px dashed rgba(0, 150, 136, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: 'rgba(0, 150, 136, 0.8)' }} />
                Особенности Telegram Mini App
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Уведомления внутри Telegram мини-приложения используют нативные механизмы Telegram.
                Эти настройки применяются для веб-версии и других платформ.
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                  <List disablePadding>
                    <ListItem sx={{ 
                      p: 2, 
                      borderBottom: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                    }}>
                      <ListItemText
                        primary="Email-уведомления"
                        secondary="Получать уведомления на электронную почту"
                      />
                      <ListItemSecondaryAction>
                    <Switch
                          edge="end"
                      checked={settings.notification.emailNotifications}
                      onChange={handleSwitchChange('notification', 'emailNotifications')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#2196f3',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#2196f3',
                            }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem sx={{ 
                      p: 2, 
                      borderBottom: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                    }}>
                      <ListItemText
                        primary="SMS-уведомления"
                        secondary="Получать уведомления по SMS"
                      />
                      <ListItemSecondaryAction>
                    <Switch
                          edge="end"
                      checked={settings.notification.smsNotifications}
                      onChange={handleSwitchChange('notification', 'smsNotifications')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem sx={{ 
                      p: 2, 
                      borderBottom: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
                    }}>
                      <ListItemText
                        primary="Напоминания о записях"
                        secondary="Получать напоминания о предстоящих записях"
                      />
                      <ListItemSecondaryAction>
                    <Switch
                          edge="end"
                      checked={settings.notification.appointmentReminders}
                      onChange={handleSwitchChange('notification', 'appointmentReminders')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4caf50',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4caf50',
                            }
                          }}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem sx={{ 
                      p: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                    }}>
                      <ListItemText
                        primary="Маркетинговые рассылки"
                        secondary="Получать информацию о акциях и специальных предложениях"
                      />
                      <ListItemSecondaryAction>
                    <Switch
                          edge="end"
                      checked={settings.notification.marketingEmails}
                      onChange={handleSwitchChange('notification', 'marketingEmails')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  disabled={loading || !settings.notification.appointmentReminders} 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel>Время напоминания о записи</InputLabel>
                  <Select
                    value={settings.notification.reminderTime}
                    label="Время напоминания о записи"
                    onChange={(e) => handleTextChange('notification', 'reminderTime', e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      opacity: settings.notification.appointmentReminders ? 1 : 0.5,
                    }}
                  >
                    <MenuItem value={1}>За 1 час</MenuItem>
                    <MenuItem value={2}>За 2 часа</MenuItem>
                    <MenuItem value={12}>За 12 часов</MenuItem>
                    <MenuItem value={24}>За 24 часа</MenuItem>
                    <MenuItem value={48}>За 2 дня</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 3 : 4, 
              display: 'flex', 
              justifyContent: 'flex-end',
              flexDirection: isMobile ? 'column' : 'row',
              '& .MuiButton-root': {
                width: isMobile ? '100%' : 'auto',
                mt: isMobile ? 1 : 0,
              }
            }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('notification')}
                disabled={loading}
                size={isMobile ? "medium" : "large"}
                sx={{
                  ...saveButtonStyle,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0d8bf2 30%, #00b7e9 90%)',
                  }
                }}
              >
                {loading ? 
                  <CircularProgress size={24} sx={{ color: '#fff' }} /> : 
                  'Сохранить настройки'
                }
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек безопасности */}
      <TabPanel value={tabValue} index={3}>
        <Card sx={cardStyle}>
          <CardHeader 
            title="Настройки безопасности" 
            titleTypographyProps={{ 
              variant: isMobile ? 'h6' : 'h5',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.8)'
            }}
            action={
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={cardHeaderStyle}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.08)', border: '1px dashed rgba(244, 67, 54, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InfoIcon fontSize="small" sx={{ mr: 1, color: 'rgba(244, 67, 54, 0.8)' }} />
                Особенности Telegram Mini App
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Аутентификация в Telegram мини-приложении происходит через Telegram. 
                Эти настройки применяются для веб-версии и внешних платформ.
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ 
                  height: '100%', 
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 10px rgba(0, 0, 0, 0.5)' 
                      : '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <CardHeader 
                    title="Изменение пароля" 
                    avatar={<SecurityIcon color="primary" />}
                    titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
                  />
                  <CardContent>
                    <Box component="form" sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                        required
                        fullWidth
                        name="currentPassword"
                        label="Текущий пароль"
                        type="password"
                        id="currentPassword"
                        autoComplete="current-password"
                        variant="outlined"
                  size={isMobile ? "small" : "medium"}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton edge="end">
                                <VisibilityOffIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                <TextField
                  margin="normal"
                        required
                        fullWidth
                        name="newPassword"
                        label="Новый пароль"
                        type="password"
                        id="newPassword"
                        autoComplete="new-password"
                        variant="outlined"
                  size={isMobile ? "small" : "medium"}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton edge="end">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Подтвердите пароль"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        variant="outlined"
                      size={isMobile ? "small" : "medium"}
                    />
              <Button
                        type="submit"
                        fullWidth
                variant="contained"
                        sx={{ 
                          mt: 3, 
                          mb: 2,
                          borderRadius: '8px',
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          height: isMobile ? '36px' : '44px'
                        }}
                      >
                        Изменить пароль
              </Button>
            </Box>
          </CardContent>
        </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ 
                  height: '100%', 
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 10px rgba(0, 0, 0, 0.5)' 
                      : '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }
                }}>
          <CardHeader 
                    title="Двухфакторная аутентификация" 
                    avatar={<FingerprintIcon color="primary" />}
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
                  />
                  <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                          color="primary" 
                          checked={false} 
                          onChange={() => {}}
                        />
                      }
                      label="Включить двухфакторную аутентификацию"
                      sx={{ mb: 2 }}
                    />
                    
                <TextField
                  fullWidth
                      label="Email для подтверждения"
                      variant="outlined"
                  margin="normal"
                  size={isMobile ? "small" : "medium"}
                      defaultValue="example@email.com"
                      disabled={true}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Двухфакторная аутентификация добавляет дополнительный уровень безопасности для вашего аккаунта. 
                      При включении этой функции вам потребуется вводить код подтверждения при каждом входе в систему.
                </Typography>
                  </CardContent>
                </Card>
            </Grid>
            
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ 
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 4px 10px rgba(0, 0, 0, 0.5)' 
                      : '0 4px 10px rgba(0, 0, 0, 0.1)',
                  }
                }}>
          <CardHeader 
                    title="Активные сессии" 
                    avatar={<ExitToAppIcon color="primary" />}
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
          />
          <Divider />
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Windows 10 · Chrome" 
                        secondary="Москва, Россия · Сейчас"
                      />
                      <ListItemSecondaryAction>
                        <Typography 
                          variant="caption" 
                            sx={{ 
                            color: 'success.main',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                            px: 1,
                            py: 0.5,
                            borderRadius: '4px',
                            mr: 1
                          }}
                        >
                          Текущая
                            </Typography>
                            <Button
                              size="small"
                          variant="outlined" 
                          color="error"
                          sx={{ borderRadius: '6px' }}
                            >
                          Завершить
                            </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <TelegramIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Telegram Mini App" 
                        secondary="Санкт-Петербург, Россия · 2 часа назад"
                      />
                      <ListItemSecondaryAction>
                            <Button
                          size="small" 
                              variant="outlined"
                              color="error"
                          sx={{ borderRadius: '6px' }}
                            >
                          Завершить
                            </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                      <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                        <ListItemText
                        primary="Android · Chrome Mobile" 
                        secondary="Москва, Россия · 1 день назад"
                        />
                        <ListItemSecondaryAction>
                        <Button 
                          size="small" 
                          variant="outlined" 
                            color="error"
                          sx={{ borderRadius: '6px' }}
                          >
                          Завершить
                        </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                </List>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Обновленный Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            backdropFilter: 'blur(10px)',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(33, 33, 45, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            width: '100%', 
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPanel; 