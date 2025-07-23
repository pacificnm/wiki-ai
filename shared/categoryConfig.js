/**
 * Category configuration for icons and colors
 */

export const CATEGORY_ICONS = [
  { value: '📚', label: '📚 Books/Tutorial', description: 'Books, tutorials, learning materials' },
  { value: '📋', label: '📋 Guidelines', description: 'Guidelines, checklists, procedures' },
  { value: '📖', label: '📖 Reference', description: 'Reference materials, documentation' },
  { value: '❓', label: '❓ FAQ/Help', description: 'Frequently asked questions, help' },
  { value: '🔧', label: '🔧 Technical', description: 'Technical documentation, tools' },
  { value: '📝', label: '📝 Notes', description: 'Meeting notes, general notes' },
  { value: '📄', label: '📄 Policies', description: 'Policies, official documents' },
  { value: '⚙️', label: '⚙️ Procedures', description: 'Step-by-step procedures, workflows' },
  { value: '🆘', label: '🆘 Support', description: 'Support, troubleshooting' },
  { value: '🧠', label: '🧠 Knowledge', description: 'Knowledge base, expertise' },
  { value: '📦', label: '📦 Resources', description: 'Resources, assets, tools' },
  { value: '💡', label: '💡 Examples', description: 'Examples, samples, templates' },
  { value: '🏢', label: '🏢 Organization', description: 'Company, organizational info' },
  { value: '👥', label: '👥 Team', description: 'Team-related content' },
  { value: '🎯', label: '🎯 Goals', description: 'Goals, objectives, planning' },
  { value: '📊', label: '📊 Analytics', description: 'Reports, analytics, data' },
  { value: '🔒', label: '🔒 Security', description: 'Security, privacy, compliance' },
  { value: '🌐', label: '🌐 Web', description: 'Web-related, online resources' },
  { value: '💻', label: '💻 Development', description: 'Software development, coding' },
  { value: '🎨', label: '🎨 Design', description: 'Design, creative, UI/UX' },
  { value: '📈', label: '📈 Business', description: 'Business, growth, strategy' },
  { value: '🔄', label: '🔄 Process', description: 'Processes, workflows, automation' },
  { value: '📅', label: '📅 Planning', description: 'Planning, scheduling, calendar' },
  { value: '🏆', label: '🏆 Best Practices', description: 'Best practices, standards' },
  { value: '📁', label: '📁 General', description: 'General folder, miscellaneous' }
];

export const CATEGORY_COLORS = [
  { value: '#1976d2', label: 'Blue', description: 'Professional, trustworthy' },
  { value: '#388e3c', label: 'Green', description: 'Growth, success, nature' },
  { value: '#f57c00', label: 'Orange', description: 'Energy, creativity, enthusiasm' },
  { value: '#7b1fa2', label: 'Purple', description: 'Innovation, wisdom, luxury' },
  { value: '#d32f2f', label: 'Red', description: 'Urgent, important, critical' },
  { value: '#455a64', label: 'Blue Grey', description: 'Neutral, balanced, calm' },
  { value: '#00796b', label: 'Teal', description: 'Clarity, communication, healing' },
  { value: '#5d4037', label: 'Brown', description: 'Stability, reliability, earth' },
  { value: '#616161', label: 'Grey', description: 'Neutral, formal, classic' },
  { value: '#e91e63', label: 'Pink', description: 'Creative, friendly, approachable' },
  { value: '#9c27b0', label: 'Deep Purple', description: 'Luxury, creativity, mystery' },
  { value: '#3f51b5', label: 'Indigo', description: 'Deep, intuitive, sophisticated' },
  { value: '#00bcd4', label: 'Cyan', description: 'Fresh, modern, digital' },
  { value: '#4caf50', label: 'Light Green', description: 'Fresh, positive, growth' },
  { value: '#ff9800', label: 'Amber', description: 'Warm, attention-grabbing' },
  { value: '#ff5722', label: 'Deep Orange', description: 'Bold, energetic, powerful' },
  { value: '#795548', label: 'Deep Brown', description: 'Grounded, natural, warm' },
  { value: '#607d8b', label: 'Steel Blue', description: 'Industrial, modern, cool' }
];

/**
 * Get icon by value
 * @param {string} value - Icon value
 * @returns {Object|null} Icon object or null if not found
 */
export const getIconByValue = (value) => {
  return CATEGORY_ICONS.find(icon => icon.value === value) || null;
};

/**
 * Get color by value
 * @param {string} value - Color value
 * @returns {Object|null} Color object or null if not found
 */
export const getColorByValue = (value) => {
  return CATEGORY_COLORS.find(color => color.value === value) || null;
};

/**
 * Get default icon and color for backwards compatibility
 * @param {string} name - Category name
 * @returns {Object} Default icon and color values
 */
export const getDefaultIconAndColor = (name) => {
  // Legacy logic for backwards compatibility
  const iconMap = {
    tutorial: '📚',
    guide: '📋',
    guideline: '📋',
    reference: '📖',
    faq: '❓',
    documentation: '🔧',
    meeting: '📝',
    note: '📝',
    policy: '📄',
    procedure: '⚙️',
    help: '❓',
    support: '🆘',
    knowledge: '🧠',
    resource: '📦',
    template: '📋',
    example: '💡'
  };

  const colors = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
    '#d32f2f', '#455a64', '#00796b', '#5d4037',
    '#616161', '#e91e63', '#9c27b0', '#3f51b5'
  ];

  const lowerName = name.toLowerCase();
  let defaultIcon = '📁'; // Default folder icon

  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      defaultIcon = icon;
      break;
    }
  }

  // Generate consistent color based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const defaultColor = colors[Math.abs(hash) % colors.length];

  return {
    icon: defaultIcon,
    color: defaultColor
  };
};
