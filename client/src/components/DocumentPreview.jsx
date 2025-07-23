import { Box, Paper, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

/**
 * DocumentPreview component for rendering markdown content
 * @param {Object} props - Component props
 * @param {string} props.title - Document title
 * @param {string} props.content - Markdown content to render
 * @param {Array} props.categories - Selected categories
 * @param {Array} props.tags - Document tags
 * @param {Object} props.style - Custom styles
 */
const DocumentPreview = ({
  title = 'Untitled Document',
  content = '',
  categories = [],
  tags = [],
  style = {}
}) => {
  return (
    <Paper sx={{ p: 4, height: '100%', ...style }}>
      {/* Document Header */}
      <Box sx={{ mb: 4, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {title}
        </Typography>

        {/* Categories and Tags */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {categories.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Categories:
              </Typography>
              {categories.map((category, index) => (
                <Typography key={index} variant="body2" color="primary">
                  {category.name || category}
                  {index < categories.length - 1 && ','}
                </Typography>
              ))}
            </Box>
          )}

          {tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Tags:
              </Typography>
              {tags.map((tag, index) => (
                <Typography key={index} variant="body2" color="secondary">
                  #{tag}
                  {index < tags.length - 1 && ','}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Document Content */}
      <Box sx={{
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          color: 'text.primary',
          marginTop: 2,
          marginBottom: 1,
          fontWeight: 'bold'
        },
        '& h1': {
          fontSize: '2rem',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: 1
        },
        '& h2': {
          fontSize: '1.5rem'
        },
        '& h3': {
          fontSize: '1.25rem'
        },
        '& p': {
          marginBottom: 2,
          lineHeight: 1.7
        },
        '& ul, & ol': {
          paddingLeft: 2,
          marginBottom: 2
        },
        '& li': {
          marginBottom: 0.5
        },
        '& blockquote': {
          borderLeft: '4px solid #1976d2',
          paddingLeft: 2,
          marginLeft: 0,
          marginBottom: 2,
          fontStyle: 'italic',
          backgroundColor: '#f5f5f5',
          padding: 2
        },
        '& code': {
          backgroundColor: '#f5f5f5',
          padding: '2px 4px',
          borderRadius: 1,
          fontSize: '0.9em',
          fontFamily: 'monospace'
        },
        '& pre': {
          backgroundColor: '#f5f5f5',
          padding: 2,
          borderRadius: 1,
          marginBottom: 2,
          overflow: 'auto'
        },
        '& pre code': {
          backgroundColor: 'transparent',
          padding: 0
        },
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 2
        },
        '& th, & td': {
          border: '1px solid #e0e0e0',
          padding: 1,
          textAlign: 'left'
        },
        '& th': {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold'
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto'
        },
        '& a': {
          color: '#1976d2',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }
      }}>
        {content.trim() ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <Box sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
            fontStyle: 'italic'
          }}>
            <Typography variant="h6">
              No content to preview
            </Typography>
            <Typography variant="body2">
              Start writing in the editor to see a preview here
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DocumentPreview;
