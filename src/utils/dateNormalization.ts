import dayjs from '@/lib/dayjs';
import type { Dayjs } from 'dayjs';

/**
 * Date Normalization Layer
 * ---------------------------------------------
 * All timestamp fields returned from the database (Supabase/Postgres) are stored in UTC.
 * We standardize on the following rules for interpreting and displaying these values:
 * 1. Date-Time strings (with a time component, typically ISO like 2025-09-16T10:30:00Z) are parsed as UTC
 *    and then converted to the user's local timezone immediately.
 * 2. Date-only strings (YYYY-MM-DD) are treated as calendar dates WITHOUT an implicit time. They are interpreted
 *    as local dates (not shifted) for user-based calculations like days-left comparisons. This avoids off-by-one
 *    drift that can occur if we incorrectly treat them as UTC midnight and then convert.
 * 3. All internal calculations that involve diff'ing calendar days should operate on startOf('day') using LOCAL time.
 * 4. When producing new timestamps to send to the backend we always use `new Date().toISOString()` (UTC).
 *
 * Helper Summary:
 * - isDateOnly: quick heuristic to determine if a value is a simple YYYY-MM-DD date.
 * - parseServerDateTime: parse an ISO timestamp string (with time) into a LOCAL Dayjs instance.
 * - parseServerDateOnly: parse a YYYY-MM-DD date string into a LOCAL Dayjs instance (no shifting from UTC).
 * - normalizeServerDate: convenience wrapper that dispatches to the appropriate parser.
 *
 * IMPORTANT: Always use these helpers instead of raw dayjs() on server-provided fields:
 *   created_at, updated_at, deadline_date, date_added, publication_date, status[].created_at,
 *   progress[].created_at / updated_at.
 */

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value?: string | null): value is string {
  return !!value && DATE_ONLY_REGEX.test(value);
}

/**
 * Parses an ISO timestamp (with time component) from the server.
 * Interprets it as UTC then converts to local timezone Dayjs object.
 */
export function parseServerDateTime(value?: string | null): Dayjs {
  if (!value) return dayjs(NaN); // invalid Dayjs instance
  // dayjs will treat Z-offset properly; ensure utc before local conversion
  const d = dayjs.utc(value);
  return d.local();
}

/**
 * Parses a date-only (YYYY-MM-DD) value as a local calendar date (no timezone shifting).
 */
export function parseServerDateOnly(value?: string | null): Dayjs {
  if (!value || !isDateOnly(value)) return dayjs(NaN);
  // Interpret directly in local calendar space
  return dayjs(value, 'YYYY-MM-DD');
}

/**
 * Normalizes a server date (either date-only or date-time) to a Dayjs object in LOCAL time.
 */
export function normalizeServerDate(value?: string | null): Dayjs {
  if (!value) return dayjs(NaN);
  return isDateOnly(value)
    ? parseServerDateOnly(value)
    : parseServerDateTime(value);
}

/**
 * Utility to get a safe start-of-day (local) from a server field.
 */
export function normalizeServerDateStartOfDay(value?: string | null): Dayjs {
  const d = normalizeServerDate(value);
  return d.isValid() ? d.startOf('day') : d;
}

/**
 * Calculates an integer day difference (deadline - today) using normalized semantics.
 * Positive => future, negative => past. For date-only deadlines we remain purely local.
 */
export function calculateLocalDaysLeft(deadline: string): number {
  const target = normalizeServerDateStartOfDay(deadline);
  if (!target.isValid()) return 0;
  const today = dayjs().startOf('day');
  return target.diff(today, 'day');
}

/**
 * Exports grouped for convenience.
 */
export const DateNormalization = {
  isDateOnly,
  parseServerDateTime,
  parseServerDateOnly,
  normalizeServerDate,
  normalizeServerDateStartOfDay,
  calculateLocalDaysLeft,
};
