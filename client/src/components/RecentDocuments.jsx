import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../hooks/useError';
import documentService from '../services/documentService';
import { logger } from '../utils/logger';
import DocumentCard from './DocumentCard';
import LoadingSpinner from './LoadingSpinner';

/**
 * Recent Documents component that displays recently updated documents
 * @param {Object} props - Component props
 * @param {number} props.limit - Number of documents to display (default: 5)
 * @param {boolean} props.showNewButton - Whether to show "New Document" button (default: true)
 * @param {boolean} props.showViewAll - Whether to show "View All Documents" button (default: true)
 * @param {string} props.title - Custom title for the component (default: "Recent Documents")
 */
const RecentDocuments = ({
  limit = 5,
  showNewButton = true,
  showViewAll = true,
  title = "Recent Documents"
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleError } = useError();
  const navigate = useNavigate();

  /**
   * Fetch recent documents from the API
   */
  const fetchRecentDocuments = useCallback(async () => {
    try {
      setLoading(true);

      // Get documents sorted by most recently updated
      const documentsData = await documentService.getAllDocuments({
        limit,
        // Add any other options for sorting by recent updates
      });

      setDocuments(documentsData.documents || []);

      logger.info('Recent documents loaded successfully', {
        count: documentsData.documents?.length || 0
      });
    } catch (error) {
      handleError(error, 'Failed to load recent documents');
    } finally {
      setLoading(false);
    }
  }, [limit, handleError]);

  // Load documents on mount
  useEffect(() => {
    fetchRecentDocuments();
  }, [fetchRecentDocuments]);

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

  /**
   * Handle viewing a document
   * @param {Object} document - Document to view
   */
  const handleViewDocument = (document) => {
    navigate(`/documents/${document.id || document._id}`);
  };

  /**
   * Handle editing a document
   * @param {Object} document - Document to edit
   */
  const handleEditDocument = (document) => {
    navigate(`/documents/${document.id || document._id}/edit`);
  };

  /**
   * Handle creating a new document
   */
  const handleNewDocument = () => {
    navigate('/documents/new');
  };

  /**
   * Handle viewing all documents
   */
  const handleViewAllDocuments = () => {
    navigate('/documents');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {showNewButton && (
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleNewDocument}
              >
                New Document
              </Button>
            )}
          </Box>
          <LoadingSpinner size={32} message="Loading documents..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {showNewButton && (
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleNewDocument}
            >
              New Document
            </Button>
          )}
        </Box>

        {documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No documents found
            </Typography>
            {showNewButton && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={handleNewDocument}
                sx={{ mt: 2 }}
              >
                Create your first document
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id || doc._id}
                  document={doc}
                  onView={handleViewDocument}
                  onEdit={handleEditDocument}
                  showViewCount={true}
                  layout="list"
                  formatTimeAgo={formatTimeAgo}
                />
              ))}
            </Box>

            {showViewAll && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button onClick={handleViewAllDocuments}>
                  View All Documents
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentDocuments;
