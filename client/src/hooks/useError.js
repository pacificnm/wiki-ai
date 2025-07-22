import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';

/**
 * Custom hook for handling errors in React components.
 *
 * @function useError
 * @returns {Object} Error handling utilities
 *
 * @example
 * function MyComponent() {
 *   const { handleError, clearError, error, isError } = useError();
 *
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getData();
 *       // handle success
 *     } catch (err) {
 *       handleError(err, 'Failed to fetch data');
 *     }
 *   };
 * }
 */
export function useError() {
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Handle an error with optional user message.
   *
   * @function handleError
   * @param {Error|string} err - Error object or message
   * @param {string} [userMessage] - User-friendly message to display
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.showSnackbar=true] - Whether to show snackbar
   * @param {string} [options.severity='error'] - Snackbar severity
   * @param {boolean} [options.logError=true] - Whether to log error
   */
  const handleError = useCallback((err, userMessage = null, options = {}) => {
    const {
      showSnackbar = true,
      severity = 'error',
      logError = true
    } = options;

    // Create error object
    const errorObj = {
      original: err,
      message: err?.message || err || 'An unknown error occurred',
      userMessage: userMessage || getUserFriendlyMessage(err),
      timestamp: new Date().toISOString(),
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Set error state
    setError(errorObj);

    // Show user notification
    if (showSnackbar) {
      enqueueSnackbar(errorObj.userMessage, {
        variant: severity,
        autoHideDuration: severity === 'error' ? 6000 : 4000
      });
    }

    // Log error
    if (logError) {
      console.error('Error handled by useError:', {
        message: errorObj.message,
        userMessage: errorObj.userMessage,
        original: err,
        stack: err?.stack,
        timestamp: errorObj.timestamp
      });

      // Send to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        sendToErrorService(errorObj);
      }
    }

    return errorObj;
  }, [enqueueSnackbar]);

  /**
   * Clear the current error.
   *
   * @function clearError
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle async operations with automatic error handling.
   *
   * @function handleAsync
   * @param {Function} asyncFn - Async function to execute
   * @param {string} [userMessage] - User-friendly error message
   * @returns {Promise} Promise that resolves with result or handles error
   *
   * @example
   * const { handleAsync } = useError();
   *
   * const result = await handleAsync(
   *   () => api.getData(),
   *   'Failed to load data'
   * );
   */
  const handleAsync = useCallback(async (asyncFn, userMessage = null) => {
    try {
      const result = await asyncFn();
      clearError(); // Clear any previous errors on success
      return result;
    } catch (err) {
      handleError(err, userMessage);
      throw err; // Re-throw so caller can handle if needed
    }
  }, [handleError, clearError]);

  return {
    error,
    isError: !!error,
    handleError,
    clearError,
    handleAsync
  };
}

/**
 * Convert technical errors to user-friendly messages.
 *
 * @function getUserFriendlyMessage
 * @param {Error|string} error - Error to convert
 * @returns {string} User-friendly message
 */
function getUserFriendlyMessage(error) {
  if (!error) return 'An unknown error occurred';

  const message = typeof error === 'string' ? error : error.message || '';
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
    return 'Please sign in to continue.';
  }

  // Permission errors
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('permission')) {
    return 'You don\'t have permission to perform this action.';
  }

  // Validation errors
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Rate limiting
  if (lowerMessage.includes('too many') || lowerMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Server errors
  if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
    return 'Server error. Please try again in a few moments.';
  }

  // Timeout errors
  if (lowerMessage.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Default message for unknown errors
  return 'Something went wrong. Please try again.';
}

/**
 * Send error information to monitoring service.
 *
 * @function sendToErrorService
 * @param {Object} errorObj - Error object to send
 */
function sendToErrorService(errorObj) {
  // In production, send to your error monitoring service
  // Examples: Sentry, LogRocket, Bugsnag, etc.

  const errorData = {
    message: errorObj.message,
    stack: errorObj.original?.stack || undefined,
    componentStack: undefined, // Will be populated by ErrorBoundary
    errorId: errorObj.id,
    timestamp: errorObj.timestamp,
    url: window.location.href,
    userAgent: navigator.userAgent,
    level: 'error',
    source: 'javascript',
    metadata: {
      userMessage: errorObj.userMessage,
      errorType: typeof errorObj.original,
      originalError: errorObj.original?.name || 'Unknown'
    }
  };

  // Get auth token if available
  const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation

  // Example API call to our error endpoint
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  fetch(`${serverUrl}/api/errors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify(errorData)
  }).catch(err => {
    console.warn('Failed to send error to monitoring service:', err);
  });
}

/**
 * Hook for handling API errors specifically.
 *
 * @function useApiError
 * @returns {Object} API error handling utilities
 */
export function useApiError() {
  const { handleError, ...rest } = useError();

  /**
   * Handle API response errors.
   *
   * @function handleApiError
   * @param {Response|Error} response - Fetch response or error
   * @param {string} [context] - Context of the API call
   */
  const handleApiError = useCallback(async (response, context = '') => {
    let errorMessage = 'API request failed';
    let userMessage = 'Something went wrong. Please try again.';

    try {
      if (response instanceof Error) {
        // Network or other errors
        errorMessage = response.message;
        userMessage = getUserFriendlyMessage(response);
      } else if (response && !response.ok) {
        // HTTP error responses
        const errorData = await response.json().catch(() => null);

        errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        userMessage = errorData?.error?.message || getUserFriendlyMessage(errorMessage);

        // Handle specific status codes
        switch (response.status) {
          case 401:
            userMessage = 'Please sign in to continue.';
            break;
          case 403:
            userMessage = 'You don\'t have permission to perform this action.';
            break;
          case 404:
            userMessage = 'The requested resource was not found.';
            break;
          case 429:
            userMessage = 'Too many requests. Please wait and try again.';
            break;
          case 500:
            userMessage = 'Server error. Please try again later.';
            break;
          default:
            userMessage = 'An unexpected error occurred. Please try again.';
        }
      }
    } catch (parseError) {
      errorMessage = 'Failed to parse error response';
    }

    const fullMessage = context ? `${context}: ${userMessage}` : userMessage;

    return handleError(new Error(errorMessage), fullMessage);
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    ...rest
  };
}
