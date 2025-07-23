import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useUsers } from '../../hooks/useUsers';
import { logger } from '../../utils/logger';

function UsersPage() {
  const { enqueueSnackbar } = useSnackbar();

  const {
    users,
    loading,
    error,
    stats,
    refresh,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateUserRole
  } = useUsers({
    autoFetch: true,
    limit: 50 // Show more users in admin panel
  });

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState({});

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEdit = () => {
    setEditUser({ ...selectedUser });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditUser({});
  };

  const handleSaveEdit = async () => {
    try {
      await updateUser(selectedUser.id, {
        displayName: editUser.displayName,
        role: editUser.role,
        department: editUser.department,
        status: editUser.status
      });
      setEditDialogOpen(false);
      setEditUser({});
      logger.info('User updated successfully', { userId: selectedUser.id });
    } catch (error) {
      logger.error('Error updating user:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await toggleUserStatus(user.id, newStatus);
      handleMenuClose();
      logger.info('User status toggled', { userId: user.id, newStatus });
    } catch (error) {
      logger.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      try {
        await deleteUser(user.id);
        handleMenuClose();
        logger.info('User deleted successfully', { userId: user.id });
      } catch (error) {
        logger.error('Error deleting user:', error);
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };

  // Use stats from API or calculate from users array as fallback
  const totalUsers = stats?.totalUsers || users.length;
  const activeUsers = stats?.activeUsers || users.filter(user => user.status === 'active').length;
  const totalDocuments = stats?.totalDocuments || users.reduce((sum, user) => sum + (user.documentsCreated || 0), 0);

  // Show loading spinner on initial load
  if (loading && users.length === 0) {
    return (
      <LoadingSpinner
        message="Loading users..."
        centered
        size="large"
      />
    );
  }

  // Show error state
  if (error && users.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to Load Users
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button variant="contained" onClick={refresh}>
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        User Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {activeUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ mb: 1 }}>
                {totalDocuments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents Created
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            All Users
          </Typography>
          <Button variant="contained" color="primary">
            Add User
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {(user.displayName || user.email).split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{user.displayName || 'No Name'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.department || 'Not specified'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{user.documentsCreated || 0}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleToggleStatus(selectedUser)}>
          <BlockIcon sx={{ mr: 1 }} />
          {selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={() => handleDeleteUser(selectedUser)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={editUser.displayName || ''}
              onChange={(e) => setEditUser({ ...editUser, displayName: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editUser.email || ''}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              sx={{ mb: 2 }}
              disabled // Email shouldn't be editable
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={editUser.role || ''}
                label="Role"
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Department"
              value={editUser.department || ''}
              onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={editUser.status || 'active'}
                label="Status"
                onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              Changes will take effect immediately after saving.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UsersPage;
