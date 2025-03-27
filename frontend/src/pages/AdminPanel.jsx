import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Container } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import AdminNavigation from '../components/admin/AdminNavigation';

const AdminPanel = () => {
  const location = useLocation();
  const [showOutlet, setShowOutlet] = useState(true);
  
  useEffect(() => {
    // Don't show the outlet on the main salons page where SalonManagement is rendered directly
    setShowOutlet(location.pathname !== '/admin/salons');
  }, [location]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <AdminNavigation />
        <Box sx={{ mt: 2 }}>
          {showOutlet && <Outlet />}
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPanel; 