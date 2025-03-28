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
  Fab
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
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import settingsApi from '../../api/settings';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';

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

// Начальное состояние настроек для случая, когда данные ещё не загружены
const initialSettings = {
  general: {
    companyName: '',
    adminEmail: '',
    defaultLanguage: 'ru',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h'
  },
  appearance: {
    theme: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    enableDarkMode: false,
    showLogo: true
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
  const { theme: currentTheme, language: currentLanguage, setTheme, setLanguage } = useThemeLanguage();

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
  const handleThemeChange = (theme) => {
    // Применяем новую тему
    applyTheme(theme);
    
    // Обновляем состояние
    handleTextChange('appearance', 'theme', theme);
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

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant={isMobile ? "h6" : "h5"} sx={{ mb: 3 }}>
        Настройки
      </Typography>
      
      {/* Десктопная версия вкладок */}
      {!isMobile && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabOptions.map((tab, index) => (
              <Tab key={index} icon={tab.icon} label={tab.label} />
            ))}
          </Tabs>
        </Box>
      )}
      
      {/* Мобильная версия с выпадающим списком вместо вкладок */}
      {isMobile && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Button 
              variant="outlined" 
              onClick={toggleMobileMenu}
              startIcon={<MenuIcon />}
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                p: 1.5,
                mb: 2,
                borderRadius: 2
              }}
            >
              {tabOptions[tabValue].label}
            </Button>
          </Box>
          
          <Drawer
            anchor="bottom"
            open={mobileMenuOpen}
            onClose={toggleMobileMenu}
            PaperProps={{
              sx: {
                maxHeight: '70%',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                pb: 2
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Выберите раздел</Typography>
                <IconButton onClick={toggleMobileMenu}>
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
                      mb: 1, 
                      borderRadius: 2,
                      bgcolor: tabValue === index ? 'action.selected' : 'inherit'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: tabValue === index ? 'primary.main' : 'action.disabledBackground' }}>
                        {tab.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={tab.label} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          
          {/* BottomNavigation для быстрого доступа к основным разделам */}
          <BottomNavigation
            value={tabValue}
            onChange={(event, newValue) => {
              setTabValue(newValue);
            }}
            showLabels
            sx={{ 
              position: 'fixed', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              zIndex: 1100,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: { xs: 'flex', sm: 'none' }
            }}
          >
            {tabOptions.slice(0, 5).map((tab, index) => (
              <BottomNavigationAction key={index} label={tab.label} icon={tab.icon} />
            ))}
          </BottomNavigation>
        </>
      )}
      
      {/* Загрузочный экран */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && !isDataLoaded}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      
      {/* Вкладка общих настроек */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader 
            title="Общие настройки" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
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
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Язык по умолчанию</InputLabel>
                  <Select
                    value={settings.general.defaultLanguage}
                    label="Язык по умолчанию"
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <MenuItem value="ru">Русский</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Формат даты</InputLabel>
                  <Select
                    value={settings.general.dateFormat}
                    label="Формат даты"
                    onChange={(e) => handleTextChange('general', 'dateFormat', e.target.value)}
                  >
                    <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Формат времени</InputLabel>
                  <Select
                    value={settings.general.timeFormat}
                    label="Формат времени"
                    onChange={(e) => handleTextChange('general', 'timeFormat', e.target.value)}
                  >
                    <MenuItem value="12h">12 часов (AM/PM)</MenuItem>
                    <MenuItem value="24h">24 часа</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 2 : 3, 
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
                size={isMobile ? "small" : "medium"}
              >
                {loading ? <CircularProgress size={24} /> : 'Сохранить'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек внешнего вида */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader 
            title="Настройки внешнего вида" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Тема оформления</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    label="Тема оформления"
                    onChange={(e) => handleThemeChange(e.target.value)}
                  >
                    <MenuItem value="light">Светлая</MenuItem>
                    <MenuItem value="dark">Темная</MenuItem>
                    <MenuItem value="system">Системная</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Основной цвет"
                  type="color"
                  value={settings.appearance.primaryColor}
                  onChange={(e) => handleTextChange('appearance', 'primaryColor', e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Дополнительный цвет"
                  type="color"
                  value={settings.appearance.secondaryColor}
                  onChange={(e) => handleTextChange('appearance', 'secondaryColor', e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.showLogo}
                      onChange={handleSwitchChange('appearance', 'showLogo')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Показывать логотип"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 2 : 3, 
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
                onClick={() => handleSaveSettings('appearance')}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {loading ? <CircularProgress size={24} /> : 'Сохранить'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек уведомлений */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardHeader 
            title="Настройки уведомлений" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notification.emailNotifications}
                      onChange={handleSwitchChange('notification', 'emailNotifications')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Email-уведомления"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notification.smsNotifications}
                      onChange={handleSwitchChange('notification', 'smsNotifications')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="SMS-уведомления"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notification.appointmentReminders}
                      onChange={handleSwitchChange('notification', 'appointmentReminders')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Напоминания о записях"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notification.marketingEmails}
                      onChange={handleSwitchChange('notification', 'marketingEmails')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Маркетинговые рассылки"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Время напоминания о записи</InputLabel>
                  <Select
                    value={settings.notification.reminderTime}
                    label="Время напоминания о записи"
                    onChange={(e) => handleTextChange('notification', 'reminderTime', e.target.value)}
                  >
                    <MenuItem value={1}>1 час до записи</MenuItem>
                    <MenuItem value={2}>2 часа до записи</MenuItem>
                    <MenuItem value={12}>12 часов до записи</MenuItem>
                    <MenuItem value={24}>24 часа до записи</MenuItem>
                    <MenuItem value={48}>48 часов до записи</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 2 : 3, 
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
                size={isMobile ? "small" : "medium"}
              >
                {loading ? <CircularProgress size={24} /> : 'Сохранить'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек безопасности */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardHeader 
            title="Настройки безопасности" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={handleSwitchChange('security', 'twoFactorAuth')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Двухфакторная аутентификация"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Срок действия пароля (дней)"
                  type="number"
                  value={settings.security.passwordExpiryDays}
                  onChange={(e) => handleTextChange('security', 'passwordExpiryDays', e.target.value)}
                  margin="normal"
                  InputProps={{ inputProps: { min: 0 } }}
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Таймаут сессии (минут)"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleTextChange('security', 'sessionTimeout', e.target.value)}
                  margin="normal"
                  InputProps={{ inputProps: { min: 1 } }}
                  disabled={loading}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.allowRegistration}
                      onChange={handleSwitchChange('security', 'allowRegistration')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Разрешить регистрацию новых пользователей"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 2 : 3, 
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
                onClick={() => handleSaveSettings('security')}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {loading ? <CircularProgress size={24} /> : 'Сохранить'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек резервного копирования */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardHeader 
            title="Настройки резервного копирования" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.backup.autoBackup}
                      onChange={handleSwitchChange('backup', 'autoBackup')}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    />
                  }
                  label="Автоматическое резервное копирование"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" disabled={loading || !settings.backup.autoBackup} size={isMobile ? "small" : "medium"}>
                  <InputLabel>Частота резервного копирования</InputLabel>
                  <Select
                    value={settings.backup.backupFrequency}
                    label="Частота резервного копирования"
                    onChange={(e) => handleTextChange('backup', 'backupFrequency', e.target.value)}
                  >
                    <MenuItem value="daily">Ежедневно</MenuItem>
                    <MenuItem value="weekly">Еженедельно</MenuItem>
                    <MenuItem value="biweekly">Раз в две недели</MenuItem>
                    <MenuItem value="monthly">Ежемесячно</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Срок хранения резервных копий (дней)"
                  type="number"
                  value={settings.backup.retentionPeriod}
                  onChange={(e) => handleTextChange('backup', 'retentionPeriod', e.target.value)}
                  margin="normal"
                  InputProps={{ inputProps: { min: 1 } }}
                  disabled={loading || !settings.backup.autoBackup}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Последнее резервное копирование: {new Date(settings.backup.lastBackup).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ 
              mt: isMobile ? 2 : 3, 
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
                onClick={handleCreateBackup}
                disabled={loadingBackup}
                startIcon={loadingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
                size={isMobile ? "small" : "medium"}
              >
                {loadingBackup ? 'Создание резервной копии...' : 'Создать резервную копию'}
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('backup')}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {loading ? <CircularProgress size={24} /> : 'Сохранить настройки'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка управления пользователями */}
      <TabPanel value={tabValue} index={5}>
        <Card>
          <CardHeader 
            title="Управление пользователями" 
            titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
            action={
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={fetchUsers}
                disabled={loading}
                size={isMobile ? "small" : "medium"}
              >
                {isMobile ? "" : "Обновить"}
              </Button>
            }
            sx={{ 
              p: isMobile ? 2 : 3,
              '& .MuiCardHeader-action': {
                m: isMobile ? 0 : 'auto',
              }
            }}
          />
          <Divider />
          <CardContent sx={{ p: isMobile ? 2 : 3, pb: isMobile ? 8 : 3 }}>
            {users.length > 0 ? (
              isMobile ? (
                // Мобильная версия списка пользователей с аккордеонами
                <Box>
                  {users.map((user) => (
                    <Accordion 
                      key={`accordion-${user.user_type}-${user.id}`}
                      sx={{ mb: 1, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ px: 2, py: 1 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: user.user_type === 'employee' ? 'primary.main' : 'secondary.main',
                              width: 32,
                              height: 32,
                              mr: 1.5
                            }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" noWrap>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {user.email}
                            </Typography>
                          </Box>
                          <Chip
                            label={user.status === 'active' ? 'Активен' : 'Неактивен'}
                            color={getUserStatusColor(user.status)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
                        <Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Тип:
                            </Typography>
                            <Chip 
                              label={user.user_type === 'employee' ? 'Сотрудник' : 'Клиент'} 
                              size="small" 
                              color={user.user_type === 'employee' ? 'primary' : 'secondary'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          
                          {user.user_type === 'employee' && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Роль:
                              </Typography>
                              <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                                {getUserRoleText(user.role)}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', mt: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => handleOpenEditUserDialog(user)}
                              disabled={loading}
                              fullWidth
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              Изменить
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleOpenDeleteDialog(user)}
                              color="error"
                              disabled={loading}
                              fullWidth
                              size="small"
                            >
                              Удалить
                            </Button>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                // Десктопная версия списка пользователей
                <List>
                  {users.map((user) => (
                    <React.Fragment key={`${user.user_type}-${user.id}`}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: user.user_type === 'employee' ? 'primary.main' : 'secondary.main' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              {user.name}
                              <Chip 
                                label={user.user_type === 'employee' ? 'Сотрудник' : 'Клиент'} 
                                size="small" 
                                color={user.user_type === 'employee' ? 'primary' : 'secondary'}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {user.email}
                              </Typography>
                              {user.user_type === 'employee' && (
                                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                  {getUserRoleText(user.role)}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                        <Chip
                          label={user.status === 'active' ? 'Активен' : 'Неактивен'}
                          color={getUserStatusColor(user.status)}
                          size="small"
                          sx={{ mr: 2 }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="edit" 
                            onClick={() => handleOpenEditUserDialog(user)}
                            disabled={loading}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            onClick={() => handleOpenDeleteDialog(user)}
                            color="error"
                            sx={{ ml: 1 }}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )
            ) : (
              <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
                {loading ? 'Загрузка пользователей...' : 'Пользователи не найдены'}
              </Typography>
            )}
          </CardContent>
        </Card>
        
        {/* Плавающая кнопка для добавления пользователя на мобильных устройствах */}
        {isMobile && (
          <Fab 
            color="primary" 
            aria-label="add user" 
            sx={{ position: 'fixed', bottom: 80, right: 16 }}
            onClick={handleOpenAddUserDialog}
          >
            <PersonAddIcon />
          </Fab>
        )}
      </TabPanel>
      
      {/* Диалог редактирования пользователя */}
      <Dialog 
        open={openUserDialog} 
        onClose={handleCloseUserDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Редактировать пользователя
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Имя"
              value={selectedUser?.name || ''}
              margin="normal"
              disabled={true}
              size={isMobile ? "small" : "medium"}
            />
            <TextField
              fullWidth
              label="Email"
              value={selectedUser?.email || ''}
              margin="normal"
              disabled={true}
              size={isMobile ? "small" : "medium"}
            />
            
            {selectedUser?.user_type === 'employee' && (
              <FormControl fullWidth margin="normal" size={isMobile ? "small" : "medium"}>
                <InputLabel>Роль</InputLabel>
                <Select
                  value={selectedUser?.role || ''}
                  label="Роль"
                  onChange={(e) => handleUserChange('role', e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="admin">Администратор</MenuItem>
                  <MenuItem value="manager">Менеджер</MenuItem>
                  <MenuItem value="employee">Сотрудник</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <FormControl fullWidth margin="normal" size={isMobile ? "small" : "medium"}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={selectedUser?.status || ''}
                label="Статус"
                onChange={(e) => handleUserChange('status', e.target.value)}
                disabled={loading}
              >
                <MenuItem value="active">Активен</MenuItem>
                <MenuItem value="inactive">Неактивен</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: isMobile ? 'column' : 'row',
          p: isMobile ? 2 : 'inherit',
          '& .MuiButton-root': {
            width: isMobile ? '100%' : 'auto',
            m: isMobile ? 0.5 : 0,
          }
        }}>
          <Button onClick={handleCloseUserDialog} disabled={loading} variant={isMobile ? "outlined" : "text"}>
            Отмена
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог подтверждения удаления пользователя */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullScreen={isMobile}
      >
        <DialogTitle id="alert-dialog-title">
          Подтвердите удаление пользователя
        </DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Вы действительно хотите полностью удалить пользователя <strong>{userToDelete.name}</strong> из базы данных?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                <strong>Внимание:</strong> Это действие необратимо. Вся информация об этом пользователе будет безвозвратно удалена.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          flexDirection: isMobile ? 'column' : 'row',
          p: isMobile ? 2 : 'inherit',
          '& .MuiButton-root': {
            width: isMobile ? '100%' : 'auto',
            m: isMobile ? 0.5 : 0,
          }
        }}>
          <Button onClick={handleCloseDeleteDialog} variant={isMobile ? "outlined" : "text"}>Отмена</Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained" 
            startIcon={<DeleteIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Удалить навсегда'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={isMobile ? { vertical: 'bottom', horizontal: 'center' } : { vertical: 'bottom', horizontal: 'left' }}
        sx={{
          width: isMobile ? '100%' : 'auto',
          bottom: isMobile ? 56 : 24, // Учитываем высоту BottomNavigation
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPanel; 