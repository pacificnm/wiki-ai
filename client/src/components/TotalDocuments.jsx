import { Description as DocumentIcon } from '@mui/icons-material';
import documentService from '../services/documentService';
import StatsCard from './StatsCard';

/**
 * Total Documents stats card component
 * Displays the total number of documents in the system
 */
const TotalDocuments = () => {
  // Function to fetch total documents count
  const fetchTotalDocuments = async () => {
    const data = await documentService.getStats();
    return data.totalDocuments;
  };

  return (
    <StatsCard
      fetchData={fetchTotalDocuments}
      title="Total Documents"
      icon={<DocumentIcon />}
      color="primary"
      loadingMessage="Loading documents..."
    />
  );
};

export default TotalDocuments;
