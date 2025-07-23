import { TrendingUp as TrendingIcon } from '@mui/icons-material';
import documentService from '../services/documentService';
import StatsCard from './StatsCard';

/**
 * Total Views stats card component
 * Displays the total number of document views in the system
 */
const TotalViews = () => {
  // Function to fetch total views count
  const fetchTotalViews = async () => {
    const data = await documentService.getStats();
    return data.totalViews;
  };

  // Format large numbers (e.g., 2300 becomes "2.3K")
  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <StatsCard
      fetchData={fetchTotalViews}
      title="Total Views"
      icon={<TrendingIcon />}
      color="warning"
      formatter={formatViewCount}
      loadingMessage="Loading views..."
    />
  );
};

export default TotalViews;
