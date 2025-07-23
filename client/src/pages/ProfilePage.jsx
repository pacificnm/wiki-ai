import {
  Edit as EditIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../contexts/AuthContext';
import { useError } from '../hooks/useError';
import userService from '../services/userService';
import { logger } from '../utils/logger';

function ProfilePage() {
  const { user, updateUserProfile } = useContext(AuthContext);
  const { handleError } = useError();
  const { enqueueSnackbar } = useSnackbar();

  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    role: '',
    department: '',
    profileImage: '',
    createdAt: null
  });

  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    autoSave: true,
    publicProfile: true
  });

  const [recentActivity] = useState([
    {
      type: 'document',
      action: 'edited',
      title: 'API Documentation',
      timestamp: '2 hours ago'
    },
    {
      type: 'document',
      action: 'created',
      title: 'Getting Started Guide',
      timestamp: '1 day ago'
    },
    {
      type: 'comment',
      action: 'added comment to',
      title: 'Best Practices Document',
      timestamp: '2 days ago'
    }
  ]);

  /**
   * Load user profile from API
   */
  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userService.getCurrentUserProfile();

      const profileState = {
        displayName: profileData.displayName || '',
        email: profileData.email || '',
        role: profileData.role || '',
        department: profileData.department || '',
        profileImage: profileData.profileImage || '',
        createdAt: profileData.createdAt
      };

      setProfile(profileState);
      setOriginalProfile(profileState);
      setHasChanges(false);

      logger.info('Profile loaded successfully');
    } catch (error) {
      logger.error('Failed to load profile', { error: error.message });
      handleError(error, 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Load profile on component mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Check for changes when profile updates
  useEffect(() => {
    const hasProfileChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasChanges(hasProfileChanges);
  }, [profile, originalProfile]);

  const handlePreferenceChange = (key) => (event) => {
    setPreferences({
      ...preferences,
      [key]: event.target.checked
    });
  };

  const handleProfileChange = (field, value) => {
    setProfile({
      ...profile,
      [field]: value
    });
  };

  /**
   * Save profile changes
   */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Prepare data for API (only send changed fields)
      const changes = {};
      for (const key in profile) {
        if (profile[key] !== originalProfile[key]) {
          changes[key] = profile[key];
        }
      }

      if (Object.keys(changes).length === 0) {
        enqueueSnackbar('No changes to save', { variant: 'info' });
        return;
      }


      // Use AuthContext to update and sync user globally
      const updatedProfile = await updateUserProfile(changes);

      // Update local state with the new profile
      const newProfileState = {
        displayName: updatedProfile.displayName || '',
        email: updatedProfile.email || '',
        role: updatedProfile.role || '',
        department: updatedProfile.department || '',
        profileImage: updatedProfile.profileImage || '',
        createdAt: updatedProfile.createdAt
      };
      setProfile(newProfileState);
      setOriginalProfile(newProfileState);
      setHasChanges(false);

      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      logger.info('Profile saved successfully', { changes: Object.keys(changes) });

    } catch (error) {
      logger.error('Failed to save profile', { error: error.message });
      handleError(error, 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel profile changes
   */
  const handleCancelChanges = () => {
    setProfile(originalProfile);
    setHasChanges(false);
  };

  // Show loading spinner while loading profile
  if (loading) {
    return (
      <LoadingSpinner
        message="Loading profile..."
        centered
        size="large"
      />
    );
  }

  // Show message if no user
  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Please log in to view your profile
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
              src={profile.profileImage}
            >
              {profile.displayName ? profile.displayName.split(' ').map(n => n[0]).join('') : '?'}
            </Avatar>

            <Typography variant="h5" gutterBottom>
              {profile.displayName || 'Unknown User'}
            </Typography>

            <Chip
              label={profile.role}
              color="primary"
              sx={{ mb: 1 }}
            />

            <Typography variant="body2" color="text.secondary" paragraph>
              {profile.department || 'No department set'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
            </Typography>

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mt: 2 }}
              fullWidth
            >
              Change Photo
            </Button>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Preferences
            </Typography>

            <List>
              <ListItem>
                <ListItemText primary="Email Notifications" secondary="Receive updates via email" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={handlePreferenceChange('emailNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Push Notifications" secondary="Browser notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={handlePreferenceChange('pushNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Dark Mode" secondary="Use dark theme" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.darkMode}
                    onChange={handlePreferenceChange('darkMode')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Auto Save" secondary="Automatically save changes" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={preferences.autoSave}
                    onChange={handlePreferenceChange('autoSave')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={profile.displayName}
                  onChange={(e) => handleProfileChange('displayName', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={profile.role}
                  disabled
                  helperText="Role can only be changed by an administrator"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  disabled
                  helperText="Email cannot be changed"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department"
                  value={profile.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                  placeholder="Enter your department"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveProfile}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelChanges}
                disabled={!hasChanges || saving}
              >
                Cancel
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Recent Activity
            </Typography>

            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={`${activity.action} "${activity.title}"`}
                      secondary={activity.timestamp}
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>

            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
              View All Activity
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProfilePage;
