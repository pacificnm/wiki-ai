import {
  Add as AddIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Fab,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvgPerCategory from '../components/AvgPerCategory';
import CategoryCard from '../components/CategoryCard';
import CategoryDialog from '../components/CategoryDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import TotalCategories from '../components/TotalCategories';
import TotalDocuments from '../components/TotalDocuments';
import { useCategories } from '../hooks/useCategories.js';

function CategoriesPage() {
  const navigate = useNavigate();
  const { categories, loading, refresh } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  /**
   * Handle opening create category dialog
   */
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  /**
   * Handle viewing documents for a category
   * @param {Object} category - Category object
   */
  const handleViewDocuments = (category) => {
    const categoryId = category._id || category.id;
    navigate(`/categories/${categoryId}/documents`);
  };

  /**
   * Handle editing a category
   * @param {Object} category - Category object
   */
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  /**
   * Handle successful category save/update
   * @param {Object} category - Updated category data
   */
  const handleCategorySuccess = (category) => {
    // Refetch categories to update the list
    if (refresh) {
      refresh();
    }
  };

  /**
   * Handle closing the dialog
   */
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading categories..." minHeight="50vh" />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Fab
          color="primary"
          aria-label="add category"
          onClick={handleCreateCategory}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <TotalCategories />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TotalDocuments />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AvgPerCategory />
        </Grid>
      </Grid>

      {safeCategories.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No categories found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating your first category to organize your documents.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateCategory}
          >
            Create Category
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {safeCategories.map((category) => (
            <Grid item xs={12} md={6} lg={4} key={category._id || category.id}>
              <CategoryCard
                category={category}
                allCategories={safeCategories}
                onViewDocuments={handleViewDocuments}
                onEdit={handleEditCategory}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleCategorySuccess}
        category={editingCategory}
        allCategories={safeCategories}
        mode={dialogMode}
      />
    </Box>
  );
}

export default CategoriesPage;
