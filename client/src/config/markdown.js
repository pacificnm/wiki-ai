/**
 * Markdown Editor Configuration
 * 
 * This configuration file contains all the available options for the markdown editor,
 * making it easy to customize the editor behavior across the application.
 * 
 * Split Screen Configuration:
 * - The default view config has split screen disabled (html: false, canView.html: false)
 * - The documentEditor config explicitly disables split view and fullscreen
 * - This ensures a single-pane markdown editing experience
 */

import MarkdownIt from 'markdown-it';

/**
 * MarkdownIt Parser Configuration
 * Configure the markdown parsing behavior
 */
export const MARKDOWN_PARSER_CONFIG = {
  html: true,        // Enable HTML tags in source
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
  breaks: true       // Convert '\n' in paragraphs into <br>
};

/**
 * Available Editor Plugins
 * Each plugin adds specific functionality to the editor toolbar
 */
export const AVAILABLE_PLUGINS = {
  // Text formatting
  'header': 'Headers (H1-H6)',
  'font-bold': 'Bold text',
  'font-italic': 'Italic text',
  'font-underline': 'Underlined text',
  'font-strikethrough': 'Strikethrough text',

  // Lists and structure
  'list-unordered': 'Bullet lists',
  'list-ordered': 'Numbered lists',
  'block-quote': 'Block quotes',
  'block-wrap': 'Block wrapper',

  // Code
  'block-code-inline': 'Inline code',
  'block-code-block': 'Code blocks',

  // Content
  'table': 'Tables',
  'image': 'Images',
  'link': 'Links',

  // Utilities
  'clear': 'Clear formatting',
  'logger': 'History/Undo-Redo',
  'divider': 'Toolbar divider',

  // View modes (controlled separately)
  'mode-toggle': 'Toggle between edit/preview mode',
  'full-screen': 'Fullscreen mode'
};

/**
 * Default Plugin Sets
 * Pre-configured plugin combinations for different use cases
 */
export const PLUGIN_PRESETS = {
  // Minimal - basic text formatting
  minimal: [
    'font-bold',
    'font-italic',
    'list-unordered',
    'list-ordered',
    'link',
    'clear'
  ],

  // Standard - most commonly used features
  standard: [
    'header',
    'font-bold',
    'font-italic',
    'font-underline',
    'font-strikethrough',
    'divider',
    'list-unordered',
    'list-ordered',
    'block-quote',
    'divider',
    'block-code-inline',
    'block-code-block',
    'divider',
    'link',
    'image',
    'table',
    'divider',
    'clear',
    'logger'
  ],

  // Full - all features except split view and fullscreen
  full: [
    'header',
    'font-bold',
    'font-italic',
    'font-underline',
    'font-strikethrough',
    'divider',
    'list-unordered',
    'list-ordered',
    'block-quote',
    'block-wrap',
    'divider',
    'block-code-inline',
    'block-code-block',
    'divider',
    'table',
    'image',
    'link',
    'divider',
    'clear',
    'logger'
  ],

  // Advanced - includes split view and fullscreen
  advanced: [
    'header',
    'font-bold',
    'font-italic',
    'font-underline',
    'font-strikethrough',
    'divider',
    'list-unordered',
    'list-ordered',
    'block-quote',
    'block-wrap',
    'divider',
    'block-code-inline',
    'block-code-block',
    'divider',
    'table',
    'image',
    'link',
    'divider',
    'clear',
    'logger',
    'divider',
    'mode-toggle',
    'full-screen'
  ]
};

/**
 * Editor View Configuration
 * Controls what parts of the editor are visible and interactive
 */
export const VIEW_CONFIG = {
  // Default view settings - Single pane mode only
  default: {
    view: {
      menu: true,      // Show toolbar
      md: true,        // Show markdown editor
      html: false      // Hide HTML preview (no split screen)
    },
    canView: {
      menu: true,      // Allow toolbar toggle
      md: true,        // Allow markdown editor toggle
      html: false,     // Disable HTML preview toggle (no split screen)
      fullScreen: false, // Disable fullscreen
      hideMenu: false  // Don't hide menu
    }
  },

  // Split view enabled
  splitView: {
    view: {
      menu: true,
      md: true,
      html: true       // Show HTML preview
    },
    canView: {
      menu: true,
      md: true,
      html: true,      // Allow HTML preview toggle
      fullScreen: false,
      hideMenu: false
    }
  },

  // Fullscreen enabled
  fullscreen: {
    view: {
      menu: true,
      md: true,
      html: false
    },
    canView: {
      menu: true,
      md: true,
      html: false,
      fullScreen: true, // Enable fullscreen
      hideMenu: false
    }
  },

  // Both split view and fullscreen
  advanced: {
    view: {
      menu: true,
      md: true,
      html: true
    },
    canView: {
      menu: true,
      md: true,
      html: true,
      fullScreen: true,
      hideMenu: false
    }
  }
};

/**
 * Editor Behavior Configuration
 */
export const EDITOR_CONFIG = {
  // Image upload settings
  image: {
    accept: '.jpg,.jpeg,.png,.gif,.svg,.webp,.bmp,.tiff',
    maxSize: 5 * 1024 * 1024, // 5MB
    url: '',
    uploadPath: '/uploads/images/'
  },

  // Link settings
  link: {
    defaultUrl: '',
    target: '_blank' // Open links in new tab
  },

  // Logger/History settings
  logger: {
    maxSize: 100,     // Maximum number of history entries
    interval: 3000    // Save interval in milliseconds
  },

  // Scroll synchronization
  sync: {
    scrollMode: ['leftFollowRight', 'rightFollowLeft']
  },

  // CSS classes
  classes: {
    html: 'markdown-editor-html',
    markdown: 'markdown-editor-md'
  },

  // Default dimensions
  dimensions: {
    height: 500,      // Default height in pixels
    minHeight: 200,   // Minimum height
    maxHeight: 1000   // Maximum height
  },

  // Placeholders
  placeholders: {
    default: 'Start writing your document in Markdown...',
    note: 'Write your notes here...',
    comment: 'Add your comment...',
    description: 'Enter description...'
  }
};

/**
 * Application-Specific Configurations
 * Pre-configured settings for different parts of the application
 */
export const APP_CONFIGS = {
  // Document editor configuration - Single pane only
  documentEditor: {
    preset: 'standard',
    viewConfig: 'default',
    height: 600,
    placeholder: EDITOR_CONFIG.placeholders.default,
    allowSplitView: false,      // Explicitly disable split view
    allowFullScreen: false,     // Disable fullscreen mode
    enablePreview: false        // Disable preview toggle
  },

  // Comment editor configuration
  commentEditor: {
    preset: 'minimal',
    viewConfig: 'default',
    height: 150,
    placeholder: EDITOR_CONFIG.placeholders.comment,
    allowSplitView: false,
    allowFullScreen: false
  },

  // Note editor configuration
  noteEditor: {
    preset: 'standard',
    viewConfig: 'splitView',
    height: 400,
    placeholder: EDITOR_CONFIG.placeholders.note,
    allowSplitView: true,
    allowFullScreen: true
  }
};

/**
 * Create a configured MarkdownIt parser instance
 * @param {Object} config - Parser configuration options
 * @returns {MarkdownIt} Configured parser instance
 */
export const createMarkdownParser = (config = MARKDOWN_PARSER_CONFIG) => {
  return new MarkdownIt(config);
};

/**
 * Get editor configuration by name or return default
 * @param {string} configName - Name of the configuration
 * @returns {Object} Editor configuration object
 */
export const getEditorConfig = (configName = 'documentEditor') => {
  return APP_CONFIGS[configName] || APP_CONFIGS.documentEditor;
};

/**
 * Get plugins array by preset name
 * @param {string} presetName - Name of the plugin preset
 * @returns {Array} Array of plugin names
 */
export const getPluginPreset = (presetName = 'standard') => {
  return PLUGIN_PRESETS[presetName] || PLUGIN_PRESETS.standard;
};

/**
 * Get view configuration by name
 * @param {string} viewName - Name of the view configuration
 * @returns {Object} View configuration object
 */
export const getViewConfig = (viewName = 'default') => {
  return VIEW_CONFIG[viewName] || VIEW_CONFIG.default;
};

/**
 * Create a complete editor configuration object
 * @param {string} appConfig - Application configuration name
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Complete editor configuration
 */
export const createEditorConfig = (appConfig = 'documentEditor', overrides = {}) => {
  const baseConfig = getEditorConfig(appConfig);
  const viewConfig = getViewConfig(baseConfig.viewConfig);
  const plugins = getPluginPreset(baseConfig.preset);

  return {
    ...baseConfig,
    ...overrides,
    plugins: overrides.plugins || plugins,
    viewConfig: overrides.viewConfig ? getViewConfig(overrides.viewConfig) : viewConfig,
    editorConfig: {
      ...viewConfig,
      ...EDITOR_CONFIG.classes,
      ...EDITOR_CONFIG.image,
      ...EDITOR_CONFIG.link,
      ...EDITOR_CONFIG.logger,
      syncScrollMode: EDITOR_CONFIG.sync.scrollMode,
      ...(overrides.editorConfig || {})
    }
  };
};

const markdownConfig = {
  MARKDOWN_PARSER_CONFIG,
  AVAILABLE_PLUGINS,
  PLUGIN_PRESETS,
  VIEW_CONFIG,
  EDITOR_CONFIG,
  APP_CONFIGS,
  createMarkdownParser,
  getEditorConfig,
  getPluginPreset,
  getViewConfig,
  createEditorConfig
};

export default markdownConfig;
