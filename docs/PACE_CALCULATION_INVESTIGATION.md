# Pace Calculation Investigation

**Date**: December 2, 2024
**Status**: Investigation complete, fix pending

## Problem Observed

When user reads **more** than their average pace, the current pace calculation can **decrease** instead of increase.

### Example from logs:
```
Today's pages read: 431 (well above average)
Start-of-day pace (excludes today): 157 pages/day
Current pace (includes today): 139 pages/day  ← LOWER, not higher!
```

This is counterintuitive - reading 431 pages (nearly 3x the 157 average) should increase the pace, not decrease it.

## Root Cause

The pace calculation algorithm has two interacting issues:

### 1. Calendar Days vs Activity Days

The algorithm uses **calendar days between first and last reading day**, not the count of days with reading activity.

**File**: `src/utils/paceCalculations.ts:48-66`

```typescript
const calculatePaceFromActivityDays = (activityDays: ActivityDay[]): number => {
  const totalAmount = activityDays.reduce((sum, day) => sum + day.amount, 0);

  // Uses CALENDAR days, not activity days
  const firstDay = new Date(activityDays[0].date);
  const lastDay = new Date(activityDays[activityDaysCount - 1].date);
  const daysBetween = Math.ceil(
    (lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return totalAmount / daysBetween;
};
```

If there are gaps (days without reading), the calendar span is larger than the activity count.

### 2. Sliding Cutoff Window

The cutoff date is calculated from the **most recent progress entry**:

**File**: `src/utils/paceCalculations.ts:73-95`

```typescript
export const calculateCutoffTime = (deadlines, daysToConsider = 21) => {
  // Find most recent progress
  const cutoffDate = normalizeServerDate(mostRecentProgress.created_at);
  return cutoffDate.subtract(daysToConsider, 'day').valueOf();
};
```

When you add today's progress:
- The cutoff shifts forward by 1 day (from "21 days before yesterday" to "21 days before today")
- This can **include older data** that was previously outside the window
- If that older data has gaps before it, the calendar span increases significantly

### Combined Effect

**Without today (7 activity days):**
- Cutoff: Nov 10
- First reading day in window: Nov 25
- Last reading day: Dec 1
- Calendar span: 7 days
- Pace: 1099 pages / 7 days = **157 pages/day**

**With today (8 activity days):**
- Cutoff: Nov 11 (shifted forward)
- First reading day in window: Nov 21 (older day now included!)
- Last reading day: Dec 2
- Calendar span: 12 days (4 gap days + 8 activity days)
- Pace: 1530 pages / 12 days = **127 pages/day** (lower!)

The gap days dilute the average.

## Impact

- **User confusion**: Reading more shows lower pace
- **Pace-based status**: May show incorrect urgency levels
- **Overdue catch-up**: Uses start-of-day pace (unaffected by this bug)

## Potential Fixes

### Option A: Use Activity Days Only
Divide by count of days with reading activity, not calendar days.

```typescript
return totalAmount / activityDaysCount;
```

**Pros**: Simple, intuitive
**Cons**: Ignores rest days (may inflate pace for sporadic readers)

### Option B: Fixed Calendar Window
Always use a fixed window (e.g., last 14 days from today), not sliding based on most recent progress.

```typescript
const cutoffDate = dayjs().subtract(14, 'day');
```

**Pros**: Consistent, predictable
**Cons**: May have empty periods for new users

### Option C: Weighted Average
Weight recent days more heavily than older days.

**Pros**: More responsive to current behavior
**Cons**: More complex

### Option D: Hybrid Approach
Use activity days for the denominator but cap the lookback window.

```typescript
const pace = totalAmount / Math.min(activityDaysCount, calendarDays);
```

## Files to Modify

| File | Function |
|------|----------|
| `src/utils/paceCalculations.ts` | `calculatePaceFromActivityDays()` |
| `src/utils/paceCalculations.ts` | `calculateCutoffTime()` |
| `src/utils/__tests__/paceCalculations.test.ts` | Update test expectations |

## Recommendation

**Option A (Activity Days)** is the simplest fix and matches user intuition:
- "I read on 7 days, averaging X pages per reading day"

However, this is a **behavioral change** that may affect existing users' displayed pace. Consider whether this needs a migration or announcement.

## Related Code

The overdue catch-up feature now uses `calculateUserPaceAsOfStartOfDay()` which excludes today's progress. This investigation revealed the pace calculation issue but the overdue fix is working correctly - the goal stays fixed at `startOfDayPace - activeGoal`.
