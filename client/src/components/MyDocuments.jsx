import { Edit as EditIcon } from '@mui/icons-material';
import documentService from '../services/documentService';
import StatsCard from './StatsCard';

/**
 * My Documents stats card component
 * Displays the number of documents owned by the current user
 * For regular users: shows their total documents
 * For admin users: shows all documents (since they can see everything)
 */
const MyDocuments = () => {
  // Function to fetch user's document count
  const fetchMyDocuments = async () => {
    const data = await documentService.getStats();
    return data.totalDocuments;
  };

  return (
    <StatsCard
      fetchData={fetchMyDocuments}
      title="My Documents"
      icon={<EditIcon />}
      color="success"
      loadingMessage="Loading your documents..."
    />
  );
};

export default MyDocuments;
