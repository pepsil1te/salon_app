import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Компонент для отображения страницы 404 (Not Found)
 * @returns {React.ReactNode}
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h3" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Страница не найдена
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400 }}>
          Извините, но запрашиваемая вами страница не существует или была перемещена.
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
          >
            На главную
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Назад
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound; 