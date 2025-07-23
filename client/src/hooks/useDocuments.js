import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import documentService from '../services/documentService';
import { logger } from '../utils/logger';
import { useError } from './useError';

/**
 * Custom hook for managing document data and operations
 * @param {Object} options - Hook options
 * @returns {Object} Document state and operations
 */
export function useDocuments(options = {}) {
  const {
    autoFetch = true,
    initialSearch = '',
    initialCategory = '',
    limit = 20
  } = options;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { enqueueSnackbar } = useSnackbar();
  const { handleError } = useError();

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setDocuments([]);
    setError(null);
    setTotal(0);
    setPage(0);
    setHasMore(true);
  }, []);

  /**
   * Fetch documents from the server
   */
  const fetchDocuments = useCallback(async (options = {}) => {
    const {
      isLoadMore = false,
      resetData = false,
      silent = false
    } = options;

    if (!silent) {
      setLoading(true);
    }

    try {
      clearError();

      if (resetData) {
        setDocuments([]);
        setPage(0);
      }

      const currentPage = resetData ? 0 : page;

      const response = await documentService.getAllDocuments({
        search: searchTerm,
        category: category || undefined,
        limit,
        skip: currentPage * limit
      });

      const newDocuments = response.documents || [];
      const totalCount = response.total || 0;

      if (isLoadMore) {
        setDocuments(prevDocs => [...prevDocs, ...newDocuments]);
      } else {
        setDocuments(newDocuments);
      }

      setTotal(totalCount);
      setHasMore(newDocuments.length === limit && (currentPage + 1) * limit < totalCount);

      logger.debug('Documents fetched successfully', {
        count: newDocuments.length,
        total: totalCount,
        page: currentPage
      });

    } catch (err) {
      logger.error('Error fetching documents', { error: err.message });
      const errorMessage = 'Failed to load documents';
      setError(errorMessage);
      handleError(err, errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, category, page, limit, clearError, handleError]);

  /**
   * Load more documents (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }

    setPage(prevPage => prevPage + 1);
    await fetchDocuments({ isLoadMore: true, silent: true });
  }, [hasMore, loading, fetchDocuments]);

  /**
   * Refresh documents (reset and fetch)
   */
  const refresh = useCallback(async () => {
    logger.debug('Refreshing documents');
    await fetchDocuments({ resetData: true });
  }, [fetchDocuments]);

  /**
   * Search documents
   */
  const search = useCallback(async (term) => {
    logger.debug('Searching documents', { searchTerm: term });
    setSearchTerm(term);
    setPage(0);
    await fetchDocuments({ resetData: true });
  }, [fetchDocuments]);

  /**
   * Filter by category
   */
  const filterByCategory = useCallback(async (categoryName) => {
    logger.debug('Filtering documents by category', { category: categoryName });
    setCategory(categoryName);
    setPage(0);
    await fetchDocuments({ resetData: true });
  }, [fetchDocuments]);

  /**
   * Create a new document
   */
  const createDocument = useCallback(async (documentData) => {
    setLoading(true);
    try {
      clearError();

      const newDocument = await documentService.createDocument(documentData);

      // Add the new document to the beginning of the list
      setDocuments(prevDocs => [newDocument, ...prevDocs]);
      setTotal(prevTotal => prevTotal + 1);

      enqueueSnackbar('Document created successfully', { variant: 'success' });

      logger.info('Document created successfully', { documentId: newDocument.id });

      return newDocument;
    } catch (err) {
      logger.error('Error creating document', { error: err.message });
      const errorMessage = 'Failed to create document';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError]);

  /**
   * Update an existing document
   */
  const updateDocument = useCallback(async (documentId, updateData) => {
    setLoading(true);
    try {
      clearError();

      const updatedDocument = await documentService.updateDocument(documentId, updateData);

      // Update the document in the list
      setDocuments(prevDocs =>
        prevDocs.map(doc => doc.id === documentId ? updatedDocument : doc)
      );

      enqueueSnackbar('Document updated successfully', { variant: 'success' });

      logger.info('Document updated successfully', { documentId });

      return updatedDocument;
    } catch (err) {
      logger.error('Error updating document', { documentId, error: err.message });
      const errorMessage = 'Failed to update document';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError]);

  /**
   * Delete a document
   */
  const deleteDocument = useCallback(async (documentId) => {
    setLoading(true);
    try {
      clearError();

      await documentService.deleteDocument(documentId);

      // Remove the document from the list
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      setTotal(prevTotal => prevTotal - 1);

      enqueueSnackbar('Document deleted successfully', { variant: 'success' });

      logger.info('Document deleted successfully', { documentId });

    } catch (err) {
      logger.error('Error deleting document', { documentId, error: err.message });
      const errorMessage = 'Failed to delete document';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError]);

  /**
   * Get a single document by ID
   */
  const getDocument = useCallback(async (documentId) => {
    try {
      return await documentService.getDocumentById(documentId);
    } catch (err) {
      logger.error('Error getting document', { documentId, error: err.message });
      handleError(err, 'Failed to load document');
      throw err;
    }
  }, [handleError]);

  // Auto-fetch documents on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchDocuments({ resetData: true });
    }
  }, [autoFetch, fetchDocuments]); // Only run on mount when autoFetch is enabled

  // Re-fetch when search term or category changes
  useEffect(() => {
    if (autoFetch && (searchTerm !== initialSearch || category !== initialCategory)) {
      const timeoutId = setTimeout(() => {
        fetchDocuments({ resetData: true });
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, category, autoFetch, initialSearch, initialCategory, fetchDocuments]);

  return {
    // State
    documents,
    loading,
    error,
    total,
    hasMore,
    searchTerm,
    category,
    page,

    // Actions
    fetchDocuments,
    refresh,
    loadMore,
    search,
    filterByCategory,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    clearError,
    reset,

    // Setters
    setSearchTerm,
    setCategory
  };
}
