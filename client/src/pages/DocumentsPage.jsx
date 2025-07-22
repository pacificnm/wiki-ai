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
import React from 'react';

function DocumentsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [documents] = React.useState([
    {
      id: 1,
      title: 'Getting Started with Wiki-AI',
      excerpt: 'Learn how to use the Wiki-AI platform to create and manage knowledge articles.',
      category: 'Tutorial',
      author: 'System',
      updatedAt: '2024-01-15',
      tags: ['tutorial', 'getting-started']
    },
    {
      id: 2,
      title: 'Best Practices for Documentation',
      excerpt: 'Guidelines for creating clear, comprehensive, and maintainable documentation.',
      category: 'Guidelines',
      author: 'Admin',
      updatedAt: '2024-01-14',
      tags: ['best-practices', 'documentation']
    }
  ]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Documents
        </Typography>
        <Fab color="primary" aria-label="add document">
          <AddIcon />
        </Fab>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        {filteredDocuments.map((doc) => (
          <Grid item xs={12} md={6} lg={4} key={doc.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {doc.title}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {doc.excerpt}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {doc.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {doc.category} • By {doc.author} • Updated {doc.updatedAt}
                </Typography>
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

      {filteredDocuments.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first document to get started'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DocumentsPage;
