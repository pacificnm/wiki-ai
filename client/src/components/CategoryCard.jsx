import {
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
  LinearProgress,
  Typography
} from '@mui/material';

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

/**
 * CategoryCard component for displaying category information
 * @param {Object} props - Component props
 * @param {Object} props.category - Category object
 * @param {string} props.category.id - Category ID
 * @param {string} props.category._id - Category MongoDB ID (alternative)
 * @param {string} props.category.name - Category name
 * @param {string} props.category.description - Category description
 * @param {number} props.category.documentCount - Number of documents in category
 * @param {string} props.category.updatedAt - Last update timestamp
 * @param {Array} props.allCategories - All categories for calculating max documents (optional)
 * @param {Function} props.onViewDocuments - Callback when "View Documents" is clicked
 * @param {Function} props.onEdit - Callback when "Edit" is clicked
 * @param {boolean} props.showActions - Whether to show action buttons (default: true)
 * @param {boolean} props.showProgress - Whether to show progress bar (default: true)
 */
const CategoryCard = ({
  category,
  allCategories = [],
  onViewDocuments,
  onEdit,
  showActions = true,
  showProgress = true
}) => {
  const color = getCategoryColor(category.name || 'Unknown');
  const icon = getCategoryIcon(category.name || 'Unknown');
  const documentCount = category.documentCount || 0;
  const maxDocuments = allCategories.length > 0
    ? Math.max(...allCategories.map(c => c.documentCount || 0))
    : Math.max(documentCount, 1);
  const recentActivity = getRelativeTime(category.updatedAt);

  const handleViewDocuments = () => {
    if (onViewDocuments) {
      onViewDocuments(category);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(category);
    }
  };

  return (
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

        {showProgress && (
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
        )}

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

      {showActions && (
        <CardActions>
          <Button
            size="small"
            color="primary"
            startIcon={<FolderIcon />}
            onClick={handleViewDocuments}
          >
            View Documents
          </Button>
          <Button
            size="small"
            onClick={handleEdit}
          >
            Edit
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

export default CategoryCard;
