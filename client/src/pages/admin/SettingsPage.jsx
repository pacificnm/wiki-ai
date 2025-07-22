import {
  Backup as BackupIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Update as UpdateIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';

function SettingsPage() {
  const [settings, setSettings] = React.useState({
    // General Settings
    siteName: 'Wiki-AI Platform',
    siteDescription: 'Knowledge management and documentation platform',
    maintenanceMode: false,
    registrationEnabled: true,

    // Security Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: 24,
    passwordMinLength: 8,

    // Notification Settings
    emailNotifications: true,
    systemAlerts: true,
    digestFrequency: 'weekly',

    // Storage Settings
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,txt,md,jpg,png,gif',
    autoCleanup: true,
    cleanupDays: 30
  });

  const [systemInfo] = React.useState({
    version: '1.0.0',
    uptime: '15 days, 4 hours',
    totalUsers: 127,
    totalDocuments: 1234,
    storageUsed: '2.3 GB',
    storageLimit: '10 GB',
    lastBackup: '2024-01-15 03:00:00'
  });

  const [backupDialogOpen, setBackupDialogOpen] = React.useState(false);

  const handleSettingChange = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({
      ...settings,
      [key]: value
    });
  };

  const handleSaveSettings = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', settings);
    // Show success message
  };

  const handleCreateBackup = () => {
    setBackupDialogOpen(false);
    // TODO: Implement backup functionality
    console.log('Creating backup...');
  };

  const storagePercentage = (parseFloat(systemInfo.storageUsed) / parseFloat(systemInfo.storageLimit)) * 100;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              System Overview
            </Typography>

            <List>
              <ListItem>
                <ListItemText primary="Version" secondary={systemInfo.version} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Uptime" secondary={systemInfo.uptime} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Users" secondary={systemInfo.totalUsers} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Total Documents" secondary={systemInfo.totalDocuments} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Storage Used"
                  secondary={`${systemInfo.storageUsed} of ${systemInfo.storageLimit} (${storagePercentage.toFixed(1)}%)`}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Last Backup" secondary={systemInfo.lastBackup} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={() => setBackupDialogOpen(true)}
                >
                  Create Backup
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<UpdateIcon />}
                  disabled
                >
                  Check for Updates
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<WarningIcon />}
                  disabled={!settings.maintenanceMode}
                >
                  {settings.maintenanceMode ? 'Exit' : 'Enter'} Maintenance Mode
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* General Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SettingsIcon sx={{ mr: 1 }} />
              General Settings
            </Typography>

            <TextField
              fullWidth
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Site Description"
              multiline
              rows={3}
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceMode}
                  onChange={handleSettingChange('maintenanceMode')}
                />
              }
              label="Maintenance Mode"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.registrationEnabled}
                  onChange={handleSettingChange('registrationEnabled')}
                />
              }
              label="Allow User Registration"
            />

            {settings.maintenanceMode && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Maintenance mode is enabled. Only administrators can access the system.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Security Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireEmailVerification}
                  onChange={handleSettingChange('requireEmailVerification')}
                />
              }
              label="Require Email Verification"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableTwoFactor}
                  onChange={handleSettingChange('enableTwoFactor')}
                />
              }
              label="Enable Two-Factor Authentication"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Session Timeout (hours)"
              type="number"
              value={settings.sessionTimeout}
              onChange={handleSettingChange('sessionTimeout')}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Minimum Password Length"
              type="number"
              value={settings.passwordMinLength}
              onChange={handleSettingChange('passwordMinLength')}
            />
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Notification Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleSettingChange('emailNotifications')}
                />
              }
              label="Enable Email Notifications"
              sx={{ mb: 1 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.systemAlerts}
                  onChange={handleSettingChange('systemAlerts')}
                />
              }
              label="System Alerts"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Digest Frequency"
              value={settings.digestFrequency}
              onChange={handleSettingChange('digestFrequency')}
              SelectProps={{ native: true }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="disabled">Disabled</option>
            </TextField>
          </Paper>
        </Grid>

        {/* Storage Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <StorageIcon sx={{ mr: 1 }} />
              Storage Settings
            </Typography>

            <TextField
              fullWidth
              label="Max File Size (MB)"
              type="number"
              value={settings.maxFileSize}
              onChange={handleSettingChange('maxFileSize')}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Allowed File Types"
              value={settings.allowedFileTypes}
              onChange={handleSettingChange('allowedFileTypes')}
              helperText="Comma-separated list of file extensions"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoCleanup}
                  onChange={handleSettingChange('autoCleanup')}
                />
              }
              label="Enable Auto Cleanup"
              sx={{ mb: 1 }}
            />

            {settings.autoCleanup && (
              <TextField
                fullWidth
                label="Cleanup Days"
                type="number"
                value={settings.cleanupDays}
                onChange={handleSettingChange('cleanupDays')}
                helperText="Delete unused files after N days"
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={handleSaveSettings}>
          Save All Settings
        </Button>
      </Box>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)}>
        <DialogTitle>Create System Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            This will create a complete backup of your system including:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• All user data and documents" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• System settings and configuration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• File uploads and attachments" />
            </ListItem>
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            Backup process may take several minutes to complete.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SettingsPage;
