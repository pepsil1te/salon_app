import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Grid
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { serviceApi } from '../../api/services';
import { useAuthContext } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';
import SortIcon from '@mui/icons-material/Sort';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const ServiceCategoryManager = ({ salonId }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    color: '#3f51b5',
    sort_order: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [extractedCategories, setExtractedCategories] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Градиенты для оформления
  const primaryGradient = theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)'
    : 'linear-gradient(135deg, #673ab7 20%, #9c27b0 90%)';
  
  const lightGradient = theme.palette.mode === 'dark' 
    ? 'linear-gradient(90deg, rgba(103, 58, 183, 0.15) 0%, rgba(0,0,0,0) 100%)'
    : 'linear-gradient(90deg, rgba(103, 58, 183, 0.1) 0%, rgba(255,255,255,0) 100%)';

  // Fetch categories for the salon
  const { 
    data: categories, 
    isLoading: isLoadingCategories, 
    error: categoriesError 
  } = useQuery(
    ['serviceCategories', salonId],
    () => serviceApi.getCategories(salonId),
    {
      enabled: !!salonId,
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при загрузке категорий: ${error.message}`,
          severity: 'error'
        });
        setIsError(true);
      }
    }
  );

  // Fetch all services to extract categories if needed
  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError
  } = useQuery(
    ['services', salonId],
    () => serviceApi.getBySalon(salonId),
    {
      enabled: !!salonId,
      onSuccess: (data) => {
        if (data && data.length > 0) {
          // Extract unique categories from services
          const uniqueCategories = [...new Set(data.map(service => service.category))]
            .filter(Boolean)
            .map((name, index) => ({
              id: `temp-${index}`,
              name,
              description: '',
              color: getRandomColor(name),
              sort_order: index,
              salon_id: salonId,
              is_temporary: true // Mark as temporary to distinguish from actual categories
            }));
          
          setExtractedCategories(uniqueCategories);
          console.log("Extracted categories from services:", uniqueCategories);
        }
      }
    }
  );

  // Generate a consistent color based on category name
  const getRandomColor = (name) => {
    const colors = [
      '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50',
      '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    // Use the sum of character codes to create a deterministic color
    const charSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  // Create category mutation
  const createCategoryMutation = useMutation(
    (categoryData) => serviceApi.createCategory(categoryData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['serviceCategories', salonId]);
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Категория успешно создана',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при создании категории: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Update category mutation
  const updateCategoryMutation = useMutation(
    ({ id, data }) => serviceApi.updateCategory(id, data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['serviceCategories', salonId]);
        
        // Обновляем все услуги, которые используют эту категорию
        if (services && selectedCategory) {
          // Находим услуги с данной категорией
          const servicesWithCategory = services.filter(
            service => service.category === selectedCategory.name
          );
          
          if (servicesWithCategory.length > 0) {
            // Обновить все услуги, используя параллельные запросы
            Promise.all(servicesWithCategory.map(service => {
              // Создаем обновленный объект услуги с новым названием категории
              const updatedService = {
                ...service,
                category: formValues.name,
                category_id: selectedCategory.id
              };
              
              return serviceApi.update(service.id, updatedService);
            }))
            .then(() => {
              // После обновления всех услуг обновляем кэш
              queryClient.invalidateQueries(['services', salonId]);
              console.log(`Обновлено ${servicesWithCategory.length} услуг с новой категорией`);
            })
            .catch(err => {
              console.error('Ошибка при обновлении услуг с новой категорией:', err);
            });
          }
        }
        
        handleCloseDialog();
        setSnackbar({
          open: true,
          message: 'Категория успешно обновлена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при обновлении категории: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    (categoryId) => serviceApi.deleteCategory(categoryId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['serviceCategories', salonId]);
        handleCloseDeleteDialog();
        setSnackbar({
          open: true,
          message: 'Категория успешно удалена',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Ошибка при удалении категории: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );

  // Open dialog for adding a new category
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setFormValues({
      name: '',
      description: '',
      color: '#3f51b5',
      sort_order: categories?.length || 0,
      salon_id: salonId
    });
    setValidationErrors({});
    setDialogOpen(true);
  };

  // Handle creating a category from an extracted category
  const handleCreateFromExtracted = (category) => {
    // Pre-fill the form with extracted category data
    setSelectedCategory({
      name: category.name,
      description: '',
      color: category.color || getRandomColor(),
      sort_order: Math.max(0, ...categories.map(c => c.sort_order || 0)) + 10
    });
    setEditMode(false);
    setDialogOpen(true);
  };

  // Open dialog for editing a category
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormValues({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3f51b5',
      sort_order: category.sort_order || 0,
      salon_id: salonId
    });
    setValidationErrors({});
    setDialogOpen(true);
  };

  // Open dialog for deleting a category
  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  // Close the edit/add dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Close the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is modified
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formValues.name.trim()) {
      errors.name = 'Название категории обязательно';
    }
    
    if (formValues.name.length > 50) {
      errors.name = 'Название категории не должно превышать 50 символов';
    }
    
    if (formValues.description && formValues.description.length > 200) {
      errors.description = 'Описание не должно превышать 200 символов';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form to create or update a category
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    if (selectedCategory) {
      // Update existing category
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        data: formValues
      });
    } else {
      // Create new category
      createCategoryMutation.mutate(formValues);
    }
  };

  // Confirm and delete a category
  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };

  // Filter categories based on search query
  const filteredCategories = (categories || [])
    .filter(category => !category.is_extracted) // Filter out extracted categories
    .filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Filter extracted categories based on search query
  const filteredExtractedCategories = (categories || [])
    .filter(category => category.is_extracted)
    .filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Determine if we need to show the existing categories from services
  const shouldShowExtractedCategories = filteredExtractedCategories.length > 0;
  const noCategoriesToShow = filteredCategories.length === 0 && !shouldShowExtractedCategories;

  // Loading state
  if (isLoadingCategories && isLoadingServices) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (categoriesError && servicesError) {
    return (
      <Alert 
        severity="error" 
        sx={{ mt: 2 }}
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={() => queryClient.invalidateQueries(['serviceCategories', salonId])}
          >
            Повторить
          </Button>
        }
      >
        Ошибка при загрузке категорий: {categoriesError.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          mb: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, rgba(103, 58, 183, 0.15), rgba(63, 81, 181, 0.05))'
            : 'linear-gradient(to right, rgba(103, 58, 183, 0.1), rgba(63, 81, 181, 0.02))',
          borderRadius: 2,
          py: 2,
          px: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ mr: 1.5, fontSize: '2rem', color: theme.palette.primary.main }} />
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: theme.palette.mode === 'dark' ? '#9575cd' : '#673ab7'
              }}
            >
              Управление категориями услуг
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'категория' : 
                                          filteredCategories.length >= 2 && filteredCategories.length <= 4 ? 'категории' : 'категорий'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Добавляйте и редактируйте категории для группировки услуг салона
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAddCategory}
        disabled={isLoading}
        sx={{
          borderRadius: 2,
          background: primaryGradient,
          mb: 3,
          px: 3,
          py: 1,
          '&:hover': {
            background: primaryGradient,
            filter: 'brightness(1.1)',
          }
        }}
      >
        Добавить категорию
      </Button>

      <TextField
        variant="outlined"
        size="small"
        placeholder="Поиск категорий..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: {
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.8)
                : alpha(theme.palette.background.paper, 0.9),
            }
          }
        }}
        sx={{ width: '100%', mb: 3 }}
      />

      {isError && !shouldShowExtractedCategories && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Управление категориями временно недоступно. Сервер не отвечает.
          Ваши услуги будут работать - эта функция нужна только для организации категорий.
        </Alert>
      )}

      {noCategoriesToShow && (
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {searchQuery 
              ? 'Категории по вашему запросу не найдены' 
              : 'Категории услуг не найдены. Создайте первую категорию!'}
          </Typography>
        </Paper>
      )}

      {filteredCategories.length > 0 && (
        <Grid container spacing={2}>
          {filteredCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Box
                sx={{
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box 
                  sx={{ 
                    height: 8, 
                    backgroundColor: category.color || '#ccc',
                    width: '100%'
                  }} 
                />
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={500}>{category.name}</Typography>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditCategory(category)}
                      disabled={isLoading}
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={isLoading}
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            background: primaryGradient,
            color: 'white',
            py: 2,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedCategory ? 'Редактировать категорию' : 'Новая категория'}
          </Typography>
          <IconButton 
            onClick={handleCloseDialog}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Название категории"
                value={formValues.name}
                onChange={handleInputChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                fullWidth
                required
                margin="normal"
                autoFocus
                variant="outlined"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Описание"
                value={formValues.description}
                onChange={handleInputChange}
                error={!!validationErrors.description}
                helperText={validationErrors.description}
                fullWidth
                multiline
                rows={2}
                margin="normal"
                variant="outlined"
                InputProps={{
                  sx: {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="color"
                label="Цвет"
                value={formValues.color}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                type="color"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ColorLensIcon sx={{ color: formValues.color }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sort_order"
                label="Порядок сортировки"
                type="number"
                value={formValues.sort_order}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
            sx={{ 
              borderRadius: 2,
              background: primaryGradient,
              ml: 'auto',
              px: 3,
              '&:hover': {
                background: primaryGradient,
                filter: 'brightness(1.1)',
              }
            }}
          >
            {createCategoryMutation.isLoading || updateCategoryMutation.isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              selectedCategory ? 'Сохранить' : 'Создать'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: theme.palette.error.main, 
          color: 'white',
          fontWeight: 600,
          px: 3,
          py: 2
        }}>
          Удалить категорию?
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="body1">
            Вы уверены, что хотите удалить категорию "{selectedCategory?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить. 
            Услуги, использующие эту категорию, не будут удалены, но могут потерять категорию.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleteCategoryMutation.isLoading}
            sx={{ borderRadius: 2 }}
          >
            {deleteCategoryMutation.isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ServiceCategoryManager; 