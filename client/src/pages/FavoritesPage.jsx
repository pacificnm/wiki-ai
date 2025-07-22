import {
  Article as ArticleIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography
} from '@mui/material';
import React from 'react';

function FavoritesPage() {
  const [favorites, setFavorites] = React.useState([
    {
      id: 1,
      title: 'Getting Started with Wiki-AI',
      excerpt: 'Learn how to use the Wiki-AI platform to create and manage knowledge articles.',
      category: 'Tutorial',
      author: 'System',
      updatedAt: '2024-01-15',
      tags: ['tutorial', 'getting-started'],
      isFavorite: true,
      addedToFavorites: '2024-01-16'
    },
    {
      id: 2,
      title: 'API Documentation',
      excerpt: 'Complete reference for the Wiki-AI REST API endpoints and authentication.',
      category: 'Reference',
      author: 'Dev Team',
      updatedAt: '2024-01-14',
      tags: ['api', 'reference', 'development'],
      isFavorite: true,
      addedToFavorites: '2024-01-14'
    },
    {
      id: 3,
      title: 'Markdown Guide',
      excerpt: 'Comprehensive guide to using Markdown for document formatting.',
      category: 'Guidelines',
      author: 'Content Team',
      updatedAt: '2024-01-13',
      tags: ['markdown', 'formatting', 'writing'],
      isFavorite: true,
      addedToFavorites: '2024-01-13'
    }
  ]);

  const handleToggleFavorite = (docId) => {
    setFavorites(favorites.map(doc =>
      doc.id === docId
        ? { ...doc, isFavorite: !doc.isFavorite }
        : doc
    ));
  };

  const handleRemoveFromFavorites = (docId) => {
    setFavorites(favorites.filter(doc => doc.id !== docId));
  };

  const activeFavorites = favorites.filter(doc => doc.isFavorite);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Favorites
      </Typography>

      {activeFavorites.length === 0 ? (
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
              You have <strong>{activeFavorites.length}</strong> favorite document{activeFavorites.length !== 1 ? 's' : ''}
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            {activeFavorites.map((doc) => (
              <Grid item xs={12} md={6} lg={4} key={doc.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                        {doc.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(doc.id)}
                        color={doc.isFavorite ? 'error' : 'default'}
                      >
                        {doc.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {doc.excerpt}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {doc.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CategoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {doc.category}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary" display="block">
                      By {doc.author} • Updated {doc.updatedAt}
                    </Typography>

                    <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                      Added to favorites: {doc.addedToFavorites}
                    </Typography>
                  </CardContent>

                  <CardActions>
                    <Button size="small" color="primary">
                      View
                    </Button>
                    <Button size="small">
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFromFavorites(doc.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {activeFavorites.length > 0 && (
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
