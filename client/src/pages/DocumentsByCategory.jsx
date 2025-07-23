
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Fab,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCategories } from '../hooks/useCategories';
import { useDocuments } from '../hooks/useDocuments';
import favoriteService from '../services/favoriteService';
import { logger } from '../utils/logger';

function DocumentsByCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { getCategoryById } = useCategories();
  const [category, setCategory] = useState(null);
  const [, setInitialCategoryLoaded] = useState(false);

  const {
    documents,
    loading,
    error,
    total,
    hasMore,
    searchTerm,
    search,
    setSearchTerm,
    refresh,
    loadMore,
    deleteDocument,
    setCategory: setHookCategory,
    fetchDocuments,
    reset,
    updateDocumentFavoriteStatus
  } = useDocuments({
    autoFetch: false, // We'll manually control fetching
    initialCategory: '', // Start empty
    limit: 12 // Show 12 documents per page
  });

  // Load category information and set up documents
  useEffect(() => {
    if (categoryId) {
      // Clear documents immediately when category changes
      reset();
      setInitialCategoryLoaded(false);

      const categoryData = getCategoryById(categoryId);
      setCategory(categoryData);

      if (categoryData?.name) {
        // Set the category in the hook state
        setHookCategory(categoryData.name);
        // Then fetch documents for this category
        fetchDocuments({ resetData: true });
      }

      setInitialCategoryLoaded(true);
    }
  }, [categoryId, getCategoryById, reset, setHookCategory, fetchDocuments]);

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    // Search within this category - first filter by category, then search
    search(newSearchTerm);
  };

  // Handle document view
  const handleViewDocument = (documentId) => {
    logger.info('Viewing document', { documentId });
    navigate(`/documents/${documentId}`);
  };

  // Handle document edit
  const handleEditDocument = (documentId) => {
    logger.info('Editing document', { documentId });
    navigate(`/documents/${documentId}/edit`);
  };

  // Handle document delete
  const handleDeleteDocument = async (documentId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteDocument(documentId);
        logger.info('Document deleted successfully', { documentId });
        // Refresh the list
        refresh();
      } catch (error) {
        logger.error('Error deleting document', { documentId, error: error.message });
      }
    }
  };

  // Handle document publish toggle

  // Handle favorite toggle
  const handleToggleFavorite = async (documentId) => {
    try {
      // Find the document to get current favorite status
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return;

      if (document.isFavorite) {
        await favoriteService.removeFromFavorites(documentId);
        logger.info('Document removed from favorites', { documentId });
        updateDocumentFavoriteStatus(documentId, false);
      } else {
        await favoriteService.addToFavorites(documentId);
        logger.info('Document added to favorites', { documentId });
        updateDocumentFavoriteStatus(documentId, true);
      }

    } catch (error) {
      logger.error('Error toggling favorite status', { documentId, error: error.message });
    }
  };

  // Handle create new document (with category pre-selected)
  const handleCreateDocument = () => {
    logger.info('Creating new document in category', { categoryId, categoryName: category?.name });
    navigate(`/documents/new?category=${categoryId}`);
  };

  // Handle load more documents
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/categories');
  };

  // Show loading spinner on initial load
  if (loading && documents.length === 0) {
    return (
      <LoadingSpinner
        message="Loading documents..."
        centered
        size="large"
      />
    );
  }

  // Show error state
  if (error && documents.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to Load Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button variant="contained" onClick={refresh}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Categories
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {category?.name || 'Category Documents'}
            {total > 0 && ` (${total})`}
          </Typography>
          {category?.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {category.description}
            </Typography>
          )}
        </Box>
        <Fab
          color="primary"
          aria-label="add document"
          onClick={handleCreateDocument}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Search documents in ${category?.name || 'this category'}...`}
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Documents Grid */}
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <DocumentCard
              document={doc}
              onView={() => handleViewDocument(doc.id)}
              onEdit={() => handleEditDocument(doc.id)}
              onToggleFavorite={handleToggleFavorite}
              onDelete={() => handleDeleteDocument(doc.id, doc.title)}
              showFavorite={true}
              showDelete={true}
              showViewCount={true}
              layout="grid"
            />
          </Grid>
        ))}
      </Grid>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Documents'}
          </Button>
        </Box>
      )}

      {/* Loading Spinner for Load More */}
      {loading && documents.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <LoadingSpinner
            message="Loading more documents..."
            size="small"
          />
        </Box>
      )}

      {/* No Documents Found */}
      {documents.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No documents found in {category?.name || 'this category'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm
              ? 'Try adjusting your search terms'
              : `Create your first document in the ${category?.name || 'category'} to get started`
            }
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDocument}
              sx={{ mt: 2 }}
            >
              Create First Document
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default DocumentsByCategory;
