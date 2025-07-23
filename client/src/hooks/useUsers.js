import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import userService from '../services/userService';
import { logger } from '../utils/logger';
import { useError } from './useError';

/**
 * Custom hook for managing user data and operations
 * @param {Object} options - Hook options
 * @returns {Object} User state and operations
 */
export function useUsers(options = {}) {
  const {
    autoFetch = true,
    initialSearch = '',
    initialRole = '',
    initialStatus = '',
    limit = 20
  } = options;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState(null);

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
    setUsers([]);
    setError(null);
    setTotal(0);
    setPage(0);
    setHasMore(true);
    setStats(null);
  }, []);

  /**
   * Fetch users from the server
   */
  const fetchUsers = useCallback(async (options = {}) => {
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
        setUsers([]);
        setPage(0);
      }

      const currentPage = resetData ? 0 : page;

      const response = await userService.getAllUsers({
        search: searchTerm,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit,
        skip: currentPage * limit
      });

      const newUsers = response.users || [];
      const totalCount = response.total || 0;

      if (isLoadMore) {
        setUsers(prevUsers => [...prevUsers, ...newUsers]);
      } else {
        setUsers(newUsers);
      }

      setTotal(totalCount);
      setHasMore(newUsers.length === limit && (currentPage + 1) * limit < totalCount);

      logger.debug('Users fetched successfully', {
        count: newUsers.length,
        total: totalCount,
        page: currentPage
      });

    } catch (err) {
      logger.error('Error fetching users', { error: err.message });
      const errorMessage = 'Failed to load users';
      setError(errorMessage);
      handleError(err, errorMessage);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, page, limit, clearError, handleError]);

  /**
   * Fetch user statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);

      logger.debug('User stats fetched successfully');
    } catch (err) {
      logger.error('Error fetching user stats', { error: err.message });
      // Don't show error to user for stats, just log it
    }
  }, []);

  /**
   * Load more users (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }

    setPage(prevPage => prevPage + 1);
    await fetchUsers({ isLoadMore: true, silent: true });
  }, [hasMore, loading, fetchUsers]);

  /**
   * Refresh users (reset and fetch)
   */
  const refresh = useCallback(async () => {
    logger.debug('Refreshing users');
    await fetchUsers({ resetData: true });
    await fetchStats();
  }, [fetchUsers, fetchStats]);

  /**
   * Search users
   */
  const search = useCallback(async (term) => {
    logger.debug('Searching users', { searchTerm: term });
    setSearchTerm(term);
    setPage(0);
    await fetchUsers({ resetData: true });
  }, [fetchUsers]);

  /**
   * Filter by role
   */
  const filterByRole = useCallback(async (role) => {
    logger.debug('Filtering users by role', { role });
    setRoleFilter(role);
    setPage(0);
    await fetchUsers({ resetData: true });
  }, [fetchUsers]);

  /**
   * Filter by status
   */
  const filterByStatus = useCallback(async (status) => {
    logger.debug('Filtering users by status', { status });
    setStatusFilter(status);
    setPage(0);
    await fetchUsers({ resetData: true });
  }, [fetchUsers]);

  /**
   * Create a new user
   */
  const createUser = useCallback(async (userData) => {
    setLoading(true);
    try {
      clearError();

      const newUser = await userService.createUser(userData);

      // Add the new user to the beginning of the list
      setUsers(prevUsers => [newUser, ...prevUsers]);
      setTotal(prevTotal => prevTotal + 1);

      enqueueSnackbar('User created successfully', { variant: 'success' });

      logger.info('User created successfully', { userId: newUser.id });

      // Refresh stats
      await fetchStats();

      return newUser;
    } catch (err) {
      logger.error('Error creating user', { error: err.message });
      const errorMessage = 'Failed to create user';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError, fetchStats]);

  /**
   * Update an existing user
   */
  const updateUser = useCallback(async (userId, updateData) => {
    setLoading(true);
    try {
      clearError();

      const updatedUser = await userService.updateUser(userId, updateData);

      // Update the user in the list
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? updatedUser : user)
      );

      enqueueSnackbar('User updated successfully', { variant: 'success' });

      logger.info('User updated successfully', { userId });

      return updatedUser;
    } catch (err) {
      logger.error('Error updating user', { userId, error: err.message });
      const errorMessage = 'Failed to update user';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError]);

  /**
   * Delete a user
   */
  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    try {
      clearError();

      await userService.deleteUser(userId);

      // Remove the user from the list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setTotal(prevTotal => prevTotal - 1);

      enqueueSnackbar('User deleted successfully', { variant: 'success' });

      logger.info('User deleted successfully', { userId });

      // Refresh stats
      await fetchStats();

    } catch (err) {
      logger.error('Error deleting user', { userId, error: err.message });
      const errorMessage = 'Failed to delete user';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, enqueueSnackbar, handleError, fetchStats]);

  /**
   * Toggle user status
   */
  const toggleUserStatus = useCallback(async (userId, status) => {
    try {
      clearError();

      const updatedUser = await userService.toggleUserStatus(userId, status);

      // Update the user in the list
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? updatedUser : user)
      );

      enqueueSnackbar(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`, {
        variant: 'success'
      });

      logger.info('User status updated successfully', { userId, status });

      // Refresh stats
      await fetchStats();

      return updatedUser;
    } catch (err) {
      logger.error('Error updating user status', { userId, status, error: err.message });
      const errorMessage = 'Failed to update user status';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    }
  }, [clearError, enqueueSnackbar, handleError, fetchStats]);

  /**
   * Update user role
   */
  const updateUserRole = useCallback(async (userId, role) => {
    try {
      clearError();

      const updatedUser = await userService.updateUserRole(userId, role);

      // Update the user in the list
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? updatedUser : user)
      );

      enqueueSnackbar('User role updated successfully', { variant: 'success' });

      logger.info('User role updated successfully', { userId, role });

      return updatedUser;
    } catch (err) {
      logger.error('Error updating user role', { userId, role, error: err.message });
      const errorMessage = 'Failed to update user role';
      setError(errorMessage);
      handleError(err, errorMessage);
      throw err;
    }
  }, [clearError, enqueueSnackbar, handleError]);

  /**
   * Get a single user by ID
   */
  const getUser = useCallback(async (userId) => {
    try {
      return await userService.getUserById(userId);
    } catch (err) {
      logger.error('Error getting user', { userId, error: err.message });
      handleError(err, 'Failed to load user');
      throw err;
    }
  }, [handleError]);

  // Auto-fetch users on mount
  useEffect(() => {
    if (autoFetch) {
      fetchUsers({ resetData: true });
      fetchStats();
    }
  }, [autoFetch, fetchUsers, fetchStats]);

  // Re-fetch when filters change
  useEffect(() => {
    if (autoFetch && (
      searchTerm !== initialSearch ||
      roleFilter !== initialRole ||
      statusFilter !== initialStatus
    )) {
      const timeoutId = setTimeout(() => {
        fetchUsers({ resetData: true });
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, roleFilter, statusFilter, autoFetch, initialSearch, initialRole, initialStatus, fetchUsers]);

  return {
    // State
    users,
    loading,
    error,
    total,
    hasMore,
    searchTerm,
    roleFilter,
    statusFilter,
    page,
    stats,

    // Actions
    fetchUsers,
    fetchStats,
    refresh,
    loadMore,
    search,
    filterByRole,
    filterByStatus,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserRole,
    getUser,
    clearError,
    reset,

    // Setters
    setSearchTerm,
    setRoleFilter,
    setStatusFilter
  };
}
