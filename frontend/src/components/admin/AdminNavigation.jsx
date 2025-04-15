import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { salonApi } from '../../api/salons';
import SalonManagement from './SalonManagement';
import ServiceManagement from './ServiceManagement';
import EmployeeManagement from './EmployeeManagement';
import ReportsAndStatistics from './ReportsAndStatistics';
import SettingsPanel from './SettingsPanel';
import StoreIcon from '@mui/icons-material/Store';
import SpaIcon from '@mui/icons-material/Spa';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminNavigation = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthContext();
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [singleSalonMode, setSingleSalonMode] = useState(false);
  const [salonName, setSalonName] = useState("");

  // Check if we have state passed from navigation
  useEffect(() => {
    if (location.state) {
      // If activeTab is provided, switch to that tab
      if (location.state.activeTab !== undefined) {
        console.log('Setting active tab from state:', location.state.activeTab);
        setTabValue(location.state.activeTab);
      }
      
      // If salonId is provided, set it for reports
      if (location.state.salonId) {
        console.log('Setting salon ID from state:', location.state.salonId);
        setSelectedSalonId(location.state.salonId);
      }
      
      // If reportType is provided, set it for the reports component
      if (location.state.reportType) {
        console.log('Setting report type from state:', location.state.reportType);
        setSelectedReportType(location.state.reportType);
      }
      
      // Clear the state after using it to prevent it from persisting
      // on page refresh or future navigations
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
          localStorage.setItem('selectedSalonIdForServices', data[0].id);
        }
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Simplified tabs configuration with only 3 buttons
  const tabs = [
    { label: 'Салоны', icon: <StoreIcon /> },
    { label: 'Отчеты', icon: <BarChartIcon /> },
    { label: 'Настройки', icon: <SettingsIcon /> }
  ];

  // If loading, show a loading indicator
  if (isLoadingSalons) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show an error message
  if (salonsError) {
    return (
      <Alert severity="error">
        Ошибка при загрузке данных салонов. Пожалуйста, обновите страницу.
      </Alert>
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
        alignItems: 'stretch',
        boxShadow: 'none', // Remove shadow to avoid conflict with other elements
        borderBottom: '1px solid',
        borderColor: 'divider'
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
            aria-label="admin dashboard tabs"
            sx={{ flexGrow: 1 }}
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={index}
                icon={tab.icon} 
                label={isMobile ? undefined : tab.label} 
                aria-label={tab.label}
                {...a11yProps(index)} 
                sx={{ py: 2 }}
              />
            ))}
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
      
      {/* Add CSS to override problematic styles */}
      <style jsx="true">{`
        .MuiBottomNavigation-root.css-rkp8j5-MuiBottomNavigation-root {
          display: none !important;
        }
      `}</style>
      
      {/* Updated TabPanels to match the simplified navigation */}
      <TabPanel value={tabValue} index={0}>
        <SalonManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <ReportsAndStatistics salonId={selectedSalonId} reportType={selectedReportType} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <SettingsPanel />
      </TabPanel>
    </Box>
  );
};

export default AdminNavigation; 