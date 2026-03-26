/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

const nativeFonts = {
  sans: 'NotoSans-Regular',
  sansMedium: 'NotoSans-Medium',
  sansSemiBold: 'NotoSans-SemiBold',
  sansBold: 'NotoSans-Bold',
  display: 'PlusJakartaSans-ExtraBold',
  displaySemiBold: 'PlusJakartaSans-SemiBold',
  displayBold: 'PlusJakartaSans-Bold',
  serif: 'NotoSans-Regular',
  rounded: 'PlusJakartaSans-SemiBold',
  mono: 'monospace',
} as const;

const webFonts = {
  sans: 'var(--font-display)',
  sansMedium: 'var(--font-display)',
  sansSemiBold: 'var(--font-display)',
  sansBold: 'var(--font-display)',
  display: 'var(--font-display)',
  displaySemiBold: 'var(--font-display)',
  displayBold: 'var(--font-display)',
  serif: 'var(--font-serif)',
  rounded: 'var(--font-rounded)',
  mono: 'var(--font-mono)',
} as const;

export const Fonts = Platform.OS === 'web' ? webFonts : nativeFonts;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
