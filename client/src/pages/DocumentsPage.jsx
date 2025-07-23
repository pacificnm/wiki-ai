import {
  Add as AddIcon,
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
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDocuments } from '../hooks/useDocuments';
import favoriteService from '../services/favoriteService';
import { logger } from '../utils/logger';

function DocumentsPage() {
  const navigate = useNavigate();

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
    updateDocumentFavoriteStatus
  } = useDocuments({
    autoFetch: true,
    limit: 24 // Show 24 documents per page (8 per row on large screens)
  });

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    // Debounce search - search function is already debounced in the hook
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

  // Endless scroll handler
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user scrolls to within 1000px of the bottom
    if (scrollTop + windowHeight >= documentHeight - 1000) {
      logger.debug('Endless scroll triggered');
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  // Add scroll event listener for endless scroll
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Handle create new document
  const handleCreateDocument = () => {
    logger.info('Creating new document');
    navigate('/documents/new');
  };

  // Handle load more documents
  const handleLoadMore = () => {
    logger.debug('Load more clicked', {
      hasMore,
      loading,
      documentsCount: documents.length,
      total
    });

    if (hasMore && !loading) {
      loadMore();
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Documents {total > 0 && `(${total})`}
        </Typography>
        <Fab
          color="primary"
          aria-label="add document"
          onClick={handleCreateDocument}
        >
          <AddIcon />
        </Fab>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search documents..."
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
            variant="contained"
            size="large"
            onClick={handleLoadMore}
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? 'Loading...' : `Load More (${documents.length} of ${total})`}
          </Button>
        </Box>
      )}

      {/* Show total count when all loaded */}
      {!hasMore && documents.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Showing all {total} documents
          </Typography>
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
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first document to get started'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDocument}
              sx={{ mt: 2 }}
            >
              Create Your First Document
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

export default DocumentsPage;
