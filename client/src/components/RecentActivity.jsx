import {
  Add as AddIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useError } from '../hooks/useError';
import activityService from '../services/activityService';
import { logger } from '../utils/logger';
import LoadingSpinner from './LoadingSpinner';

/**
 * Recent Activity component that displays recent user activities
 * @param {Object} props - Component props
 * @param {number} props.limit - Number of activities to display (default: 5)
 * @param {boolean} props.global - Show global activities or user-specific (default: false)
 * @param {string} props.title - Custom title for the component (default: "Recent Activity")
 */
const RecentActivity = ({
  limit = 5,
  global = false,
  title = "Recent Activity"
}) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useError();

  /**
   * Fetch recent activities from the API
   */
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const activitiesData = await activityService.getRecentActivities({
        limit,
        global
      });

      setActivities(activitiesData);

      logger.info('Recent activities loaded successfully', {
        count: activitiesData.length,
        global
      });
    } catch (error) {
      handleError(error, 'Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  }, [limit, global, handleError]);

  // Load activities on mount
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  /**
   * Get icon for activity type
   * @param {string} type - Activity type
   * @returns {React.ReactNode} Icon component
   */
  const getActivityIcon = (type) => {
    switch (type) {
      case 'document_created':
        return <AddIcon />;
      case 'document_updated':
        return <EditIcon />;
      case 'favorite_added':
        return <FavoriteIcon />;
      case 'favorite_removed':
        return <FavoriteBorderIcon />;
      case 'document_viewed':
      case 'document_published':
      default:
        return <DocumentIcon />;
    }
  };

  /**
   * Get user-friendly activity text
   * @param {Object} activity - Activity object
   * @returns {string} Formatted activity text
   */
  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'document_created':
        return `created "${activity.title}"`;
      case 'document_updated':
        return `updated "${activity.title}"`;
      case 'document_published':
        return `published "${activity.title}"`;
      case 'document_viewed':
        return `viewed "${activity.title}"`;
      case 'favorite_added':
        return `favorited "${activity.title}"`;
      case 'favorite_removed':
        return `unfavorited "${activity.title}"`;
      case 'comment_added':
        return `commented on "${activity.title}"`;
      default:
        return `interacted with "${activity.title}"`;
    }
  };

  /**
   * Format timestamp to relative time
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time string
   */
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <LoadingSpinner size={32} message="Loading activities..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {title}
        </Typography>

        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No recent activities
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        <strong>{activity.user}</strong> {getActivityText(activity)}
                      </Typography>
                    }
                    secondary={formatTimeAgo(activity.timestamp)}
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
