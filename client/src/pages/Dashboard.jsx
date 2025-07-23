import {
  Box,
  Grid,
  Typography
} from '@mui/material';
import { useContext } from 'react';
import MyDocuments from '../components/MyDocuments';
import RecentActivity from '../components/RecentActivity';
import RecentDocuments from '../components/RecentDocuments';
import TotalCategories from '../components/TotalCategories';
import TotalDocuments from '../components/TotalDocuments';
import TotalViews from '../components/TotalViews';
import { AuthContext } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

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
          <TotalDocuments />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MyDocuments />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TotalCategories />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TotalViews />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Documents */}
        <Grid item xs={12} md={8}>
          <RecentDocuments limit={5} />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <RecentActivity limit={5} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
