import {
  History as HistoryIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  Box,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCategories } from '../hooks/useCategories';
import documentService from '../services/documentService';
import { logger } from '../utils/logger';

function SearchPage() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [tabValue, setTabValue] = React.useState(0);
  const [sortBy, setSortBy] = React.useState('relevance');
  const [category, setCategory] = React.useState('all');
  const [searchResults, setSearchResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [recentSearches] = React.useState([
    'API documentation',
    'getting started',
    'markdown guide',
    'user permissions'
  ]);

  const [trendingSearches] = React.useState([
    'authentication',
    'deployment guide',
    'troubleshooting',
    'best practices'
  ]);

  React.useEffect(() => {
    // Don't search if searchTerm is empty or too short
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce the search with 500ms delay
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const options = {};
        if (category && category !== 'all') options.category = category;

        const res = await documentService.searchDocuments(searchTerm.trim(), options);
        setSearchResults(res.documents || []);
        logger.info('Search completed', {
          searchTerm: searchTerm.trim(),
          resultCount: res.documents?.length || 0,
          options
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch search results');
        logger.error('Search error', { searchTerm, error: err.message });
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, category]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle document view
  const handleViewDocument = (documentId) => {
    logger.info('Viewing document from search', { documentId });
    navigate(`/documents/${documentId}`);
  };

  // Handle document edit
  const handleEditDocument = (documentId) => {
    logger.info('Editing document from search', { documentId });
    navigate(`/documents/${documentId}/edit`);
  };

  // Handle favorite toggle (placeholder for now)
  const handleToggleFavorite = (documentId) => {
    logger.info('Toggling favorite from search', { documentId });
    // TODO: Implement favorite toggle functionality
  };

  // Handle document delete (placeholder for now)
  const handleDeleteDocument = (documentId, title) => {
    logger.info('Delete requested from search', { documentId, title });
    // TODO: Implement delete functionality
  };

  // Remove mock searchResults and use API results
  // Replace filteredResults and sortedResults with just searchResults
  const filteredResults = searchResults; // Already filtered by API
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'relevance':
      default:
        return 0; // API does not provide relevanceScore
    }
  });

  // Only show error state, no full-page loading
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to Search Documents
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Search
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search documents, people, categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: loading && searchTerm && searchTerm.trim().length >= 2 ? (
              <InputAdornment position="end">
                <LoadingSpinner size="small" />
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 2 }}
        />

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                disabled={categoriesLoading}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Date Updated</MenuItem>
                <MenuItem value="title">Title</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Results" />
          <Tab label="Documents" />
          <Tab label="People" />
          <Tab label="Categories" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {searchTerm && searchTerm.trim().length >= 2 && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {loading ? (
                <>Searching for <strong>"{searchTerm}"</strong>...</>
              ) : (
                <>Found <strong>{sortedResults.length}</strong> results for <strong>"{searchTerm}"</strong></>
              )}
            </Typography>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <LoadingSpinner message="Searching..." size="small" />
            </Box>
          ) : sortedResults.length > 0 ? (
            <Grid container spacing={3}>
              {sortedResults.map((result) => (
                <Grid item xs={12} md={6} lg={4} key={result.id}>
                  <DocumentCard
                    document={{
                      id: result.id,
                      title: result.title,
                      excerpt: result.excerpt,
                      category: result.category,
                      author: result.author,
                      updatedAt: result.updatedAt,
                      tags: result.tags,
                      isPublished: true, // Assume search results are published
                      isFavorite: false, // Default to false for search results
                      viewCount: Math.floor(Math.random() * 100) // Mock view count
                    }}
                    onView={() => handleViewDocument(result.id)}
                    onEdit={() => handleEditDocument(result.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={() => handleDeleteDocument(result.id, result.title)}
                    showFavorite={true}
                    showDelete={false} // Don't show delete in search results
                    showViewCount={true}
                    showCategory={true}
                    layout="grid"
                  />
                </Grid>
              ))}
            </Grid>
          ) : searchTerm && searchTerm.trim().length >= 2 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No results found for "{searchTerm}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Paper>
          ) : searchTerm && searchTerm.trim().length < 2 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Enter at least 2 characters to search
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type more characters to see results
              </Typography>
            </Paper>
          ) : null}
        </Grid>

        <Grid item xs={12} md={4}>
          {!searchTerm && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <HistoryIcon sx={{ mr: 1 }} />
                  Recent Searches
                </Typography>
                <List dense>
                  {recentSearches.map((search, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => setSearchTerm(search)}
                      sx={{ pl: 0 }}
                    >
                      <ListItemText primary={search} />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Trending Searches
                </Typography>
                <List dense>
                  {trendingSearches.map((search, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => setSearchTerm(search)}
                      sx={{ pl: 0 }}
                    >
                      <ListItemText primary={search} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default SearchPage;
