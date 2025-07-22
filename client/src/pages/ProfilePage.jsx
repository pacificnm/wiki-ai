import {
  Edit as EditIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
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
import React from 'react';

function ProfilePage() {
  const [profile, setProfile] = React.useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Editor',
    department: 'Content Team',
    bio: 'Experienced technical writer with a passion for creating clear, comprehensive documentation.',
    avatar: '',
    joinDate: '2023-06-15'
  });

  const [preferences, setPreferences] = React.useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    autoSave: true,
    publicProfile: true
  });

  const [recentActivity] = React.useState([
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
            >
              {profile.name.split(' ').map(n => n[0]).join('')}
            </Avatar>

            <Typography variant="h5" gutterBottom>
              {profile.name}
            </Typography>

            <Chip
              label={profile.role}
              color="primary"
              sx={{ mb: 1 }}
            />

            <Typography variant="body2" color="text.secondary" paragraph>
              {profile.department}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Member since {new Date(profile.joinDate).toLocaleDateString()}
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
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={profile.role}
                  onChange={(e) => handleProfileChange('role', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department"
                  value={profile.department}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary">
                Save Changes
              </Button>
              <Button variant="outlined">
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
