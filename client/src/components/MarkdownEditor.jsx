import MdEditor from 'react-markdown-editor-lite';
// Import editor's style
import 'react-markdown-editor-lite/lib/index.css';
import { createEditorConfig, createMarkdownParser } from '../config/markdown';

/**
 * Enhanced Markdown Editor component
 * @param {Object} props - Component props
 * @param {string} props.value - Markdown content
 * @param {Function} props.onChange - Function called when content changes
 * @param {number} props.height - Editor height in pixels
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.readOnly - Whether editor is read-only
 * @param {Object} props.style - Custom styles
 * @param {string} props.configName - Name of the configuration preset to use
 * @param {Array} props.plugins - Custom plugins array (overrides preset)
 * @param {boolean} props.allowSplitView - Whether to allow split view toggle
 * @param {boolean} props.allowFullScreen - Whether to allow fullscreen mode
 * @param {Object} props.configOverrides - Configuration overrides
 */
const MarkdownEditor = ({
  value = '',
  onChange,
  height,
  placeholder,
  readOnly = false,
  style = {},
  configName = 'documentEditor',
  plugins,
  allowSplitView,
  allowFullScreen,
  configOverrides = {}
}) => {
  // Create configuration from config file
  const config = createEditorConfig(configName, {
    height,
    placeholder,
    allowSplitView,
    allowFullScreen,
    plugins,
    ...configOverrides
  });

  // Create markdown parser
  const mdParser = createMarkdownParser();

  /**
   * Handle editor content change
   * @param {Object} param0 - Editor change event
   * @param {string} param0.text - Raw markdown text
   * @param {string} param0.html - Rendered HTML
   */
  const handleEditorChange = ({ text }) => {
    if (onChange) {
      onChange(text);
    }
  };

  /**
   * Handle image upload
   * @param {File} file - Uploaded file
   * @returns {Promise<string>} Promise that resolves to image URL
   */
  const handleImageUpload = async (file) => {
    // TODO: Implement proper image upload to your storage service
    // For now, create a local URL (this won't persist)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result || '');
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Custom renderer configuration
   */
  const renderHTML = (text) => {
    // You can add custom rendering logic here
    return mdParser.render(text);
  };

  // Configure plugins based on config and props
  let finalPlugins = [...config.plugins];

  // Always remove split view and fullscreen plugins for single-pane mode
  finalPlugins = finalPlugins.filter(p => p !== 'mode-toggle' && p !== 'full-screen');

  // Only add fullscreen if explicitly enabled
  if (allowFullScreen !== undefined ? allowFullScreen : config.allowFullScreen) {
    if (!finalPlugins.includes('full-screen')) {
      finalPlugins.push('full-screen');
    }
  }

  // Update view config based on split view setting
  const finalViewConfig = { ...config.viewConfig };
  const splitViewEnabled = allowSplitView !== undefined ? allowSplitView : config.allowSplitView;
  const fullScreenEnabled = allowFullScreen !== undefined ? allowFullScreen : config.allowFullScreen;

  // Force single-pane view by setting HTML preview off
  finalViewConfig.view = {
    menu: true,
    md: true,
    html: false  // Always disable HTML preview to prevent split screen
  };

  finalViewConfig.canView = {
    menu: true,
    md: true,
    html: false,  // Never allow HTML preview toggle
    fullScreen: fullScreenEnabled,
    hideMenu: false
  };

  return (
    <div style={style}>
      <MdEditor
        value={value}
        style={{
          height: `${height !== undefined ? height : config.height}px`,
          ...style
        }}
        renderHTML={renderHTML}
        onChange={handleEditorChange}
        onImageUpload={handleImageUpload}
        plugins={finalPlugins}
        config={finalViewConfig}
        placeholder={placeholder !== undefined ? placeholder : config.placeholder}
        readOnly={readOnly}
      />
    </div>
  );
};

export default MarkdownEditor;
