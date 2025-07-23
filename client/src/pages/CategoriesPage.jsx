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
import LoadingSpinner from '../components/LoadingSpinner';
import { useCategories } from '../hooks/useCategories.js';


/**
 * Generate a color for a category based on its name
 * @param {string} name - Category name
 * @returns {string} Hex color
 */
const getCategoryColor = (name) => {
  const colors = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
    '#d32f2f', '#455a64', '#00796b', '#5d4037',
    '#616161', '#e91e63', '#9c27b0', '#3f51b5'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Generate an icon for a category based on its name
 * @param {string} name - Category name
 * @returns {string} Emoji icon
 */
const getCategoryIcon = (name) => {
  const iconMap = {
    tutorial: '📚',
    guide: '📋',
    guideline: '📋',
    reference: '📖',
    faq: '❓',
    documentation: '🔧',
    meeting: '📝',
    note: '📝',
    policy: '📄',
    procedure: '⚙️',
    help: '❓',
    support: '🆘',
    knowledge: '🧠',
    resource: '📦',
    template: '📋',
    example: '💡',
  };

  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  return '📁'; // Default folder icon
};

/**
 * Format relative time
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
const getRelativeTime = (date) => {
  if (!date) return 'No recent activity';

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
};

function CategoriesPage() {
  const { categories, loading, stats } = useCategories();

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Calculate stats from categories data
  const totalDocuments = stats?.totalDocuments || safeCategories.reduce((sum, cat) => sum + (cat.documentCount || 0), 0);
  const totalCategories = stats?.totalCategories || safeCategories.length;
  const avgDocumentsPerCategory = totalCategories > 0 ? Math.round(totalDocuments / totalCategories) : 0;

  if (loading) {
    return <LoadingSpinner message="Loading categories..." minHeight="50vh" />;
  }

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
                {totalCategories}
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
                {avgDocumentsPerCategory}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. per Category
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {safeCategories.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No categories found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by creating your first category to organize your documents.
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />}>
            Create Category
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {safeCategories.map((category) => {
            const color = getCategoryColor(category.name || 'Unknown');
            const icon = getCategoryIcon(category.name || 'Unknown');
            const documentCount = category.documentCount || 0;
            const maxDocuments = safeCategories.length > 0 ? Math.max(...safeCategories.map(c => c.documentCount || 0)) : 1;
            const recentActivity = getRelativeTime(category.updatedAt);

            return (
              <Grid item xs={12} md={6} lg={4} key={category._id || category.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: color,
                          width: 48,
                          height: 48,
                          mr: 2,
                          fontSize: '1.5rem'
                        }}
                      >
                        {icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2">
                          {category.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description || 'No description provided'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Documents
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {documentCount}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={maxDocuments > 0 ? (documentCount / maxDocuments) * 100 : 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        icon={<ArticleIcon />}
                        label={`${documentCount} docs`}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Updated {recentActivity}
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
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default CategoriesPage;
