import {
  Add as AddIcon,
  Article as ArticleIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Fab,
  Grid,
  LinearProgress,
  Paper,
  Typography
} from '@mui/material';
import React from 'react';

function CategoriesPage() {
  const [categories] = React.useState([
    {
      id: 1,
      name: 'Tutorial',
      description: 'Step-by-step guides and tutorials',
      documentCount: 15,
      color: '#1976d2',
      icon: '📚',
      recentActivity: '2 hours ago'
    },
    {
      id: 2,
      name: 'Guidelines',
      description: 'Best practices and guidelines for the team',
      documentCount: 8,
      color: '#388e3c',
      icon: '📋',
      recentActivity: '1 day ago'
    },
    {
      id: 3,
      name: 'Reference',
      description: 'Quick reference materials and documentation',
      documentCount: 23,
      color: '#f57c00',
      icon: '📖',
      recentActivity: '3 hours ago'
    },
    {
      id: 4,
      name: 'FAQ',
      description: 'Frequently asked questions and answers',
      documentCount: 12,
      color: '#7b1fa2',
      icon: '❓',
      recentActivity: '5 hours ago'
    },
    {
      id: 5,
      name: 'Documentation',
      description: 'Technical documentation and specifications',
      documentCount: 31,
      color: '#d32f2f',
      icon: '🔧',
      recentActivity: '30 minutes ago'
    },
    {
      id: 6,
      name: 'Meeting Notes',
      description: 'Meeting summaries and action items',
      documentCount: 7,
      color: '#455a64',
      icon: '📝',
      recentActivity: '2 days ago'
    }
  ]);

  const totalDocuments = categories.reduce((sum, cat) => sum + cat.documentCount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Fab color="primary" aria-label="add category">
          <AddIcon />
        </Fab>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {categories.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Categories
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {totalDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Documents
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {Math.round(totalDocuments / categories.length)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. per Category
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: category.color,
                      width: 48,
                      height: 48,
                      mr: 2,
                      fontSize: '1.5rem'
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2">
                      {category.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.documentCount}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(category.documentCount / Math.max(...categories.map(c => c.documentCount))) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: category.color
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    icon={<ArticleIcon />}
                    label={`${category.documentCount} docs`}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Updated {category.recentActivity}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button size="small" color="primary" startIcon={<FolderIcon />}>
                  View Documents
                </Button>
                <Button size="small">
                  Edit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default CategoriesPage;
