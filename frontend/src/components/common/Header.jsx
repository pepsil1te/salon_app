import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import LoginIcon from '@mui/icons-material/Login';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ThemeLanguageSwitcher from './ThemeLanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { t } = useTranslation();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleNavigateProfile = () => {
    handleMenuClose();
    // Навигация на соответствующую страницу в зависимости от роли
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'employee') {
      navigate('/employee');
    } else {
      navigate('/client');
    }
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }} 
          onClick={() => navigate('/')}
        >
          {t('common.beauty_salon')}
        </Typography>
        
        <ThemeLanguageSwitcher />
        
        {user ? (
          <>
            <Tooltip title={t('common.profile')}>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircleIcon />}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleNavigateProfile}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                {user.role === 'admin' ? t('header.admin_panel') : 
                user.role === 'employee' ? t('header.employee_panel') : t('header.client_panel')}
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                {t('common.logout')}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button 
            color="primary" 
            startIcon={<LoginIcon />} 
            onClick={handleLogin}
          >
            {t('common.login')}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 