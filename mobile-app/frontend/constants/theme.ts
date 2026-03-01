/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional colors for home screen
    primary: '#0a7ea4',
    card: '#ffffff',
    surface: '#f8f9fa',
    textMuted: '#687076',
    placeholder: '#9CA3AF',
    cardBorder: '#e5e7eb',
    success: '#10b981',
    // Additional colors for other screens
    screenBackground: '#f8f9fb',
    cardBackground: '#ffffff',
    textPrimary: '#111',
    textSecondary: '#6b7280',
    borderColor: '#edf0f5',
    accentPrimary: '#4f46e5',
    accentSecondary: '#0d9488',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional colors for home screen
    primary: '#0a7ea4',
    card: '#1f2937',
    surface: '#111827',
    textMuted: '#9BA1A6',
    placeholder: '#6B7280',
    cardBorder: '#374151',
    success: '#10b981',
    // Additional colors for other screens
    screenBackground: '#0f1419',
    cardBackground: '#1f2937',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    borderColor: '#374151',
    accentPrimary: '#818cf8',
    accentSecondary: '#14b8a6',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
