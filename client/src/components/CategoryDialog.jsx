import {
  Close as CloseIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Alert,
  Button,
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
import { useError } from '../hooks/useError';
import categoryService from '../services/categoryService';
import { logger } from '../utils/logger';
import LoadingSpinner from './LoadingSpinner';

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
    parentId: ''
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
          parentId: category.parentId?._id || category.parentId || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          parentId: ''
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
        parentId: formData.parentId || null
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
          startIcon={loading ? <LoadingSpinner size={16} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
