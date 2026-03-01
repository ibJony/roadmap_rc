import type { CardStage } from './types';

// Stage colors matching native app exactly
export const STAGE_COLORS: Record<CardStage, string> = {
  ideas: 'rgb(143, 89, 194)',       // Soft purple (0.56, 0.35, 0.76)
  exploration: 'rgb(242, 153, 51)', // Warm orange (0.95, 0.60, 0.20)
  prototyping: 'rgb(51, 173, 199)', // Teal blue (0.20, 0.68, 0.78)
  production: 'rgb(77, 191, 102)',   // Fresh green (0.30, 0.75, 0.40)
  compost: 'rgb(142, 142, 147)',    // System gray
};

export const STAGE_COLORS_HEX: Record<CardStage, string> = {
  ideas: '#8F59C2',
  exploration: '#F29933',
  prototyping: '#33ADC7',
  production: '#4DBF66',
  compost: '#8E8E93',
};

export const STAGE_BG_COLORS: Record<CardStage, string> = {
  ideas: 'rgba(143, 89, 194, 0.12)',
  exploration: 'rgba(242, 153, 51, 0.12)',
  prototyping: 'rgba(51, 173, 199, 0.12)',
  production: 'rgba(77, 191, 102, 0.12)',
  compost: 'rgba(142, 142, 147, 0.12)',
};

export const STAGE_TEXT_COLORS: Record<CardStage, string> = {
  ideas: 'text-purple-600 dark:text-purple-400',
  exploration: 'text-orange-600 dark:text-orange-400',
  prototyping: 'text-teal-600 dark:text-teal-400',
  production: 'text-green-600 dark:text-green-400',
  compost: 'text-gray-600 dark:text-gray-400',
};

export const STAGE_BORDER_COLORS: Record<CardStage, string> = {
  ideas: 'border-purple-300 dark:border-purple-700',
  exploration: 'border-orange-300 dark:border-orange-700',
  prototyping: 'border-teal-300 dark:border-teal-700',
  production: 'border-green-300 dark:border-green-700',
  compost: 'border-gray-300 dark:border-gray-700',
};

export const KR_STATUS_COLORS: Record<string, string> = {
  on_track: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  at_risk: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  behind: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  achieved: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
};

export const TOAST_COLORS: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-blue-500',
};
