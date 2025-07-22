import {
  Article as ArticleIcon,
  History as HistoryIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
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

function SearchPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [tabValue, setTabValue] = React.useState(0);
  const [sortBy, setSortBy] = React.useState('relevance');
  const [category, setCategory] = React.useState('all');

  // Mock search results
  const [searchResults] = React.useState([
    {
      id: 1,
      title: 'Getting Started with Wiki-AI',
      excerpt: 'Learn how to use the Wiki-AI platform to create and manage knowledge articles...',
      category: 'Tutorial',
      author: 'System',
      updatedAt: '2024-01-15',
      tags: ['tutorial', 'getting-started'],
      relevanceScore: 95
    },
    {
      id: 2,
      title: 'Best Practices for Documentation',
      excerpt: 'Guidelines for creating clear, comprehensive, and maintainable documentation...',
      category: 'Guidelines',
      author: 'Admin',
      updatedAt: '2024-01-14',
      tags: ['best-practices', 'documentation'],
      relevanceScore: 87
    },
    {
      id: 3,
      title: 'API Reference Guide',
      excerpt: 'Complete reference for all available API endpoints and authentication methods...',
      category: 'Reference',
      author: 'Dev Team',
      updatedAt: '2024-01-13',
      tags: ['api', 'reference', 'development'],
      relevanceScore: 82
    }
  ]);

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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredResults = searchResults.filter(result => {
    const matchesSearch = !searchTerm ||
      result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = category === 'all' || result.category === category;

    return matchesSearch && matchesCategory;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'relevance':
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });

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
            )
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
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="Tutorial">Tutorial</MenuItem>
                <MenuItem value="Guidelines">Guidelines</MenuItem>
                <MenuItem value="Reference">Reference</MenuItem>
                <MenuItem value="FAQ">FAQ</MenuItem>
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
          {searchTerm && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Found <strong>{sortedResults.length}</strong> results for &quot;{searchTerm}&quot;
            </Typography>
          )}

          {sortedResults.length > 0 ? (
            <Grid container spacing={2}>
              {sortedResults.map((result) => (
                <Grid item xs={12} key={result.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                            {result.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {result.excerpt}
                          </Typography>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {result.tags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" variant="outlined" />
                            ))}
                          </Box>

                          <Typography variant="caption" color="text.secondary">
                            {result.category} • By {result.author} • Updated {result.updatedAt}
                          </Typography>
                        </Box>

                        <Chip
                          label={`${result.relevanceScore}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>

                    <CardActions>
                      <Button size="small" color="primary">
                        View
                      </Button>
                      <Button size="small">
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : searchTerm ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search terms or filters
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
