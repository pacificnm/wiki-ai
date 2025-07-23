import {
  Avatar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';

/**
 * CategorySelector component for selecting categories from database
 * @param {Object} props - Component props
 * @param {string} props.value - Selected category ID
 * @param {Function} props.onChange - Function called when category changes
 * @param {string} props.label - Label for the selector
 * @param {boolean} props.multiple - Allow multiple selection
 * @param {boolean} props.required - Whether selection is required
 * @param {boolean} props.disabled - Whether selector is disabled
 * @param {string} props.size - Size of the selector ('small', 'medium')
 */
const CategorySelector = ({
  value = '',
  onChange,
  label = 'Category',
  multiple = false,
  required = false,
  disabled = false,
  size = 'medium'
}) => {
  const { categories, loading } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState(multiple ? (value || []) : value);

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  /**
   * Handle category selection change
   */
  const handleChange = (event) => {
    const newValue = event.target.value;
    setSelectedCategories(newValue);

    if (onChange) {
      onChange(event);
    }
  };

  /**
   * Render the selected value(s) with icon and color
   */
  const renderValue = (selected) => {
    if (multiple) {
      if (!Array.isArray(selected) || selected.length === 0) {
        return <em>None selected</em>;
      }

      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((categoryId) => {
            const category = safeCategories.find(cat => (cat._id || cat.id) === categoryId);
            if (!category) return null;

            return (
              <Chip
                key={categoryId}
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: category.color || '#1976d2',
                      width: 20,
                      height: 20,
                      fontSize: '0.75rem'
                    }}
                  >
                    {category.icon || '📁'}
                  </Avatar>
                }
                label={category.name}
                size="small"
              />
            );
          })}
        </Box>
      );
    } else {
      if (!selected) {
        return <em>None selected</em>;
      }

      const category = safeCategories.find(cat => (cat._id || cat.id) === selected);
      if (!category) {
        return <em>Unknown category</em>;
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: '1.2em' }}>{category.icon || '📁'}</span>
          <span>{category.name}</span>
        </Box>
      );
    }
  };

  /**
   * Render category option with hierarchy and visual elements
   */
  const renderCategoryOption = (category) => {
    const depth = category.depth || 0;
    const indent = depth * 16; // 16px per level

    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        paddingLeft: `${indent}px`,
        width: '100%'
      }}>
        <Avatar
          sx={{
            bgcolor: category.color || '#1976d2',
            width: 24,
            height: 24,
            fontSize: '0.8rem'
          }}
        >
          {category.icon || '📁'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1">{category.name}</Typography>
          {category.description && (
            <Typography variant="caption" color="text.secondary">
              {category.description}
            </Typography>
          )}
        </Box>
        {category.documentCount !== undefined && (
          <Typography variant="caption" color="text.secondary">
            {category.documentCount} docs
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <FormControl fullWidth size={size} disabled={disabled || loading} required={required}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={selectedCategories}
        onChange={handleChange}
        label={label}
        multiple={multiple}
        renderValue={renderValue}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400
            }
          }
        }}
      >
        {!multiple && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {safeCategories
          .sort((a, b) => {
            // Sort by depth first (parents before children), then by name
            if (a.depth !== b.depth) {
              return a.depth - b.depth;
            }
            return a.name.localeCompare(b.name);
          })
          .map((category) => (
            <MenuItem
              key={category._id || category.id}
              value={category._id || category.id}
              sx={{
                '&:hover': {
                  backgroundColor: `${category.color}15` // 15% opacity
                }
              }}
            >
              {renderCategoryOption(category)}
            </MenuItem>
          ))}
        {safeCategories.length === 0 && !loading && (
          <MenuItem disabled>
            <em>No categories available</em>
          </MenuItem>
        )}
        {loading && (
          <MenuItem disabled>
            <em>Loading categories...</em>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default CategorySelector;
