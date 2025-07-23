import { Box, Card, CardContent, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import LoadingSpinner from './LoadingSpinner';

/**
 * Reusable stats card component that fetches data from an API
 * @param {Object} props - Component props
 * @param {Function} props.fetchData - Function that returns a Promise with the stat value
 * @param {string} props.title - Card title
 * @param {string} props.dataKey - Key to extract from the fetched data (optional if fetchData returns the value directly)
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.color - Icon color
 * @param {Function} props.formatter - Optional function to format the display value
 * @param {string} props.loadingMessage - Optional loading message
 */
const StatsCard = ({
  fetchData,
  title,
  dataKey,
  icon,
  color = 'primary',
  formatter,
  loadingMessage = 'Loading...'
}) => {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchData();

        // Extract the value using dataKey if provided, otherwise use the data directly
        const extractedValue = dataKey ? data[dataKey] : data;
        setValue(extractedValue);

        logger.info('Stats card data loaded', {
          title,
          value: extractedValue
        });
      } catch (err) {
        logger.error('Error loading stats card data', {
          title,
          error: err.message
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchData, title, dataKey]);

  const displayValue = () => {
    if (error) return 'Error';
    if (value === null || value === undefined) return '0';
    if (formatter) return formatter(value);
    return value.toLocaleString();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                <LoadingSpinner size={20} message="" />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {loadingMessage}
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="h4"
                component="div"
                color={error ? 'error' : 'inherit'}
                title={error || undefined}
              >
                {displayValue()}
              </Typography>
            )}
          </Box>
          {React.cloneElement(icon, {
            color: error ? 'error' : color,
            sx: { fontSize: 40 }
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
