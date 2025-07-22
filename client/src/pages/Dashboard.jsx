import {
  Add as AddIcon,
  Category as CategoryIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    myDocuments: 0,
    totalCategories: 0,
    recentActivity: []
  });
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual API calls
      // Simulated data for now
      setTimeout(() => {
        setStats({
          totalDocuments: 156,
          myDocuments: 23,
          totalCategories: 12,
          recentActivity: [
            {
              id: 1,
              type: 'document_created',
              title: 'Getting Started with React',
              user: 'John Doe',
              timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
              id: 2,
              type: 'document_updated',
              title: 'MongoDB Best Practices',
              user: 'Jane Smith',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            },
            {
              id: 3,
              type: 'document_created',
              title: 'API Documentation Guide',
              user: 'Mike Johnson',
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
            }
          ]
        });

        setRecentDocuments([
          {
            id: 1,
            title: 'Getting Started with React',
            description: 'A comprehensive guide to React fundamentals',
            category: 'Frontend',
            author: 'John Doe',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            viewCount: 45
          },
          {
            id: 2,
            title: 'MongoDB Best Practices',
            description: 'Optimizing your MongoDB queries and schema design',
            category: 'Database',
            author: 'Jane Smith',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            viewCount: 78
          },
          {
            id: 3,
            title: 'API Documentation Guide',
            description: 'How to write effective API documentation',
            category: 'Documentation',
            author: 'Mike Johnson',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            viewCount: 32
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'document_created':
        return <AddIcon />;
      case 'document_updated':
        return <EditIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'document_created':
        return `created "${activity.title}"`;
      case 'document_updated':
        return `updated "${activity.title}"`;
      default:
        return `interacted with "${activity.title}"`;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.displayName || user?.email}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what&apos;s happening in your wiki today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Documents
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalDocuments}
                  </Typography>
                </Box>
                <DocumentIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    My Documents
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.myDocuments}
                  </Typography>
                </Box>
                <EditIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Categories
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalCategories}
                  </Typography>
                </Box>
                <CategoryIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Views
                  </Typography>
                  <Typography variant="h4" component="div">
                    2.3K
                  </Typography>
                </Box>
                <TrendingIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Documents */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Recent Documents
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={() => navigate('/documents/new')}
                >
                  New Document
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentDocuments.map((doc) => (
                  <Card key={doc.id} variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3">
                          {doc.title}
                        </Typography>
                        <Chip label={doc.category} size="small" color="primary" variant="outlined" />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {doc.description}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          By {doc.author} • {formatTimeAgo(doc.updatedAt)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ViewIcon sx={{ fontSize: 16 }} color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {doc.viewCount}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<ViewIcon />}>
                        View
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button onClick={() => navigate('/documents')}>
                  View All Documents
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>

              <List sx={{ width: '100%' }}>
                {stats.recentActivity.map((activity, index) => (
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
                    {index < stats.recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
