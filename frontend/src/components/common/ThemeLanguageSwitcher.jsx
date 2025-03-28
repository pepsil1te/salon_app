import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  Switch,
  useTheme
} from '@mui/material';
import { 
  Brightness4 as DarkModeIcon, 
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';
import { useThemeLanguage } from '../../contexts/ThemeLanguageContext';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Стилизованный Switch для темы
const ThemeSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

// Стилизованный компонент для флага
const FlagIcon = styled(Box)(({ theme }) => ({
  width: 24,
  height: 18,
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
  borderRadius: 2,
  overflow: 'hidden',
  boxShadow: `0 1px 2px ${theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }
}));

// Компонент переключения темы и языка
const ThemeLanguageSwitcher = () => {
  const { theme, language, setTheme, setLanguage } = useThemeLanguage();
  const muiTheme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation();

  // Открыть меню
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Закрыть меню
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Переключение темы
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    handleClose();
  };

  // Переключение языка
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    handleClose();
  };

  return (
    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
      <Tooltip title={t('appearance.settings')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            ml: 1,
            color: open ? 'primary.main' : 'inherit',
            '&:hover': {
              backgroundColor: muiTheme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.04)'
            }
          }}
          aria-controls={open ? 'appearance-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="appearance-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: 2,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 500 }}>
            {t('appearance.title')}
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Секция темы */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('appearance.theme')}
          </Typography>
          
          <MenuItem 
            selected={theme === 'light'} 
            onClick={() => handleThemeChange('light')}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <LightModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('appearance.light')}</ListItemText>
          </MenuItem>
          
          <MenuItem 
            selected={theme === 'dark'} 
            onClick={() => handleThemeChange('dark')}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <DarkModeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('appearance.dark')}</ListItemText>
          </MenuItem>
          
          <MenuItem 
            selected={theme === 'system'} 
            onClick={() => handleThemeChange('system')}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <ComputerIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('appearance.system')}</ListItemText>
          </MenuItem>
        </Box>
        
        <Divider />
        
        {/* Секция языка */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('appearance.language')}
          </Typography>
          
          <MenuItem 
            selected={language === 'ru'} 
            onClick={() => handleLanguageChange('ru')}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <FlagIcon>
                <img 
                  src="/images/flags/ru.svg"
                  alt="Русский"
                  onError={(e) => {
                    e.target.src = "https://flagcdn.com/w40/ru.png";
                  }}
                />
              </FlagIcon>
            </ListItemIcon>
            <ListItemText>{t('appearance.russian')}</ListItemText>
          </MenuItem>
          
          <MenuItem 
            selected={language === 'en'} 
            onClick={() => handleLanguageChange('en')}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon>
              <FlagIcon>
                <img 
                  src="/images/flags/us.svg"
                  alt="English"
                  onError={(e) => {
                    e.target.src = "https://flagcdn.com/w40/us.png";
                  }}
                />
              </FlagIcon>
            </ListItemIcon>
            <ListItemText>{t('appearance.english')}</ListItemText>
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  );
};

export default ThemeLanguageSwitcher; 