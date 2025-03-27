import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import TodayIcon from '@mui/icons-material/Today';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpaIcon from '@mui/icons-material/Spa';
import LogoutIcon from '@mui/icons-material/Logout';

const EmployeeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthContext();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Set the active tab based on the current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/appointments')) {
      setTabValue(0);
    } else if (path.includes('/schedule')) {
      setTabValue(1);
    } else if (path.includes('/services')) {
      setTabValue(2);
    } else if (path.includes('/performance')) {
      setTabValue(3);
    }
  }, [location]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/employee/appointments');
        break;
      case 1:
        navigate('/employee/schedule');
        break;
      case 2:
        navigate('/employee/services');
        break;
      case 3:
        navigate('/employee/performance');
        break;
      default:
        navigate('/employee/appointments');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ 
        borderRadius: 0, 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          aria-label="employee dashboard tabs"
          sx={{ flexGrow: 1 }}
        >
          <Tab 
            icon={<TodayIcon />} 
            label="Записи" 
            sx={{ py: 2 }}
          />
          <Tab 
            icon={<AccessTimeIcon />} 
            label="Расписание" 
            sx={{ py: 2 }}
          />
          <Tab 
            icon={<SpaIcon />} 
            label="Услуги" 
            sx={{ py: 2 }}
          />
          <Tab 
            icon={<BarChartIcon />} 
            label="Статистика" 
            sx={{ py: 2 }}
          />
        </Tabs>
        
        {isMobile ? (
          <Tooltip title="Выход">
            <IconButton 
              color="primary" 
              onClick={handleLogout}
              sx={{ ml: 1, mr: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2, mr: 2 }}
          >
            Выход
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default EmployeeNavigation; 