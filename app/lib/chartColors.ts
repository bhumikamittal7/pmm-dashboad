/**
 * These colors are vibrant, complementary, and accessible
 */

// Primary color palette
export const LOOKER_COLORS = [
  '#4285F4', // Blue
  '#34A853', // Green
  '#FBBC04', // Yellow
  '#EA4335', // Red
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#00BCD4', // Teal
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

// Extended palette for charts with many categories
export const LOOKER_COLORS_EXTENDED = [
  ...LOOKER_COLORS,
  '#3F51B5', // Indigo
  '#009688', // Teal Green
  '#FF5722', // Deep Orange
  '#673AB7', // Deep Purple
  '#CDDC39', // Lime
  '#FFC107', // Amber
  '#FF4081', // Pink Accent
  '#4CAF50', // Green Accent
  '#2196F3', // Light Blue
  '#F44336', // Red Accent
];

// Specific color assignments for common chart types
export const CHART_COLORS = {
  // For two-series charts (e.g., PRs vs Issues)
  primary: '#4285F4',   // Blue
  secondary: '#34A853', // Green
  
  // For three-series charts
  tertiary: '#FBBC04',  // Yellow
  
  // For status/aging charts
  success: '#34A853',    // Green
  warning: '#FBBC04',   // Yellow
  error: '#EA4335',      // Red
  
  // For timeline/line charts
  line1: '#4285F4',     // Blue
  line2: '#34A853',     // Green
  line3: '#FF9800',     // Orange
};

/**
 * Get a color from the palette by index (with cycling)
 */
export function getColor(index: number, palette: string[] = LOOKER_COLORS): string {
  return palette[index % palette.length];
}
