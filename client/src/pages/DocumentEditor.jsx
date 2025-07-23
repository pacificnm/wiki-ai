import {
  AutoFixHigh as AIIcon,
  Category as CategoryIcon,
  Preview as PreviewIcon,
  Save as SaveIcon,
  Send as SendIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography
} from '@mui/material';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import DocumentPreview from '../components/DocumentPreview';
import MarkdownEditor from '../components/MarkdownEditor';
import { useCategories } from '../hooks/useCategories';
import aiService from '../services/aiService';
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

  // AI state
  const [aiAgent, setAiAgent] = React.useState('gpt-4');
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploadInstructions, setUploadInstructions] = React.useState('');
  const [uploadLoading, setUploadLoading] = React.useState(false);

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

  const loadDocument = useCallback(async () => {
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
  }, [id]);

  // Load document if editing
  React.useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id, loadDocument]);

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

  // AI Handlers
  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter instructions for the AI to generate content.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError('');

      const result = await aiService.generateDocument(aiPrompt.trim(), aiAgent);

      // Populate the editor with AI-generated content
      if (result.title) {
        setTitle(result.title);
        validateFieldRealTime('title', result.title);
      }

      if (result.content) {
        setContent(result.content);
        validateFieldRealTime('content', result.content);
      }

      // If AI provides suggested categories or tags, populate them
      if (result.tags && Array.isArray(result.tags)) {
        setTags(result.tags);
        validateFieldRealTime('tags', result.tags);
      }

      setSuccess('Document generated successfully with AI!');
      setAiPrompt(''); // Clear the prompt after successful generation

    } catch (err) {
      setAiError(err.message || 'Failed to generate document with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleImproveWithAI = async () => {
    if (!content.trim()) {
      setAiError('Please add some content to the document before asking AI to improve it.');
      return;
    }

    if (!aiPrompt.trim()) {
      setAiError('Please enter instructions for how you want AI to improve the document.');
      return;
    }

    try {
      setAiLoading(true);
      setAiError('');

      const result = await aiService.improveDocument(content, aiPrompt.trim(), aiAgent, {
        title: title.trim()
      });

      // Update the editor with improved content
      if (result.title) {
        setTitle(result.title);
        validateFieldRealTime('title', result.title);
      }

      if (result.content) {
        setContent(result.content);
        validateFieldRealTime('content', result.content);
      }

      // If AI suggests improved tags, update them
      if (result.tags && Array.isArray(result.tags)) {
        setTags(result.tags);
        validateFieldRealTime('tags', result.tags);
      }

      setSuccess('Document improved successfully with AI!');
      setAiPrompt(''); // Clear the prompt after successful improvement

    } catch (err) {
      setAiError(err.message || 'Failed to improve document with AI');
    } finally {
      setAiLoading(false);
    }
  };

  // File upload handlers
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const supportedTypes = aiService.getSupportedFileTypes();
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!supportedTypes.extensions.includes(fileExtension)) {
        setAiError(`File type ${fileExtension} is not supported. ${supportedTypes.description}`);
        return;
      }

      if (file.size > supportedTypes.maxSizeMB * 1024 * 1024) {
        setAiError(`File size exceeds maximum allowed size of ${supportedTypes.maxSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
      setAiError('');
    }
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) {
      setAiError('Please select a file to upload');
      return {
        extensions: ['.txt', '.md', '.json', '.csv', '.html', '.xml', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.css', '.scss', '.sql', '.yaml', '.yml', '.xlsx', '.xls'],
        maxSizeMB: 5,
        description: 'Supported formats: Text, Markdown, JSON, CSV, HTML, XML, JavaScript, TypeScript, Python, Java, C/C++, CSS, SQL, YAML, Excel (.xlsx, .xls)'
      };
      return;
    }

    try {
      setUploadLoading(true);
      setAiError('');

      const result = await aiService.processUploadedDocument(
        selectedFile,
        uploadInstructions.trim(),
        aiAgent
      );

      // Populate the editor with processed content
      if (result.title) {
        setTitle(result.title);
        validateFieldRealTime('title', result.title);
      }

      if (result.content) {
        setContent(result.content);
        validateFieldRealTime('content', result.content);
      }

      // If AI provides suggested tags, populate them
      if (result.tags && Array.isArray(result.tags)) {
        setTags(result.tags);
        validateFieldRealTime('tags', result.tags);
      }

      setSuccess(`Document "${selectedFile.name}" processed successfully with AI!`);
      setSelectedFile(null);
      setUploadInstructions('');

      // Reset the file input
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setAiError(err.message || 'Failed to process uploaded document with AI');
    } finally {
      setUploadLoading(false);
    }
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

            <Divider sx={{ my: 3 }} />

            {/* AI Assistant Section */}
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AIIcon sx={{ mr: 1 }} />
              AI Assistant
            </Typography>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>AI Model</InputLabel>
                <Select
                  value={aiAgent}
                  label="AI Model"
                  onChange={(e) => setAiAgent(e.target.value)}
                  disabled={aiLoading || loading}
                >
                  {aiService.getAvailableModels().map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {model.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder={
                  id && content
                    ? "Describe how you want AI to improve this document..."
                    : "Describe what kind of document you want AI to create..."
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading || loading}
                sx={{ mb: 2 }}
              />

              {aiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aiError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                {(!id || !content) && (
                  <Button
                    variant="contained"
                    startIcon={aiLoading ? <CircularProgress size={16} /> : <SendIcon />}
                    onClick={handleGenerateWithAI}
                    disabled={aiLoading || loading || !aiPrompt.trim()}
                    fullWidth
                  >
                    {aiLoading ? 'Generating...' : 'Generate Document'}
                  </Button>
                )}

                {id && content && (
                  <Button
                    variant="outlined"
                    startIcon={aiLoading ? <CircularProgress size={16} /> : <AIIcon />}
                    onClick={handleImproveWithAI}
                    disabled={aiLoading || loading || !aiPrompt.trim()}
                    fullWidth
                  >
                    {aiLoading ? 'Improving...' : 'Improve Document'}
                  </Button>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {!id || !content
                  ? "AI will generate a complete document including title, content, and suggested tags."
                  : "AI will improve your existing document based on your instructions."
                }
              </Typography>

              {/* File Upload Section */}
              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <UploadIcon sx={{ mr: 1 }} />
                Process Uploaded Document
              </Typography>

              <Box sx={{ mb: 2 }}>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".txt,.md,.json,.csv,.html,.xml,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.css,.scss,.sql,.yaml,.yml,.xlsx,.xls,.pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <Button
                  component="label"
                  htmlFor="file-upload-input"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 2, mr: 1 }}
                  disabled={uploadLoading || aiLoading || loading}
                >
                  Select Document
                </Button>

                {selectedFile && (
                  <Chip
                    label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)}KB)`}
                    onDelete={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('file-upload-input');
                      if (fileInput) fileInput.value = '';
                    }}
                    sx={{ mb: 2, ml: 1 }}
                  />
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe how you want AI to process the uploaded document (e.g., 'Convert to Markdown documentation', 'Summarize the key points', 'Extract main concepts and create a guide')..."
                  value={uploadInstructions}
                  onChange={(e) => setUploadInstructions(e.target.value)}
                  disabled={uploadLoading || aiLoading || loading}
                  sx={{ mb: 2 }}
                />

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={uploadLoading ? <CircularProgress size={16} /> : <UploadIcon />}
                  onClick={handleProcessUpload}
                  disabled={uploadLoading || aiLoading || loading || !selectedFile || !uploadInstructions.trim()}
                  fullWidth
                >
                  {uploadLoading ? 'Processing Document...' : 'Process with AI'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Upload a document and provide instructions for how AI should process it into Markdown.
                  Supported formats: Text, Markdown, JSON, CSV, HTML, XML, JavaScript, TypeScript, Python, Java, C/C++, CSS, SQL, YAML, Excel (.xlsx, .xls), PDF (Max: 5MB)
                </Typography>
              </Box>
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

      {/* AI Error Snackbar */}
      <Snackbar
        open={!!aiError}
        autoHideDuration={6000}
        onClose={() => setAiError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setAiError('')} severity="error" variant="filled">
          {aiError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DocumentEditor;
