import {
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CATEGORY_COLORS, CATEGORY_ICONS, getDefaultIconAndColor } from '../config/categoryConfig';
import { useError } from '../hooks/useError';
import categoryService from '../services/categoryService';
import { logger } from '../utils/logger';

/**
 * CategoryDialog component for creating and editing categories
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {Function} props.onClose - Function to call when dialog closes
 * @param {Function} props.onSuccess - Function to call on successful save
 * @param {Object} props.category - Category to edit (null for create mode)
 * @param {Array} props.allCategories - All categories for parent selection
 * @param {string} props.mode - 'create' or 'edit'
 */
const CategoryDialog = ({
  open,
  onClose,
  onSuccess,
  category = null,
  allCategories = [],
  mode = 'create'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    icon: '📁',
    color: '#1976d2'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { handleError } = useError();

  // Initialize form data when dialog opens or category changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          parentId: category.parentId?._id || category.parentId || '',
          icon: category.icon || '📁',
          color: category.color || '#1976d2'
        });
      } else {
        // For create mode, set defaults based on name if available
        const defaults = getDefaultIconAndColor(formData.name || 'New Category');
        setFormData({
          name: '',
          description: '',
          parentId: '',
          icon: defaults.icon,
          color: defaults.color
        });
      }
      setErrors({});
      setSubmitError('');
    }
  }, [open, category, mode]);

  /**
   * Handle form field changes
   * @param {Event} event - Input change event
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  };

  /**
   * Validate form data
   * @returns {boolean} Whether form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Category name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Check if parent would create circular dependency (edit mode only)
    if (mode === 'edit' && category && formData.parentId) {
      const selectedParent = allCategories.find(cat =>
        (cat._id || cat.id) === formData.parentId
      );

      if (selectedParent && selectedParent.path && selectedParent.path.includes(category.slug)) {
        newErrors.parentId = 'Cannot set parent to a child category';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      let result;
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId || null,
        icon: formData.icon,
        color: formData.color
      };

      if (mode === 'edit' && category) {
        result = await categoryService.updateCategory(category._id || category.id, submitData);
      } else {
        result = await categoryService.createCategory(submitData);
      }

      logger.info(`Category ${mode}d successfully`, {
        categoryId: category?._id || result.category?.id,
        categoryName: formData.name
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result.category);
      }

      // Close dialog
      onClose();

    } catch (error) {
      logger.error(`Failed to ${mode} category`, {
        error: error.message,
        categoryName: formData.name
      });

      // Handle validation errors from server
      if (error.message.includes('Validation error:')) {
        setSubmitError(error.message.replace('Validation error: ', ''));
      } else if (error.message.includes('already exists')) {
        setErrors({ name: 'A category with this name already exists' });
      } else {
        setSubmitError(`Failed to ${mode} category. Please try again.`);
        handleError(error, `Failed to ${mode} category`);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Get available parent categories (exclude self and children in edit mode)
  const availableParents = allCategories.filter(cat => {
    const catId = cat._id || cat.id;
    const currentId = category?._id || category?.id;

    if (mode === 'edit' && category) {
      // Exclude self
      if (catId === currentId) {
        return false;
      }

      // Exclude children (categories that have current category in their path)
      if (cat.path && cat.path.includes(category.slug)) {
        return false;
      }
    }

    return true;
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {mode === 'edit' ? 'Edit Category' : 'Create Category'}
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <TextField
          name="name"
          label="Category Name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <TextField
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          error={!!errors.description}
          helperText={errors.description}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth error={!!errors.icon} disabled={loading} sx={{ mb: 2 }}>
          <InputLabel>Icon</InputLabel>
          <Select
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            label="Icon"
            renderValue={(value) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: '1.2em' }}>{value}</span>
                <span>{CATEGORY_ICONS.find(icon => icon.value === value)?.label.split(' ').slice(1).join(' ') || 'General'}</span>
              </Box>
            )}
          >
            {CATEGORY_ICONS.map((icon) => (
              <MenuItem key={icon.value} value={icon.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span style={{ fontSize: '1.2em' }}>{icon.value}</span>
                  <Box>
                    <Typography variant="body1">{icon.label.split(' ').slice(1).join(' ')}</Typography>
                    <Typography variant="caption" color="text.secondary">{icon.description}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.icon && <FormHelperText>{errors.icon}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.color} disabled={loading} sx={{ mb: 2 }}>
          <InputLabel>Color</InputLabel>
          <Select
            name="color"
            value={formData.color}
            onChange={handleChange}
            label="Color"
            renderValue={(value) => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: value,
                    borderRadius: '50%',
                    border: '1px solid #ccc'
                  }}
                />
                <span>{CATEGORY_COLORS.find(color => color.value === value)?.label || 'Blue'}</span>
              </Box>
            )}
          >
            {CATEGORY_COLORS.map((color) => (
              <MenuItem key={color.value} value={color.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color.value,
                      borderRadius: '50%',
                      border: '1px solid #ccc'
                    }}
                  />
                  <Box>
                    <Typography variant="body1">{color.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{color.description}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
          {errors.color && <FormHelperText>{errors.color}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.parentId} disabled={loading}>
          <InputLabel>Parent Category</InputLabel>
          <Select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            label="Parent Category"
          >
            <MenuItem value="">
              <em>None (Top Level)</em>
            </MenuItem>
            {availableParents.map((cat) => (
              <MenuItem key={cat._id || cat.id} value={cat._id || cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
          {errors.parentId && (
            <FormHelperText>{errors.parentId}</FormHelperText>
          )}
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
