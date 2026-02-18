/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4cc9ff';

export const Colors = {
  light: {
    text: '#11181c',
    textMuted: '#6c7382',
    background: '#fdfdfd',
    surface: '#f6f7fb',
    card: '#ffffff',
    cardBorder: '#e2e4ea',
    tint: tintColorLight,
    accent: '#0a7ea4',
    success: '#16a34a',
    danger: '#d92d20',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    divider: '#e7e9ee',
  },
  dark: {
    text: '#f4f7ff',
    textMuted: '#8b95a7',
    background: '#0d0f14',
    surface: '#161b22',
    card: '#1f242d',
    cardBorder: '#2d333d',
    tint: tintColorDark,
    accent: tintColorDark,
    success: '#22c55e',
    danger: '#ff6b6b',
    icon: '#9ba1a6',
    tabIconDefault: '#9ba1a6',
    tabIconSelected: tintColorDark,
    divider: '#242b37',
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
