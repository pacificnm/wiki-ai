import {
  Add as AddIcon,
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
  TextField,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDocuments } from '../hooks/useDocuments';
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
    deleteDocument
  } = useDocuments({
    autoFetch: true,
    limit: 12 // Show 12 documents per page
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

  // Handle create new document
  const handleCreateDocument = () => {
    logger.info('Creating new document');
    navigate('/documents/new');
  };

  // Handle load more documents
  const handleLoadMore = () => {
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
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {doc.title}
                    </Typography>
                    {!doc.isPublished && (
                      <Chip label="Draft" size="small" color="warning" sx={{ mb: 1 }} />
                    )}
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
                  {doc.category} • By {doc.author} • Updated {new Date(doc.updatedAt).toLocaleDateString()}
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
