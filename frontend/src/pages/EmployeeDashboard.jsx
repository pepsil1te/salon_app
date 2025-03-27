import React from 'react';
import { Box, CssBaseline, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import EmployeeNavigation from '../components/employee/EmployeeNavigation';

const EmployeeDashboard = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <EmployeeNavigation />
        <Box sx={{ mt: 2 }}>
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
};

export default EmployeeDashboard; 