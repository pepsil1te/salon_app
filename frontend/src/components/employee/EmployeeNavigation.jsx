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
  useTheme,
  Typography,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { salonApi } from '../../api/salons';
import TodayIcon from '@mui/icons-material/Today';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpaIcon from '@mui/icons-material/Spa';
import LogoutIcon from '@mui/icons-material/Logout';

const EmployeeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthContext();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [singleSalonMode, setSingleSalonMode] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState(null);

  // Fetch salons to check if there's only one
  const { data: salons, isLoading: isLoadingSalons, error: salonsError } = useQuery(
    'salons',
    () => salonApi.getAll(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data && data.length === 1) {
          // If there's only one salon, set to single salon mode
          setSingleSalonMode(true);
          setSelectedSalonId(data[0].id);
          setSalonName(data[0].name);
          
          // For employees with a single salon, we also want to store their salon ID
          if (user && user.role === 'employee') {
            localStorage.setItem('employeeSalonId', data[0].id);
          }
        }
      }
    }
  );

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

  // If loading, show a loading indicator
  if (isLoadingSalons) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // If error, show a subtle error message
  if (salonsError) {
    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Не удалось загрузить информацию о салоне. Некоторые функции могут быть недоступны.
        </Alert>
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
            <Tab icon={<TodayIcon />} label="Записи" sx={{ py: 2 }} />
            <Tab icon={<AccessTimeIcon />} label="Расписание" sx={{ py: 2 }} />
            <Tab icon={<SpaIcon />} label="Услуги" sx={{ py: 2 }} />
            <Tab icon={<BarChartIcon />} label="Статистика" sx={{ py: 2 }} />
          </Tabs>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2, mr: 2 }}
          >
            Выход
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ 
        borderRadius: 0, 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch'
      }}>
        {singleSalonMode && (
          <Box sx={{ 
            p: 1, 
            bgcolor: 'primary.light', 
            color: 'primary.contrastText',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center' 
          }}>
            <Typography variant="subtitle1" component="div">
              Салон: <strong>{salonName}</strong>
              <Chip 
                label="Активен" 
                size="small" 
                color="success" 
                sx={{ ml: 1, height: 20 }} 
              />
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
              label={isMobile ? undefined : "Записи"}
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<AccessTimeIcon />} 
              label={isMobile ? undefined : "Расписание"}
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<SpaIcon />} 
              label={isMobile ? undefined : "Услуги"}
              sx={{ py: 2 }}
            />
            <Tab 
              icon={<BarChartIcon />} 
              label={isMobile ? undefined : "Статистика"}
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
        </Box>
      </Paper>
    </Box>
  );
};

export default EmployeeNavigation; 