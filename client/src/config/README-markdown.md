# Markdown Editor Configuration System

This documentation explains how to use and customize the markdown editor configuration system in the wiki-ai application.

## Overview

The markdown editor configuration system provides a flexible way to customize the behavior, appearance, and features of markdown editors throughout the application. Instead of hardcoding options, all configuration is centralized in config files.

## Configuration Files

### 1. `/client/src/config/markdown.js`
The main configuration file containing all available options, presets, and helper functions.

### 2. `/client/src/config/markdownConfigs.js`
Example custom configurations for different use cases.

## Quick Start

### Basic Usage

```jsx
import MarkdownEditor from '../components/MarkdownEditor';

// Use default document editor configuration
<MarkdownEditor 
  value={content} 
  onChange={setContent} 
  configName="documentEditor"
/>
```

### Custom Configuration

```jsx
// Use a custom configuration with overrides
<MarkdownEditor 
  value={content} 
  onChange={setContent} 
  configName="documentEditor"
  height={800}
  allowSplitView={true}
  configOverrides={{
    plugins: ['header', 'font-bold', 'font-italic', 'link']
  }}
/>
```

## Available Configuration Presets

### Application Configs (`APP_CONFIGS`)

- **`documentEditor`** - Main document editing (default)
- **`commentEditor`** - Simple comment editing
- **`noteEditor`** - Note taking with split view

### Plugin Presets (`PLUGIN_PRESETS`)

- **`minimal`** - Basic text formatting
- **`standard`** - Most commonly used features  
- **`full`** - All features except split view/fullscreen
- **`advanced`** - All features including split view/fullscreen

### View Configurations (`VIEW_CONFIG`)

- **`default`** - Standard single-pane view
- **`splitView`** - Side-by-side edit/preview
- **`fullscreen`** - Fullscreen mode enabled
- **`advanced`** - Both split view and fullscreen

## Customization Examples

### 1. Blog Post Editor
```jsx
import { BLOG_POST_CONFIG } from '../config/markdownConfigs';

<MarkdownEditor 
  value={content} 
  onChange={setContent} 
  configName="documentEditor"
  configOverrides={BLOG_POST_CONFIG}
/>
```

### 2. Comment Editor
```jsx
<MarkdownEditor 
  value={comment} 
  onChange={setComment} 
  configName="commentEditor"
  height={150}
/>
```

### 3. Mobile-Optimized Editor
```jsx
<MarkdownEditor 
  value={content} 
  onChange={setContent} 
  configName="documentEditor"
  allowSplitView={false}
  allowFullScreen={true}
  height={300}
/>
```

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `header` | Headers (H1-H6) |
| `font-bold` | Bold text |
| `font-italic` | Italic text |
| `font-underline` | Underlined text |
| `font-strikethrough` | Strikethrough text |
| `list-unordered` | Bullet lists |
| `list-ordered` | Numbered lists |
| `block-quote` | Block quotes |
| `block-wrap` | Block wrapper |
| `block-code-inline` | Inline code |
| `block-code-block` | Code blocks |
| `table` | Tables |
| `image` | Images |
| `link` | Links |
| `clear` | Clear formatting |
| `logger` | History/Undo-Redo |
| `divider` | Toolbar divider |
| `mode-toggle` | Toggle edit/preview mode |
| `full-screen` | Fullscreen mode |

## Creating Custom Configurations

### Method 1: Using `createEditorConfig()`
```jsx
import { createEditorConfig } from '../config/markdown';

const myConfig = createEditorConfig('documentEditor', {
  height: 500,
  placeholder: 'Custom placeholder...',
  allowSplitView: true,
  plugins: ['header', 'font-bold', 'font-italic', 'link']
});
```

### Method 2: Direct Configuration Object
```jsx
const customConfig = {
  preset: 'standard',
  viewConfig: 'splitView',
  height: 600,
  placeholder: 'Write your content...',
  allowSplitView: true,
  allowFullScreen: false
};

<MarkdownEditor 
  configOverrides={customConfig}
  // ... other props
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | `''` | Markdown content |
| `onChange` | function | - | Content change handler |
| `configName` | string | `'documentEditor'` | Configuration preset name |
| `height` | number | from config | Editor height in pixels |
| `placeholder` | string | from config | Placeholder text |
| `readOnly` | boolean | `false` | Read-only mode |
| `style` | object | `{}` | Custom CSS styles |
| `plugins` | array | from config | Custom plugins array |
| `allowSplitView` | boolean | from config | Enable split view |
| `allowFullScreen` | boolean | from config | Enable fullscreen |
| `configOverrides` | object | `{}` | Configuration overrides |

## Advanced Customization

### Custom Plugin Set
```jsx
const customPlugins = [
  'header',
  'font-bold', 
  'font-italic',
  'divider',
  'list-unordered',
  'block-code-inline',
  'link',
  'clear'
];

<MarkdownEditor 
  plugins={customPlugins}
  // ... other props
/>
```

### Custom Markdown Parser
```jsx
import { createMarkdownParser } from '../config/markdown';

const customParser = createMarkdownParser({
  html: false,        // Disable HTML
  linkify: true,     // Auto-link URLs
  typographer: false, // Disable typography
  breaks: true       // Convert \n to <br>
});
```

### Environment-Specific Configs
```jsx
// config/environments/development.js
export const DEV_EDITOR_CONFIG = {
  // Development-specific settings
  allowFullScreen: true,
  allowSplitView: true,
  plugins: PLUGIN_PRESETS.advanced
};

// config/environments/production.js  
export const PROD_EDITOR_CONFIG = {
  // Production-specific settings
  allowFullScreen: false,
  allowSplitView: false,
  plugins: PLUGIN_PRESETS.standard
};
```

## Best Practices

1. **Use Configuration Names**: Prefer `configName` over custom props when possible
2. **Environment Configs**: Create different configs for development/production
3. **Component-Specific Configs**: Create dedicated configs for different components
4. **Performance**: Use `minimal` preset for simple use cases
5. **Mobile**: Disable split view on mobile devices
6. **Accessibility**: Always provide meaningful placeholders

## Migration Guide

If you're migrating from the old hardcoded system:

### Before
```jsx
<MarkdownEditor 
  plugins={['header', 'font-bold', 'link']}
  allowSplitView={false}
  height={500}
/>
```

### After
```jsx
<MarkdownEditor 
  configName="documentEditor"
  configOverrides={{
    plugins: ['header', 'font-bold', 'link'],
    allowSplitView: false,
    height: 500
  }}
/>
```

## Troubleshooting

### Common Issues

1. **Plugin Not Showing**: Check if plugin name is correct and included in the config
2. **Split View Not Working**: Ensure `allowSplitView` is true and `mode-toggle` plugin is included
3. **Configuration Not Applied**: Verify the configuration name exists in `APP_CONFIGS`

### Debug Configuration
```jsx
import { createEditorConfig } from '../config/markdown';

const config = createEditorConfig('documentEditor');
console.log('Current config:', config);
```

This configuration system provides maximum flexibility while maintaining consistency across the application. You can easily customize any aspect of the markdown editor behavior through configuration files.
