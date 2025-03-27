import React, { useState } from 'react';
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
  Chip
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
  Add as AddIcon
} from '@mui/icons-material';

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

// Моковые данные для настроек
const initialSettings = {
  general: {
    companyName: 'Сеть салонов красоты',
    adminEmail: 'admin@example.com',
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
    lastBackup: '2023-05-10T15:30:00Z'
  },
  users: [
    { id: 1, name: 'Администратор', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Менеджер Салона 1', email: 'manager1@example.com', role: 'manager', status: 'active' },
    { id: 3, name: 'Менеджер Салона 2', email: 'manager2@example.com', role: 'manager', status: 'inactive' },
    { id: 4, name: 'Сотрудник', email: 'employee@example.com', role: 'employee', status: 'active' }
  ]
};

const SettingsPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState(initialSettings);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogMode, setUserDialogMode] = useState('add'); // 'add' or 'edit'

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
  const handleSaveSettings = (section) => {
    // Здесь будет отправка настроек на сервер
    console.log(`Saving ${section} settings:`, settings[section]);
    setSnackbar({
      open: true,
      message: `Настройки раздела "${section}" успешно сохранены`,
      severity: 'success'
    });
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
    setUserDialogMode('edit');
    setSelectedUser({ ...user });
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
  const handleSaveUser = () => {
    if (userDialogMode === 'add') {
      // Добавление нового пользователя
      const newUser = {
        ...selectedUser,
        id: Math.max(...settings.users.map(u => u.id)) + 1
      };
      setSettings(prev => ({
        ...prev,
        users: [...prev.users, newUser]
      }));
      setSnackbar({
        open: true,
        message: 'Пользователь успешно добавлен',
        severity: 'success'
      });
    } else {
      // Обновление существующего пользователя
      setSettings(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === selectedUser.id ? selectedUser : u)
      }));
      setSnackbar({
        open: true,
        message: 'Данные пользователя успешно обновлены',
        severity: 'success'
      });
    }
    handleCloseUserDialog();
  };

  // Удаление пользователя
  const handleDeleteUser = (userId) => {
    setSettings(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
    setSnackbar({
      open: true,
      message: 'Пользователь успешно удален',
      severity: 'success'
    });
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

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Настройки
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Общие" />
          <Tab icon={<ColorLensIcon />} label="Внешний вид" />
          <Tab icon={<NotificationsIcon />} label="Уведомления" />
          <Tab icon={<SecurityIcon />} label="Безопасность" />
          <Tab icon={<BackupIcon />} label="Резервное копирование" />
          <Tab icon={<PersonIcon />} label="Пользователи" />
        </Tabs>
      </Box>
      
      {/* Вкладка общих настроек */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader title="Общие настройки" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Название компании"
                  value={settings.general.companyName}
                  onChange={(e) => handleTextChange('general', 'companyName', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email администратора"
                  value={settings.general.adminEmail}
                  onChange={(e) => handleTextChange('general', 'adminEmail', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Язык по умолчанию</InputLabel>
                  <Select
                    value={settings.general.defaultLanguage}
                    label="Язык по умолчанию"
                    onChange={(e) => handleTextChange('general', 'defaultLanguage', e.target.value)}
                  >
                    <MenuItem value="ru">Русский</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
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
                <FormControl fullWidth margin="normal">
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
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('general')}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек внешнего вида */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader title="Настройки внешнего вида" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Тема оформления</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    label="Тема оформления"
                    onChange={(e) => handleTextChange('appearance', 'theme', e.target.value)}
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.enableDarkMode}
                      onChange={handleSwitchChange('appearance', 'enableDarkMode')}
                    />
                  }
                  label="Включить поддержку темного режима"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.showLogo}
                      onChange={handleSwitchChange('appearance', 'showLogo')}
                    />
                  }
                  label="Показывать логотип"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('appearance')}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек уведомлений */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardHeader title="Настройки уведомлений" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notification.emailNotifications}
                      onChange={handleSwitchChange('notification', 'emailNotifications')}
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
                    />
                  }
                  label="Маркетинговые рассылки"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
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
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('notification')}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек безопасности */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardHeader title="Настройки безопасности" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={handleSwitchChange('security', 'twoFactorAuth')}
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
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.allowRegistration}
                      onChange={handleSwitchChange('security', 'allowRegistration')}
                    />
                  }
                  label="Разрешить регистрацию новых пользователей"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('security')}
              >
                Сохранить
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Вкладка настроек резервного копирования */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardHeader title="Настройки резервного копирования" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.backup.autoBackup}
                      onChange={handleSwitchChange('backup', 'autoBackup')}
                    />
                  }
                  label="Автоматическое резервное копирование"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Частота резервного копирования</InputLabel>
                  <Select
                    value={settings.backup.backupFrequency}
                    label="Частота резервного копирования"
                    onChange={(e) => handleTextChange('backup', 'backupFrequency', e.target.value)}
                    disabled={!settings.backup.autoBackup}
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
                  disabled={!settings.backup.autoBackup}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Последнее резервное копирование: {new Date(settings.backup.lastBackup).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // Здесь будет логика создания резервной копии
                  const now = new Date().toISOString();
                  setSettings(prev => ({
                    ...prev,
                    backup: { ...prev.backup, lastBackup: now }
                  }));
                  setSnackbar({
                    open: true,
                    message: 'Резервная копия успешно создана',
                    severity: 'success'
                  });
                }}
              >
                Создать резервную копию
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveSettings('backup')}
              >
                Сохранить настройки
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
            action={
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddUserDialog}
              >
                Добавить пользователя
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <List>
              {settings.users.map((user) => (
                <React.Fragment key={user.id}>
                  <ListItem>
                    <ListItemText
                      primary={user.name}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {user.email}
                          </Typography>
                          <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                            {getUserRoleText(user.role)}
                          </Typography>
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
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditUserDialog(user)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        sx={{ ml: 1 }}
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Диалог добавления/редактирования пользователя */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {userDialogMode === 'add' ? 'Добавить пользователя' : 'Редактировать пользователя'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Имя"
              value={selectedUser?.name || ''}
              onChange={(e) => handleUserChange('name', e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={selectedUser?.email || ''}
              onChange={(e) => handleUserChange('email', e.target.value)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Роль</InputLabel>
              <Select
                value={selectedUser?.role || 'employee'}
                label="Роль"
                onChange={(e) => handleUserChange('role', e.target.value)}
              >
                <MenuItem value="admin">Администратор</MenuItem>
                <MenuItem value="manager">Менеджер</MenuItem>
                <MenuItem value="employee">Сотрудник</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Статус</InputLabel>
              <Select
                value={selectedUser?.status || 'active'}
                label="Статус"
                onChange={(e) => handleUserChange('status', e.target.value)}
              >
                <MenuItem value="active">Активен</MenuItem>
                <MenuItem value="inactive">Неактивен</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveUser}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
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