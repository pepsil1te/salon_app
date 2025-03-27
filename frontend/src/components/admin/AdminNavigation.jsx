import React, { useState } from 'react';
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
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
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
  const { logout } = useAuthContext();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Название вкладок
  const tabs = [
    { label: 'Салоны', icon: <StoreIcon /> },
    { label: 'Услуги', icon: <SpaIcon /> },
    { label: 'Сотрудники', icon: <PeopleIcon /> },
    { label: 'Отчеты', icon: <BarChartIcon /> },
    { label: 'Настройки', icon: <SettingsIcon /> }
  ];

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
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        <SalonManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <ServiceManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <EmployeeManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <ReportsAndStatistics />
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        <SettingsPanel />
      </TabPanel>
    </Box>
  );
};

export default AdminNavigation; 