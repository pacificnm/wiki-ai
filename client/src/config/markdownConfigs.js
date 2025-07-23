/**
 * Custom Markdown Editor Configurations
 * 
 * This file demonstrates how to create custom configurations for different
 * use cases in your application. You can import and use these configurations
 * to customize the markdown editor behavior.
 */

import { createEditorConfig, PLUGIN_PRESETS } from './markdown';

/**
 * Blog Post Editor Configuration
 * Full-featured editor for writing blog posts
 */
export const BLOG_POST_CONFIG = createEditorConfig('documentEditor', {
  height: 800,
  placeholder: 'Write your blog post here...',
  allowSplitView: true,
  allowFullScreen: true,
  plugins: [
    ...PLUGIN_PRESETS.full,
    'mode-toggle',
    'full-screen'
  ]
});

/**
 * Quick Note Configuration
 * Minimal editor for quick notes
 */
export const QUICK_NOTE_CONFIG = createEditorConfig('noteEditor', {
  height: 200,
  placeholder: 'Quick note...',
  allowSplitView: false,
  allowFullScreen: false,
  plugins: PLUGIN_PRESETS.minimal
});

/**
 * Comment Editor Configuration
 * Simple editor for comments
 */
export const COMMENT_CONFIG = createEditorConfig('commentEditor', {
  height: 120,
  placeholder: 'Add your comment...',
  allowSplitView: false,
  allowFullScreen: false,
  plugins: [
    'font-bold',
    'font-italic',
    'link',
    'block-code-inline'
  ]
});

/**
 * Documentation Editor Configuration
 * Advanced editor for technical documentation
 */
export const DOCUMENTATION_CONFIG = createEditorConfig('documentEditor', {
  height: 700,
  placeholder: 'Write your documentation here...',
  allowSplitView: true,
  allowFullScreen: true,
  plugins: [
    'header',
    'font-bold',
    'font-italic',
    'font-underline',
    'divider',
    'list-unordered',
    'list-ordered',
    'block-quote',
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
});

/**
 * Mobile-Friendly Configuration
 * Optimized for mobile devices
 */
export const MOBILE_CONFIG = createEditorConfig('documentEditor', {
  height: 300,
  placeholder: 'Write here...',
  allowSplitView: false, // Disable split view on mobile
  allowFullScreen: true, // Allow fullscreen for better mobile experience
  plugins: [
    'header',
    'font-bold',
    'font-italic',
    'divider',
    'list-unordered',
    'list-ordered',
    'divider',
    'link',
    'divider',
    'full-screen'
  ]
});

const markdownConfigs = {
  BLOG_POST_CONFIG,
  QUICK_NOTE_CONFIG,
  COMMENT_CONFIG,
  DOCUMENTATION_CONFIG,
  MOBILE_CONFIG
};

export default markdownConfigs;
