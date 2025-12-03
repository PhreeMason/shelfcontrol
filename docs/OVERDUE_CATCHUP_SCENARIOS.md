# Overdue Catch-Up Feature - Scenario Specification

## Key Rule (To Confirm)

**Overdue Goal = pace - activeGoal** (fixed, never changes based on progress)

The overdue catch-up goal should ALWAYS be the spare capacity (pace - activeGoal), regardless of:
- How much active reading overflow occurs
- How much overdue reading progress is made

This means users CAN exceed the goal and see "+X pages extra".

---

## Scenarios - Please Fill In Expected Values

**Instructions:** For each scenario, fill in what you expect the Overdue Catch-Up display to show.

### Scenario 1: Basic - At active goal, some overdue progress
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 100 |
| Overdue Progress | 40 |
| **Expected Display** | `40/50` |
| **Expected Message** | (something encouraging) |

### Scenario 2: Active overflow, under overdue capacity
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 120 |
| Overdue Progress | 30 |
| **Expected Display** | `30/30` |
| **Expected Message** | (something congratulatory) |

### Scenario 3: Active overflow, over overdue capacity
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 120 |
| Overdue Progress | 70 |
| **Expected Display** | `70/50` |
| **Expected Message** | +20 pages extra!|

### Scenario 4: From your logs
| Field | Value |
|-------|-------|
| Pace | 144 |
| Active Goal | 82 |
| Active Progress | 142 |
| Overdue Progress | 129 |
| **Expected Display** | `129/62` (confirmed) |
| **Expected Message** | `+67 pages extra!` |

### Scenario 5: Massive active overflow beyond pace
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 200 |
| Overdue Progress | 50 |
| **Expected Display** | `50/50` |
| **Expected Message** |  (something congratulatory)       |

### Scenario 6: No overdue progress yet
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 100 |
| Overdue Progress | 0 |
| **Expected Display** | `0/50` |
| **Expected Message** | (something encouraging) |

### Scenario 7: Exactly at overdue capacity
| Field | Value |
|-------|-------|
| Pace | 150 |
| Active Goal | 100 |
| Active Progress | 100 |
| Overdue Progress | 50 |
| **Expected Display** | `50/50` |
| **Expected Message** | (something congratulatory) |

---

## Questions to Clarify

1. **Should active overflow affect the overdue goal at all?**
   - Current behavior: Yes, it reduces the goal
   - Your expectation: No, goal is always `pace - activeGoal`?

2. **When should the overdue catch-up card be hidden?**
   - Only when there are no overdue books?
   - When active progress hasn't met active goal yet?
   - Never hidden once there's spare capacity?

---

## Files to Modify

- `src/utils/deadlineAggregationUtils.ts` - Fix `calculateOverdueCatchUpTotals`
- `src/utils/__tests__/deadlineAggregationUtils.test.ts` - Update tests
- `src/components/progress/TodaysGoals.tsx` - May need to adjust visibility logic

---

## Proposed Fix

Once scenarios are confirmed, the fix should be:
```typescript
export const calculateOverdueCatchUpTotals = (
  overdueDeadlines: ReadingDeadlineWithProgress[],
  userPace: number,
  todaysActiveGoal: number,
  todaysActiveProgress: number,
  getProgress: (deadline: ReadingDeadlineWithProgress) => number
): OverdueCatchUpTotals => {
  // Goal is always spare capacity - no adjustment for active overflow
  const availableForOverdue = Math.max(0, userPace - todaysActiveGoal);

  // Calculate progress made on overdue books today
  const overdueProgressToday = overdueDeadlines.reduce((total, deadline) => {
    const progress = getProgress(deadline);
    return total + (progress > 0 ? progress : 0);
  }, 0);

  return {
    total: Math.round(availableForOverdue),
    current: Math.round(overdueProgressToday),
    hasCapacity: availableForOverdue > 0,
  };
};
```

## Cleanup Required

After fixing, remove debug console.logs from `src/utils/deadlineAggregationUtils.ts`
