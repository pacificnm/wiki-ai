import {
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Grid,
  Paper,
  Typography
} from '@mui/material';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../hooks/useFavorites';

function FavoritesPage() {
  const {
    favorites,
    loading,
    toggleFavorite,
    removeFromFavorites
  } = useFavorites();

  const handleView = (document) => {
    // TODO: Navigate to document view
    console.log('View document:', document);
  };

  const handleEdit = (document) => {
    // TODO: Navigate to document edit
    console.log('Edit document:', document);
  };

  const handleShare = (document) => {
    // TODO: Share document
    console.log('Share document:', document);
  };

  if (loading) {
    return <LoadingSpinner message="Loading your favorites..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Favorites
      </Typography>

      {favorites.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FavoriteBorderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the heart icon on any document to add it to your favorites
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              You have <strong>{favorites.length}</strong> favorite document{favorites.length !== 1 ? 's' : ''}
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            {favorites.map((doc) => (
              <Grid item xs={12} md={6} lg={4} key={doc.id}>
                <DocumentCard
                  document={doc}
                  onView={handleView}
                  onEdit={handleEdit}
                  onToggleFavorite={toggleFavorite}
                  onDelete={removeFromFavorites}
                  onShare={handleShare}
                  showFavorite={true}
                  showDelete={true}
                  showShare={true}
                  showCategory={true}
                  layout="grid"
                />
              </Grid>
            ))}
          </Grid>

          {favorites.length > 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Tip:</strong> Your favorite documents are easily accessible here.
                You can also find them highlighted in search results and document lists.
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

export default FavoritesPage;
