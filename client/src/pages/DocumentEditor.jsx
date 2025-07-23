import {
  Category as CategoryIcon,
  Preview as PreviewIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import DocumentPreview from '../components/DocumentPreview';
import MarkdownEditor from '../components/MarkdownEditor';
import { useCategories } from '../hooks/useCategories';
import documentService from '../services/documentService';
import { validateCreateDocument, validateUpdateDocument } from '../utils/documentValidation';

function DocumentEditor() {
  const { id } = useParams(); // Get document ID from URL if editing
  const navigate = useNavigate();
  const { getCategoryById } = useCategories();

  // Form state
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [categoryIds, setCategoryIds] = React.useState([]);
  const [tags, setTags] = React.useState([]);
  const [tagInput, setTagInput] = React.useState('');
  const [previewMode, setPreviewMode] = React.useState(false);

  // UI state
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [validationErrors, setValidationErrors] = React.useState({});

  // Real-time validation helper
  const validateFieldRealTime = (fieldName, value) => {
    const documentData = {
      title: fieldName === 'title' ? value : title,
      content: fieldName === 'content' ? value : content,
      categories: fieldName === 'categories' ? value : categoryIds,
      tags: fieldName === 'tags' ? value : tags,
      isPublished: false
    };

    const validation = id
      ? validateUpdateDocument(documentData)
      : validateCreateDocument(documentData);

    const newErrors = { ...validationErrors };

    if (validation.success) {
      delete newErrors[fieldName];
    } else {
      const fieldError = validation.errors.find(err => err.field === fieldName);
      if (fieldError) {
        newErrors[fieldName] = fieldError.message;
      }
    }

    setValidationErrors(newErrors);
  };

  // Load document if editing
  React.useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  const loadDocument = async () => {
    try {
      setInitialLoading(true);
      setError('');

      const document = await documentService.getDocumentById(id);

      setTitle(document.title || '');
      setContent(document.content || '');
      setCategoryIds(document.categories?.map(cat => cat.id) || []);
      setTags(document.tags || []);
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      validateFieldRealTime('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    validateFieldRealTime('tags', newTags);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      const documentData = {
        title: title.trim(),
        content,
        categories: categoryIds, // Send category IDs
        tags,
        isPublished: false // Default to draft
      };

      // Validate data before sending to server
      const validation = id
        ? validateUpdateDocument(documentData)
        : validateCreateDocument(documentData);

      if (!validation.success) {
        const errorMessage = validation.errors
          .map(err => err.message)
          .join(', ');
        throw new Error(errorMessage);
      }

      let savedDocument;
      if (id) {
        // Update existing document
        savedDocument = await documentService.updateDocument(id, validation.data);
        setSuccess('Document updated successfully!');
      } else {
        // Create new document
        savedDocument = await documentService.createDocument(validation.data);
        setSuccess('Document created successfully!');

        // Navigate to edit mode for the new document
        navigate(`/documents/${savedDocument.id}`, { replace: true });
      }

    } catch (err) {
      setError(err.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Get category names for preview
  const getCategoryNames = () => {
    return categoryIds.map(categoryId => {
      const category = getCategoryById(categoryId);
      return category ? category.name : 'Unknown';
    }).filter(Boolean);
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading document...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {id ? 'Edit Document' : 'Create Document'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={previewMode ? "contained" : "outlined"}
            startIcon={<PreviewIcon />}
            onClick={handlePreview}
            disabled={loading}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || Object.keys(validationErrors).length > 0 || !title.trim()}
          >
            {loading ? 'Saving...' : (id ? 'Update' : 'Create')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {previewMode ? (
            <DocumentPreview
              title={title}
              content={content}
              categories={getCategoryNames()}
              tags={tags}
            />
          ) : (
            <Paper sx={{ p: 3, pb: 1 }}>
              <TextField
                fullWidth
                label="Document Title"
                variant="outlined"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  validateFieldRealTime('title', e.target.value);
                }}
                sx={{ mb: 3 }}
                disabled={loading}
                error={!!validationErrors.title}
                helperText={validationErrors.title || ''}
              />

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Content
              </Typography>
              <MarkdownEditor
                configName="documentEditor"
                value={content}
                onChange={(newContent) => {
                  setContent(newContent);
                  validateFieldRealTime('content', newContent);
                }}
                height={600}
                placeholder="Start writing your document in Markdown..."
              />
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CategoryIcon sx={{ mr: 1 }} />
              Document Settings
            </Typography>

            <Box sx={{ mb: 3 }}>
              <CategorySelector
                value={categoryIds}
                onChange={(e) => {
                  setCategoryIds(e.target.value);
                  validateFieldRealTime('categories', e.target.value);
                }}
                label="Categories"
                multiple
                required
                disabled={loading}
              />
              {validationErrors.categories && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {validationErrors.categories}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Tags
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                disabled={loading}
                error={!!validationErrors.tags}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
              >
                Add
              </Button>
            </Box>

            {validationErrors.tags && (
              <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                {validationErrors.tags}
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  disabled={loading}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DocumentEditor;
