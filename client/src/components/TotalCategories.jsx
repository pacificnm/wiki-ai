import { Category as CategoryIcon } from '@mui/icons-material';
import categoryService from '../services/categoryService';
import StatsCard from './StatsCard';

/**
 * Total Categories stats card component
 * Displays the total number of categories in the system
 */
const TotalCategories = () => {
  // Function to fetch total categories count
  const fetchTotalCategories = async () => {
    const data = await categoryService.getCategoryStats();
    return data.totalCategories;
  };

  return (
    <StatsCard
      fetchData={fetchTotalCategories}
      title="Categories"
      icon={<CategoryIcon />}
      color="info"
      loadingMessage="Loading categories..."
    />
  );
};

export default TotalCategories;
