import { Box, CircularProgress, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Reusable loading spinner component with customizable message and styling.
 *
 * @component
 * @example
 * <LoadingSpinner message="Loading data..." />
 * <LoadingSpinner size={40} minHeight="200px" />
 */
const LoadingSpinner = ({
  message = 'Loading...',
  size = 60,
  minHeight = '400px',
  color = 'primary',
  variant = 'indeterminate',
  centered = true,
  showMessage = true,
  sx = {}
}) => {
  const containerSx = centered
    ? {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight,
      gap: 2,
      ...sx
    }
    : {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      ...sx
    };

  return (
    <Box sx={containerSx}>
      <CircularProgress
        size={size}
        color={color}
        variant={variant}
      />
      {showMessage && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            fontSize: centered ? '1.25rem' : '1rem',
            fontWeight: centered ? 'normal' : 'medium'
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

LoadingSpinner.propTypes = {
  /** Loading message to display */
  message: PropTypes.string,
  /** Size of the spinner */
  size: PropTypes.number,
  /** Minimum height of the container when centered */
  minHeight: PropTypes.string,
  /** Color of the spinner */
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'info', 'success', 'warning', 'inherit']),
  /** Variant of the spinner */
  variant: PropTypes.oneOf(['determinate', 'indeterminate']),
  /** Whether to center the spinner vertically and horizontally */
  centered: PropTypes.bool,
  /** Whether to show the loading message */
  showMessage: PropTypes.bool,
  /** Additional styling for the container */
  sx: PropTypes.object
};

export default LoadingSpinner;
