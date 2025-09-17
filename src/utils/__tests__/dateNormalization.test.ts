import {
    calculateLocalDaysLeft,
    isDateOnly,
    normalizeServerDate,
    normalizeServerDateStartOfDay,
    parseServerDateOnly,
    parseServerDateTime,
} from '../dateNormalization';

// Freeze time for deterministic tests
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-09-16T12:00:00Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('dateNormalization helpers', () => {
  test('isDateOnly detects YYYY-MM-DD', () => {
    expect(isDateOnly('2025-09-16')).toBe(true);
    expect(isDateOnly('2025-9-16')).toBe(false);
    expect(isDateOnly('2025-09-16T00:00:00Z')).toBe(false);
  });

  test('parseServerDateTime converts UTC to local', () => {
    const dt = parseServerDateTime('2025-09-16T00:00:00Z');
    expect(dt.isValid()).toBe(true);
    // Should represent same instant; local offset may differ.
    expect(dt.toISOString()).toBe('2025-09-16T00:00:00.000Z');
  });

  test('parseServerDateOnly keeps local calendar date', () => {
    const d = parseServerDateOnly('2025-09-16');
    expect(d.format('YYYY-MM-DD')).toBe('2025-09-16');
  });

  test('normalizeServerDate dispatches correctly', () => {
    expect(normalizeServerDate('2025-09-16').format('YYYY-MM-DD')).toBe('2025-09-16');
    expect(normalizeServerDate('2025-09-16T05:00:00Z').isValid()).toBe(true);
  });

  test('normalizeServerDateStartOfDay produces start of local day', () => {
    const sod = normalizeServerDateStartOfDay('2025-09-16T10:30:00Z');
    expect(sod.hour()).toBe(0);
    expect(sod.minute()).toBe(0);
  });

  test('calculateLocalDaysLeft with future date', () => {
    expect(calculateLocalDaysLeft('2025-09-20')).toBe(4);
  });

  test('calculateLocalDaysLeft with past date', () => {
    expect(calculateLocalDaysLeft('2025-09-10')).toBe(-6);
  });
});
