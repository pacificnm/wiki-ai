import {
  Article as ArticleIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Typography
} from '@mui/material';

/**
 * Reusable document card component
 * @param {Object} props - Component props
 * @param {Object} props.document - Document data
 * @param {Function} props.onView - Callback when view button is clicked
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onToggleFavorite - Callback when favorite is toggled (optional)
 * @param {Function} props.onDelete - Callback when delete button is clicked (optional)
 * @param {Function} props.onShare - Callback when share button is clicked (optional)
 * @param {boolean} props.showFavorite - Whether to show favorite toggle (default: false)
 * @param {boolean} props.showDelete - Whether to show delete button (default: false)
 * @param {boolean} props.showShare - Whether to show share button (default: false)
 * @param {boolean} props.showCategory - Whether to show category info (default: true)
 * @param {boolean} props.showViewCount - Whether to show view count (default: false)
 * @param {string} props.layout - Layout style: 'grid' or 'list' (default: 'grid')
 * @param {Function} props.formatTimeAgo - Custom time formatting function (optional)
 */
const DocumentCard = ({
  document,
  onView,
  onEdit,
  onToggleFavorite,
  onDelete,
  onShare,
  showFavorite = false,
  showDelete = false,
  showShare = false,
  showCategory = true,
  showViewCount = false,
  layout = 'grid',
  formatTimeAgo
}) => {
  const handleView = () => {
    if (onView) onView(document);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(document);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(document.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(document.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(document);
  };

  const defaultFormatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const timeFormatter = formatTimeAgo || defaultFormatTimeAgo;

  // Grid layout (used in favorites, documents page)
  if (layout === 'grid') {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <ArticleIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              {document.title}
            </Typography>
            {showFavorite && (
              <IconButton
                size="small"
                onClick={handleToggleFavorite}
                color={document.isFavorite ? 'error' : 'default'}
              >
                {document.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {document.description || document.excerpt}
          </Typography>

          {document.tags && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {document.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {showCategory && document.category && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CategoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {document.category}
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block">
            By {document.author} • Updated {timeFormatter(document.updatedAt)}
          </Typography>

          {showViewCount && document.viewCount !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <ViewIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {document.viewCount} views
              </Typography>
            </Box>
          )}

          {document.addedToFavorites && (
            <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
              Added to favorites: {timeFormatter(document.addedToFavorites)}
            </Typography>
          )}
        </CardContent>

        <CardActions>
          <Button size="small" color="primary" onClick={handleView}>
            View
          </Button>
          <Button size="small" onClick={handleEdit}>
            Edit
          </Button>
          {showDelete && (
            <IconButton
              size="small"
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          {showShare && (
            <IconButton size="small" onClick={handleShare}>
              <ShareIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      </Card>
    );
  }

  // List layout (used in dashboard recent documents)
  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3">
            {document.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {document.category && (
              <Chip label={document.category} size="small" color="primary" variant="outlined" />
            )}
            {showFavorite && (
              <IconButton
                size="small"
                onClick={handleToggleFavorite}
                color={document.isFavorite ? 'error' : 'default'}
              >
                {document.isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {document.description || document.excerpt}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            By {document.author} • {timeFormatter(document.updatedAt)}
          </Typography>
          {showViewCount && document.viewCount !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewIcon sx={{ fontSize: 16 }} color="action" />
              <Typography variant="caption" color="text.secondary">
                {document.viewCount}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" startIcon={<ViewIcon />} onClick={handleView}>
          View
        </Button>
        <Button size="small" startIcon={<EditIcon />} onClick={handleEdit}>
          Edit
        </Button>
        {showDelete && (
          <IconButton
            size="small"
            onClick={handleDelete}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
        {showShare && (
          <IconButton size="small" onClick={handleShare}>
            <ShareIcon fontSize="small" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default DocumentCard;
