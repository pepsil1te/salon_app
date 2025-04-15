import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import Header from '../components/common/Header';

/**
 * Общий макет для публичных страниц
 */
const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="lg" sx={{ pt: 3, pb: 6, flexGrow: 1 }}>
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        &copy; {new Date().getFullYear()} Beauty Salon. Все права защищены.
      </Box>
    </Box>
  );
};

export default PublicLayout; 