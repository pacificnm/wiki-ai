import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Article as ArticleIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Fab,
  Grid,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCategories } from '../hooks/useCategories';
import { useDocuments } from '../hooks/useDocuments';
import { logger } from '../utils/logger';

function DocumentsByCategory() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { getCategoryById } = useCategories();
  const [category, setCategory] = useState(null);

  const {
    documents,
    loading,
    error,
    total,
    hasMore,
    searchTerm,
    search,
    setSearchTerm,
    filterByCategory,
    refresh,
    loadMore,
    deleteDocument,
    updateDocument
  } = useDocuments({
    autoFetch: false, // We'll fetch manually with category filter
    limit: 12 // Show 12 documents per page
  });

  // Load category information
  useEffect(() => {
    if (categoryId) {
      const categoryData = getCategoryById(categoryId);
      setCategory(categoryData);
    }
  }, [categoryId, getCategoryById]);

  // Fetch documents for this category
  useEffect(() => {
    if (category) {
      fetchDocumentsByCategory();
    }
  }, [category]);

  const fetchDocumentsByCategory = async () => {
    try {
      // Filter documents by category name
      await filterByCategory(category.name);
    } catch (error) {
      logger.error('Error fetching documents by category', {
        categoryId,
        categoryName: category?.name,
        error: error.message
      });
    }
  };

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
        fetchDocumentsByCategory();
      } catch (error) {
        logger.error('Error deleting document', { documentId, error: error.message });
      }
    }
  };

  // Handle document publish toggle
  const handlePublishToggle = async (documentId, currentPublishedState, title) => {
    const newPublishedState = !currentPublishedState;
    const action = newPublishedState ? 'publish' : 'unpublish';

    try {
      await updateDocument(documentId, {
        isPublished: newPublishedState
      });
      logger.info(`Document ${action}ed successfully`, { documentId, title });
    } catch (error) {
      logger.error(`Error ${action}ing document`, { documentId, error: error.message });
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
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {doc.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={doc.isPublished ? "Published" : "Draft"}
                        size="small"
                        color={doc.isPublished ? "success" : "warning"}
                      />
                      <Switch
                        checked={doc.isPublished}
                        onChange={() => handlePublishToggle(doc.id, doc.isPublished, doc.title)}
                        size="small"
                        disabled={loading}
                      />
                    </Box>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {doc.excerpt}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {doc.tags?.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  By {doc.author} • Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  {doc.viewCount > 0 && ` • ${doc.viewCount} views`}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleViewDocument(doc.id)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  onClick={() => handleEditDocument(doc.id)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeleteDocument(doc.id, doc.title)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
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
