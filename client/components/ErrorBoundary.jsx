import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugReportIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Error boundary component to catch and display React errors.
 * 
 * @component
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  /**
   * Static method called when an error occurs.
   * 
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state object
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Component lifecycle method called when an error occurs.
   * 
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack trace information
   */
  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Send error to monitoring service (e.g., Sentry, LogRocket, etc.)
    this.logErrorToService(error, errorInfo);
  }

/**
 * Log error to external monitoring service.
 * 
 * @param {Error} error - The error that was thrown
 * @param {Object} errorInfo - Component stack trace information
 */
logErrorToService = (error, errorInfo) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    level: 'error',
    source: 'react',
    metadata: {
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      reactVersion: React.version || 'Unknown'
    }
  };

  // Get auth token if available
  const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation

  if (process.env.NODE_ENV === 'production') {
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(errorData)
    }).catch(err => {
      console.error('Failed to log error to service:', err);
    });
  } else {
    console.log('Error data that would be sent to monitoring service:', errorData);
  }
};  /**
   * Handle retry button click.
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * Handle home navigation.
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Handle page refresh.
   */
  handleRefresh = () => {
    window.location.reload();
  };

  /**
   * Get user-friendly error message based on error type.
   * 
   * @returns {string} User-friendly error message
   */
  getUserFriendlyMessage = () => {
    const { error } = this.state;
    
    if (!error) return 'An unexpected error occurred';

    // Check for common error patterns
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a network issue or an updated version.';
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return 'You don\'t have permission to access this resource. Please sign in or contact support.';
    }

    return 'An unexpected error occurred while loading the page.';
  };

  /**
   * Get error category for styling and icons.
   * 
   * @returns {Object} Error category information
   */
  getErrorCategory = () => {
    const { error } = this.state;
    
    if (!error) return { type: 'error', color: 'error', icon: ErrorIcon };

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return { type: 'network', color: 'warning', icon: RefreshIcon };
    }
    
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return { type: 'network', color: 'warning', icon: RefreshIcon };
    }
    
    if (error.message.includes('Permission') || error.message.includes('Unauthorized')) {
      return { type: 'permission', color: 'error', icon: ErrorIcon };
    }

    return { type: 'error', color: 'error', icon: BugReportIcon };
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback component if provided
      if (fallback) {
        return fallback(error, errorInfo, {
          retry: this.handleRetry,
          goHome: this.handleGoHome,
          refresh: this.handleRefresh
        });
      }

      const userMessage = this.getUserFriendlyMessage();
      const errorCategory = this.getErrorCategory();
      const ErrorIcon = errorCategory.icon;

      return (
        <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
          <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
            {/* Error Icon and Title */}
            <Box display="flex" alignItems="center" mb={3}>
              <ErrorIcon 
                color={errorCategory.color} 
                sx={{ fontSize: 48, mr: 2 }} 
              />
              <Box>
                <Typography variant="h4" component="h1" color={errorCategory.color}>
                  Oops! Something went wrong
                </Typography>
                <Chip 
                  label={errorCategory.type.toUpperCase()} 
                  color={errorCategory.color}
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>

            {/* User-friendly message */}
            <Alert severity={errorCategory.color} sx={{ mb: 3 }}>
              <Typography variant="body1">
                {userMessage}
              </Typography>
            </Alert>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} mb={3}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                color="primary"
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                Go Home
              </Button>
            </Stack>

            {/* Error ID for support */}
            {errorId && (
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Error ID: {errorId}
              </Typography>
            )}

            {/* Technical details (expandable) */}
            {process.env.NODE_ENV === 'development' && error && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">
                    Technical Details (Development Only)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Error Message:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="pre" 
                      sx={{ 
                        backgroundColor: '#f5f5f5', 
                        p: 1, 
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem'
                      }}
                    >
                      {error.message}
                    </Typography>
                  </Box>

                  {error.stack && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Stack Trace:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="pre" 
                        sx={{ 
                          backgroundColor: '#f5f5f5', 
                          p: 1, 
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          maxHeight: '200px'
                        }}
                      >
                        {error.stack}
                      </Typography>
                    </Box>
                  )}

                  {errorInfo && errorInfo.componentStack && (
                    <Box>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        component="pre" 
                        sx={{ 
                          backgroundColor: '#f5f5f5', 
                          p: 1, 
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.75rem',
                          maxHeight: '200px'
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Contact support message */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                If this problem persists, please contact support and include the Error ID above.
              </Typography>
            </Alert>
          </Paper>
        </Container>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
