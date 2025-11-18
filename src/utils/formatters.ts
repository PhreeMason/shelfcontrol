/**
 * Shared formatting utilities for the application
 */

/**
 * Formats a status string from snake_case to Title Case
 * @example formatStatus('to_read') => 'To Read'
 * @example formatStatus('in_progress') => 'In Progress'
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a book format string for display
 * @example formatBookFormat('physical') => 'Physical'
 * @example formatBookFormat('eBook') => 'eBook'
 * @example formatBookFormat('audio') => 'Audio'
 */
export function formatBookFormat(format: string): string {
  if (format === 'physical') return 'Physical';
  if (format === 'eBook') return 'eBook';
  if (format === 'audio') return 'Audio';
  // Fallback to capitalized version
  return format.charAt(0).toUpperCase() + format.slice(1);
}

/**
 * Abbreviates large numbers for display (1000+ becomes "1k", "1.5k", etc.)
 *
 * **Examples**:
 * - 500 → "500"
 * - 1000 → "1k"
 * - 1500 → "1.5k"
 * - 7234 → "7.2k"
 * - 10000 → "10k"
 * - 1000000 → "1M"
 *
 * @param value - The number to abbreviate
 * @param decimals - Number of decimal places to show (default: 1)
 * @returns Abbreviated number string
 */
export function abbreviateNumber(value: number, decimals: number = 1): string {
  if (value < 1000) {
    return value.toString();
  }

  if (value < 1000000) {
    // Thousands (k)
    const thousands = value / 1000;
    // Only show decimal if it's not a whole number
    if (thousands % 1 === 0) {
      return `${Math.floor(thousands)}k`;
    }
    return `${thousands.toFixed(decimals)}k`;
  }

  // Millions (M)
  const millions = value / 1000000;
  if (millions % 1 === 0) {
    return `${Math.floor(millions)}M`;
  }
  return `${millions.toFixed(decimals)}M`;
}

/**
 * Formats a number with optional abbreviation for display
 *
 * **Use Cases**:
 * - UI display where space is limited (stats cards, charts)
 * - Accessibility labels should still use full numbers
 *
 * @param value - The number to format
 * @param options - Formatting options
 * @param options.abbreviate - Whether to abbreviate large numbers (default: true)
 * @param options.unit - Unit suffix to append (e.g., "pages", "min")
 * @param options.decimals - Decimal places for abbreviation (default: 1)
 * @returns Formatted number string with optional unit
 *
 * @example
 * formatNumber(1500) => "1.5k"
 * formatNumber(1500, { unit: 'pages' }) => "1.5k pages"
 * formatNumber(1500, { abbreviate: false, unit: 'pages' }) => "1500 pages"
 */
export function formatNumber(
  value: number,
  options: {
    abbreviate?: boolean;
    unit?: string;
    decimals?: number;
  } = {}
): string {
  const { abbreviate = true, unit, decimals = 1 } = options;

  const numStr = abbreviate
    ? abbreviateNumber(value, decimals)
    : value.toString();

  if (unit) {
    return `${numStr} ${unit}`;
  }

  return numStr;
}

/**
 * Constants for opacity values used in UI
 */
export const OPACITY = {
  /** 12.5% opacity - used for subtle backgrounds */
  SUBTLE: '20',
  /** 50% opacity - used for disabled states */
  MEDIUM: '80',
  /** 75% opacity - used for hover states */
  HIGH: 'C0',
} as const;
