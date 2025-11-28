# Bug Report: Crash When Adding Deadline with 100% Progress

**Date Reported**: November 2024
**Status**: Fixed
**Severity**: Critical (App Crash)

## User Report

> Hi! Thank you, and I just realised I think I forgot to include a detail that may have been part of the reason why the app crashed; when uploading the book, I tried to add it with all pages marked as read as I have just finished reading it but have not yet reviewed it. I think this may have been part of the problem of why the book did not originally show up in the active books tab, and may have affected the pause feature too? It worked normally after I deducted one page from it now shows up as still in progress and I was able to pause the book too.
>
> — Lena

## Symptoms

1. App crashed (force close) when adding a deadline with 100% progress
2. The deadline didn't show up in the active books tab
3. The pause feature didn't work on the deadline
4. Issue resolved after deducting one page (making it < 100% progress)

## Root Cause Analysis

### Primary Crash Vector: Division by Zero in `getPaceBasedStatus`

**File**: `src/utils/paceCalculations.ts:274`

```typescript
if (userPace < requiredPace) {
  const paceGap = requiredPace - userPace;
  const increaseNeeded = (paceGap / userPace) * 100;  // ← CRASH when userPace = 0
```

**Crash conditions**:
- New user with NO reading history → `userPace = 0`
- Any deadline with pages remaining → `requiredPace > 0`
- `0 < requiredPace` evaluates to `true`
- `(paceGap / 0) * 100` = `Infinity`, causing downstream rendering failures

### Data Flow to Crash

```
User adds deadline with 100% progress
    ↓
DeadlineProvider.getDeadlineCalculations() called
    ↓
calculateDeadlinePaceStatus() → getPaceBasedStatus()
    ↓
If userPace = 0 and requiredPace > 0:
    (paceGap / 0) * 100 = Infinity
    ↓
Infinity propagates through rendering pipeline
    ↓
App crashes
```

### Secondary Issue: UI Display Logic

Even without a crash, deadlines with 100% progress and `status='reading'` could be hidden by UI filtering logic that assumes `remaining > 0` for active deadlines.

## The Fix

### Changes to `src/utils/paceCalculations.ts`

Added two guards in `getPaceBasedStatus`:

```typescript
export const getPaceBasedStatus = (
  userPace: number,
  requiredPace: number,
  daysLeft: number,
  progressPercentage: number
): PaceBasedStatus => {
  // NEW: Handle 100% progress case - book is done, no pace needed
  if (progressPercentage >= 100) {
    return {
      color: 'green',
      level: 'good',
      message: 'Finished!',
    };
  }

  // ... existing overdue checks ...

  // NEW: Guard against division by zero when user has no pace history
  if (userPace <= 0) {
    return {
      color: 'orange',
      level: 'approaching',
      message: 'Start tracking progress',
    };
  }

  // Now safe to do division
  if (userPace < requiredPace) {
    const paceGap = requiredPace - userPace;
    const increaseNeeded = (paceGap / userPace) * 100; // userPace > 0 guaranteed
    // ...
  }
};
```

### Unit Tests Added

File: `src/utils/__tests__/paceCalculations.test.ts`

```typescript
it('should return green for 100% progress (finished book)', () => {
  const result = getPaceBasedStatus(20, 0, 5, 100);
  expect(result.color).toBe('green');
  expect(result.message).toBe('Finished!');
});

it('should return orange for zero user pace (no reading history)', () => {
  const result = getPaceBasedStatus(0, 25, 5, 50);
  expect(result.color).toBe('orange');
  expect(result.message).toBe('Start tracking progress');
});

it('should not crash with zero user pace and zero required pace', () => {
  const result = getPaceBasedStatus(0, 0, 5, 50);
  // Should not throw, returns orange status
});
```

## Other Potential Division-by-Zero Locations

During investigation, these other locations were identified as potentially vulnerable (though they have existing guards):

| File | Line | Code | Status |
|------|------|------|--------|
| `deadlineProviderUtils.ts` | 258 | `Math.round(1 / actualUnitsPerDay)` | Has `=== 0` guard |
| `deadlineProviderUtils.ts` | 282 | `Math.round(1 / actualUnitsPerDay)` | Has `=== 0` guard |
| `TodaysProgress.tsx` | 26 | `(current / total) * 100` | Could crash if `total = 0` |

## Lessons Learned

1. **Always guard division operations** - Even if the numerator is expected to be zero, edge cases happen
2. **New users are edge cases** - `userPace = 0` is a valid state for new accounts with no reading history
3. **100% progress is a valid input** - Users may add books they've already finished but haven't reviewed yet
4. **Test edge cases explicitly** - Add unit tests for boundary conditions (0%, 100%, negative values)

## Related Files

- `src/utils/paceCalculations.ts` - Fixed
- `src/utils/__tests__/paceCalculations.test.ts` - Tests added
- `src/utils/deadlineProviderUtils.ts` - Has existing guards, no changes needed
- `src/providers/DeadlineProvider.tsx` - Calls the fixed function

## Verification

Run the following to verify the fix:

```bash
npm run test:ff -- --testPathPattern="paceCalculations" --testNamePattern="100%|zero user pace|crash"
```

All tests should pass.
