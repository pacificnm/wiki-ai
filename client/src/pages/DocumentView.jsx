import {
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  Comment as CommentIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  PictureAsPdf as PdfIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Tag as TagIcon,
  Visibility as ViewIcon,
  TextSnippet as WordIcon
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  Grow,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Switch,
  Tab,
  Tabs,
  Typography,
  useTheme
} from '@mui/material';
import 'highlight.js/styles/github.css'; // Import highlight.js styles
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../contexts/AuthContext';
import { useError } from '../hooks/useError';
import documentService from '../services/documentService';
import exportService from '../services/exportService';
import { logger } from '../utils/logger';

function DocumentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { handleError } = useError();

  // Document state
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [sidebarTab, setSidebarTab] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportAnchorRef = useRef(null);

  // Fetch document data
  useEffect(() => {
    if (id) {
      fetchDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Fetch document details
   */
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await documentService.getDocumentById(id);
      setDocument(response);

      logger.info('Document loaded successfully', {
        documentId: id,
        title: response?.title
      });

    } catch (err) {
      logger.error('Failed to fetch document', {
        error: err.message,
        documentId: id
      });
      setError('Failed to load document. Please try again.');
      handleError(err, 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle edit button click
   */
  const handleEdit = () => {
    navigate(`/documents/${id}/edit`);
  };

  /**
   * Handle comment submission
   */
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);

      // Create the comment using the API
      await documentService.createComment(id, {
        text: commentText.trim()
      });

      logger.info('Comment submitted successfully', {
        documentId: id,
        textLength: commentText.trim().length
      });

      setCommentText('');
      // Refresh document to get updated comments
      await fetchDocument();

    } catch (err) {
      logger.error('Failed to submit comment', {
        error: err.message,
        documentId: id
      });
      handleError(err, 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  /**
   * Handle version restore
   */
  const handleRestoreVersion = async (versionId) => {
    try {
      // TODO: Implement version restore
      logger.info('Restoring version', { documentId: id, versionId });
      await fetchDocument();
    } catch (err) {
      logger.error('Failed to restore version', {
        error: err.message,
        documentId: id,
        versionId
      });
      handleError(err, 'Failed to restore version');
    }
  };

  /**
   * Handle document publish toggle
   */
  const handlePublishToggle = async () => {
    const newPublishedState = !document.isPublished;
    const action = newPublishedState ? 'publish' : 'unpublish';

    try {
      setLoading(true);

      const response = await documentService.updateDocument(id, {
        isPublished: newPublishedState
      });

      // Update the document state
      setDocument(prevDoc => ({
        ...prevDoc,
        isPublished: newPublishedState,
        publishedAt: response.publishedAt
      }));

      logger.info(`Document ${action}ed successfully`, {
        documentId: id,
        title: document.title
      });

    } catch (err) {
      logger.error(`Error ${action}ing document`, {
        documentId: id,
        error: err.message
      });
      handleError(err, `Failed to ${action} document`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle export dropdown toggle
   */
  const handleExportToggle = () => {
    setExportDropdownOpen((prevOpen) => !prevOpen);
  };

  /**
   * Handle export dropdown close
   */
  const handleExportClose = (event) => {
    if (exportAnchorRef.current && exportAnchorRef.current.contains(event.target)) {
      return;
    }
    setExportDropdownOpen(false);
  };

  /**
   * Handle PDF export
   */
  const handleExportPDF = async () => {
    setExportDropdownOpen(false);

    try {
      setExporting(true);
      await exportService.exportAndDownloadPDF(id, document.title);

      logger.info('PDF export successful', {
        documentId: id,
        title: document.title
      });
    } catch (err) {
      logger.error('PDF export failed', {
        error: err.message,
        documentId: id
      });
      handleError(err, 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Handle Word export
   */
  const handleExportWord = async () => {
    setExportDropdownOpen(false);

    try {
      setExporting(true);
      await exportService.exportAndDownloadWord(id, document.title);

      logger.info('Word export successful', {
        documentId: id,
        title: document.title
      });
    } catch (err) {
      logger.error('Word export failed', {
        error: err.message,
        documentId: id
      });
      handleError(err, 'Failed to export Word document');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading document..." />;
  }

  if (error || !document) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || 'Document not found'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/documents')}>
          Back to Documents
        </Button>
      </Box>
    );
  }

  const canEdit = user && (user.uid === document.authorId || user.role === 'admin');

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/documents')}
        sx={{ mb: 2 }}
      >
        Back to Documents
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {document.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {document.author || 'Unknown Author'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Updated {formatTimeAgo(document.updatedAt)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ViewIcon color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                {document.viewCount || 0} views
              </Typography>
            </Box>
          </Box>
          {document.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {document.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Export Button Group */}
          <ButtonGroup
            variant="outlined"
            ref={exportAnchorRef}
            aria-label="export document options"
          >
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExportToggle}
              disabled={exporting}
              aria-controls={exportDropdownOpen ? 'export-menu' : undefined}
              aria-expanded={exportDropdownOpen ? 'true' : undefined}
              aria-haspopup="menu"
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </ButtonGroup>

          {/* Export Dropdown */}
          <Popper
            sx={{ zIndex: 1 }}
            open={exportDropdownOpen}
            anchorEl={exportAnchorRef.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleExportClose}>
                    <MenuList id="export-menu" autoFocusItem>
                      <MenuItem onClick={handleExportPDF}>
                        <PdfIcon sx={{ mr: 1 }} />
                        Export as PDF
                      </MenuItem>
                      <MenuItem onClick={handleExportWord}>
                        <WordIcon sx={{ mr: 1 }} />
                        Export as Word
                      </MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>

          {/* Edit Button */}
          {canEdit && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Document
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Document Content */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => (
                  <Typography variant="h4" component="h1" gutterBottom>
                    {children}
                  </Typography>
                ),
                h2: ({ children }) => (
                  <Typography variant="h5" component="h2" gutterBottom>
                    {children}
                  </Typography>
                ),
                h3: ({ children }) => (
                  <Typography variant="h6" component="h3" gutterBottom>
                    {children}
                  </Typography>
                ),
                p: ({ children }) => (
                  <Typography variant="body1" paragraph>
                    {children}
                  </Typography>
                ),
                blockquote: ({ children }) => (
                  <Paper sx={{
                    p: 2,
                    ml: 2,
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    backgroundColor: theme.palette.action.hover
                  }}>
                    {children}
                  </Paper>
                ),
                code: ({ inline, children }) => (
                  inline ? (
                    <Box
                      component="code"
                      sx={{
                        backgroundColor: theme.palette.action.hover,
                        padding: '2px 4px',
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {children}
                    </Box>
                  ) : (
                    <Box
                      component="pre"
                      sx={{
                        backgroundColor: theme.palette.action.hover,
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      <code>{children}</code>
                    </Box>
                  )
                )
              }}
            >
              {document.content || 'No content available for this document.'}
            </ReactMarkdown>
          </Paper>

          {/* Comments Section */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CommentIcon sx={{ mr: 1 }} />
              Comments ({document.comments?.length || 0})
            </Typography>

            {/* Comment Form */}
            {user && (
              <Box sx={{ mb: 3 }}>
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '4px',
                    fontFamily: theme.typography.fontFamily,
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !commentText.trim()}
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Comments List */}
            {document.comments?.length > 0 ? (
              <List>
                {document.comments.map((comment, index) => (
                  <React.Fragment key={comment._id || comment.id || index}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>
                          {comment.userId?.displayName?.charAt(0) ||
                            comment.userId?.email?.charAt(0) ||
                            comment.author?.charAt(0) ||
                            '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle2">
                              {comment.userId?.displayName || comment.userId?.email || comment.author || 'Anonymous'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(comment.createdAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" component="div">
                            {comment.text}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < document.comments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No comments yet. Be the first to comment!
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={sidebarTab}
              onChange={(e, newValue) => setSidebarTab(newValue)}
              variant="fullWidth"
            >
              <Tab label="Details" />
              <Tab label="History" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {sidebarTab === 0 && (
                <>
                  {/* Categories */}
                  {document.categories?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon sx={{ mr: 1, fontSize: 18 }} />
                        Categories
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {document.categories.map((category) => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            size="small"
                            sx={{
                              backgroundColor: category.color,
                              color: 'white'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Tags */}
                  {document.tags?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <TagIcon sx={{ mr: 1, fontSize: 18 }} />
                        Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {document.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Auto Tags */}
                  {document.autoTags?.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        AI Generated Tags
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {document.autoTags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Document Stats */}
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Document Statistics
                    </Typography>
                    <List dense>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary="Created"
                          secondary={new Date(document.createdAt).toLocaleDateString()}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary="Last Updated"
                          secondary={new Date(document.updatedAt).toLocaleDateString()}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary="Views"
                          secondary={document.viewCount || 0}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary="Comments"
                          secondary={document.comments?.length || 0}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={document.isPublished ? 'Published' : 'Draft'}
                                size="small"
                                color={document.isPublished ? 'success' : 'warning'}
                              />
                              {canEdit && (
                                <Switch
                                  checked={document.isPublished}
                                  onChange={handlePublishToggle}
                                  size="small"
                                  disabled={loading}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>
                </>
              )}

              {sidebarTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 1, fontSize: 18 }} />
                    Version History
                  </Typography>

                  {document.versionHistory?.length > 0 ? (
                    <List dense>
                      {document.versionHistory.map((version, index) => (
                        <ListItem key={version.id || index} sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                                    {version.reason || `Version ${document.versionHistory.length - index}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Version {document.versionHistory.length - index} • {formatTimeAgo(version.createdAt)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    by {version.createdBy?.displayName || version.createdBy?.email || 'Unknown'}
                                  </Typography>
                                  {(version.wordCount !== undefined || version.charCount !== undefined) && (
                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                      {version.wordCount !== undefined && (
                                        <Typography variant="caption" color="text.secondary">
                                          {version.wordCount} words
                                        </Typography>
                                      )}
                                      {version.charCount !== undefined && (
                                        <Typography variant="caption" color="text.secondary">
                                          {version.charCount} characters
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </Box>
                                {index > 0 && canEdit && (
                                  <Button
                                    size="small"
                                    onClick={() => handleRestoreVersion(version.id)}
                                    sx={{ ml: 1, flexShrink: 0 }}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No version history available.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DocumentView;
