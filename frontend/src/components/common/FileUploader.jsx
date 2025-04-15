import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const FileUploader = ({
  onFileSelected,
  onFileRemoved,
  initialFileUrl = null,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 5,
  label = 'Загрузить изображение',
  acceptedFileTypesText = 'JPG, PNG или WEBP',
  variant = 'default', // 'default', 'compact', 'avatar'
  width = '100%',
  height = 'auto',
  aspectRatio = 16 / 9,
  showPreview = true,
  previewHeight = 200
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(initialFileUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Convert bytes to MB
  const bytesToMB = (bytes) => bytes / (1024 * 1024);
  
  // Handle file selection (from input or drop)
  const handleFileSelection = (selectedFile) => {
    setError(null);
    
    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(`Неподдерживаемый формат файла. Допустимые форматы: ${acceptedFileTypesText}`);
      return;
    }
    
    // Validate file size
    if (bytesToMB(selectedFile.size) > maxSizeInMB) {
      setError(`Размер файла превышает ${maxSizeInMB} МБ`);
      return;
    }
    
    // Create preview URL
    const fileObjectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFileUrl(fileObjectUrl);
    
    // Simulate file upload
    simulateUpload(selectedFile);
  };
  
  // Simulate file upload process (replace with actual upload logic)
  const simulateUpload = (selectedFile) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const totalSteps = 10;
    let currentStep = 0;
    
    const intervalId = setInterval(() => {
      currentStep += 1;
      const progress = Math.round((currentStep / totalSteps) * 100);
      setUploadProgress(progress);
      
      if (currentStep >= totalSteps) {
        clearInterval(intervalId);
        setIsUploading(false);
        // Call the callback with the file
        if (onFileSelected) {
          onFileSelected(selectedFile);
        }
      }
    }, 200);
  };
  
  // Handle file input change
  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };
  
  // Handle file drop
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const selectedFile = event.dataTransfer.files[0];
      handleFileSelection(selectedFile);
    }
  };
  
  // Handle drag events
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    
    setFile(null);
    setFileUrl(null);
    setError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (onFileRemoved) {
      onFileRemoved();
    }
  };
  
  // Handle click on upload area
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Set the style based on the variant
  const getContainerStyle = () => {
    const baseStyle = {
      width,
      border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      backgroundColor: isDragging ? `${theme.palette.primary.main}10` : theme.palette.background.paper,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    };
    
    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          height: 'auto',
          padding: theme.spacing(1),
        };
      case 'avatar':
        return {
          ...baseStyle,
          width: width || 150,
          height: height || 150,
          borderRadius: '50%',
          padding: 0,
        };
      default:
        return {
          ...baseStyle,
          height: height || 'auto',
          padding: theme.spacing(3),
          aspectRatio: aspectRatio,
        };
    }
  };
  
  // Render file preview
  const renderPreview = () => {
    if (!fileUrl && !file) return null;
    
    // For images
    if (file?.type.startsWith('image/') || (fileUrl && showPreview)) {
      return (
        <Box 
          sx={{ 
            mt: 2, 
            width: '100%', 
            height: previewHeight,
            position: 'relative',
            borderRadius: theme.shape.borderRadius,
            overflow: 'hidden',
          }}
        >
          <img
            src={fileUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: theme.shape.borderRadius,
            }}
          />
        </Box>
      );
    }
    
    // For documents/other files
    return (
      <Box sx={{ 
        mt: 2, 
        display: 'flex', 
        alignItems: 'center',
        p: 2,
        bgcolor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
      }}>
        <InsertDriveFileIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file?.name}
        </Typography>
      </Box>
    );
  };
  
  // Render the uploader content
  const renderUploaderContent = () => {
    // If there's a file uploaded or uploading
    if (fileUrl || isUploading) {
      return (
        <>
          {isUploading ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Загрузка... {uploadProgress}%
              </Typography>
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {renderPreview()}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </>
      );
    }
    
    // Default empty state
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          py: variant === 'compact' ? 1 : 2,
        }}
      >
        {variant === 'avatar' ? (
          <ImageIcon fontSize="large" color="action" />
        ) : (
          <>
            <CloudUploadIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant={variant === 'compact' ? 'body2' : 'body1'} color="textSecondary" align="center">
              {label}
            </Typography>
            <Typography variant="caption" color="textSecondary" align="center" sx={{ mt: 0.5 }}>
              Перетащите файл сюда или нажмите для выбора
            </Typography>
            <Typography variant="caption" color="textSecondary" align="center" sx={{ mt: 0.5 }}>
              Максимальный размер: {maxSizeInMB} МБ ({acceptedFileTypesText})
            </Typography>
          </>
        )}
      </Box>
    );
  };
  
  return (
    <Box sx={{ width: width }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      <Paper
        elevation={0}
        sx={getContainerStyle()}
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {renderUploaderContent()}
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUploader; 