import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import categoryService from '../services/categoryService';
import documentService from '../services/documentService';
import StatsCard from './StatsCard';

/**
 * Average Documents Per Category stats card component
 * Displays the average number of documents per category
 */
const AvgPerCategory = () => {
  // Function to fetch and calculate average documents per category
  const fetchAvgPerCategory = async () => {
    try {
      // Fetch both category and document stats
      const [categoryStats, documentStats] = await Promise.all([
        categoryService.getCategoryStats(),
        documentService.getStats()
      ]);

      const totalCategories = categoryStats.totalCategories;
      const totalDocuments = documentStats.totalDocuments;

      // Calculate average, avoiding division by zero
      if (totalCategories === 0) {
        return 0;
      }

      return Math.round(totalDocuments / totalCategories);
    } catch (error) {
      // If we can't fetch stats, return 0
      return 0;
    }
  };

  return (
    <StatsCard
      fetchData={fetchAvgPerCategory}
      title="Avg. per Category"
      icon={<TrendingUpIcon />}
      color="warning"
      loadingMessage="Calculating average..."
      formatter={(value) => value.toString()}
    />
  );
};

export default AvgPerCategory;
