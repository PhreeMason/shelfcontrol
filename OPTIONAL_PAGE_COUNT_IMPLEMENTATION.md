# Implementation Plan: Optional Page Count for Pending Deadlines

## Overview
Make `total_quantity` (page count) optional for pending deadlines, enforcing it only when transitioning to "reading" status. This allows advance copy readers to create deadlines before knowing final page counts.

---

## Implementation Checklist

### Phase 1: Database Changes
- [ ] **1.1** Create migration `supabase/migrations/[timestamp]_make_total_quantity_nullable.sql`
  - Change `total_quantity integer not null` → `total_quantity integer`
  ```sql
  ALTER TABLE deadlines ALTER COLUMN total_quantity DROP NOT NULL;
  ```
- [ ] **1.2** Run migration: `supabase db push`
- [ ] **1.3** Regenerate TypeScript types: `npm run genTypes`
- [ ] **1.4** Verify `src/types/database.types.ts` shows `total_quantity: number | null`

### Phase 2: Form Validation
- [ ] **2.1** Update `src/utils/deadlineFormSchema.ts`
  - Make `totalQuantity` optional
  - Add `.refine()` to require it when `status === 'active'`
  ```typescript
  totalQuantity: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter a whole number')
    .positive('Total must be greater than 0')
    .optional()
  ```
  - Add conditional validation in schema (see detailed code below)

- [ ] **2.2** Update `src/components/forms/DeadlineFormStep2Combined.tsx`
  - Remove red asterisk from "Total Pages" label when `selectedStatus === 'pending'`
  - Update `getTotalQuantityLabel()` function
  - Update helper text to show "You can add page count later when you start reading" for pending

### Phase 3: Calculation Guards
- [ ] **3.1** Update `src/utils/paceCalculations.ts`
  - Add null check to `calculateRequiredPace()`: return 0 if `totalQuantity` is null
  - Add null check to `minimumUnitsPerDayFromDeadline()`: return 0 if `total` is null

- [ ] **3.2** Update `src/utils/deadlineCalculations.ts`
  - Add null check to `calculateRemaining()`: return 0 if `totalQuantity` is null
  - Add null check to `calculateTotalQuantity()`: return 0 if value is null

- [ ] **3.3** Verify `src/utils/deadlineCore.ts`
  - `calculateProgressPercentage()` already handles null (returns 0)
  - No changes needed

- [ ] **3.4** Update `src/utils/deadlineProviderUtils.ts`
  - Update `calculateDeadlineMetrics()` to handle null totalQuantity
  - Add conditional logic for pending deadlines without page count

- [ ] **3.5** Update `src/utils/deadlineDisplayUtils.ts`
  - Update `formatRemainingDisplay()` to handle null
  - Update `formatDailyGoalImpactMessage()` to handle null
  - Update `formatCapacityMessage()` to handle null
  - Return "Page count unknown" for pending without totalQuantity

- [ ] **3.6** Verify `src/utils/deadlineUtils.ts`
  - No changes needed (pending deadlines already separated)

### Phase 4: Provider Updates
- [ ] **4.1** Update `src/providers/DeadlineProvider.tsx`
  - Add conditional logic to `getDeadlineCalculations()`
  - For `isPending && !deadline.total_quantity`, return placeholder calculations:
  ```typescript
  if (deadlineStatus.isPending && !deadline.total_quantity) {
    return {
      currentProgress: 0,
      totalQuantity: 0,
      remaining: 0,
      progressPercentage: 0,
      daysLeft: calculateLocalDaysLeft(deadline.deadline_date),
      unitsPerDay: 0,
      urgencyLevel: 'good',
      urgencyColor: colors.good,
      statusMessage: 'Not started',
      readingEstimate: '',
      paceEstimate: '',
      unit: getUnitForFormat(deadline.format),
      userPace: 0,
      requiredPace: 0,
      paceStatus: 'green',
      paceMessage: 'Page count unknown',
    };
  }
  ```

### Phase 5: Service Layer Validation
- [ ] **5.1** Update `src/services/deadlines.service.ts`
  - Find `updateDeadlineStatus()` method
  - Add validation when transitioning from `pending` → `reading`:
  ```typescript
  if (currentStatus === 'pending' && status === 'reading') {
    const deadline = await this.getDeadlineById(userId, deadlineId);
    if (!deadline.total_quantity || deadline.total_quantity === 0) {
      throw new Error('Please add page count before starting to read');
    }
  }
  ```

### Phase 6: UI Component Updates
- [ ] **6.1** Update `src/hooks/useDeadlineCardViewModel.ts`
  - Modify `primaryText` logic to check for pending without totalQuantity
  - Show "Page count unknown" instead of pace information
  ```typescript
  const primaryText = useMemo(() => {
    if (latestStatus === 'pending' && !deadline.total_quantity) {
      return 'Page count unknown';
    }

    if (urgencyLevel === 'overdue') {
      return formatRemainingDisplay(remaining, deadline.format);
    }

    // ... rest of existing logic
  }, [latestStatus, deadline.total_quantity, urgencyLevel, remaining, deadline.format, ...]);
  ```

- [ ] **6.2** Update `src/components/features/deadlines/DeadlineActionSheet.tsx`
  - Add new state for page count modal
  - Add modal component to collect page count
  - Update "Start Reading" handler to:
    1. Check if `deadline.total_quantity` exists
    2. If missing, show modal to collect page count
    3. Update deadline with page count first
    4. Then call `startReadingDeadline()`
  - Create new modal component: `src/components/features/deadlines/modals/AddPageCountModal.tsx`

### Phase 7: Testing
- [ ] **7.1** Test form validation
  - Pending deadline can be created without page count
  - Active deadline requires page count
  - Form validation errors show correctly

- [ ] **7.2** Test calculations
  - Pending deadline without page count shows "Page count unknown"
  - No division by zero errors
  - DeadlineCard displays correctly

- [ ] **7.3** Test status transitions
  - Cannot transition pending → reading without page count
  - Error message displays in UI
  - Can add page count and then transition

- [ ] **7.4** Test edge cases
  - Edit pending deadline with page count (should allow)
  - Edit pending deadline without page count (should allow)
  - Add page count to existing pending deadline (should work)

- [ ] **7.5** Run test suite
  - `npm run test:coverage`
  - Fix any broken tests
  - Add new tests for null handling

---

## Detailed Code Examples

### 2.1 Form Schema with Conditional Validation

```typescript
// src/utils/deadlineFormSchema.ts
export const deadlineFormSchema = z.object({
  // ... other fields
  totalQuantity: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid number',
    })
    .int('Please enter a whole number')
    .positive('Total must be greater than 0')
    .optional(),
  // ... other fields
}).refine(
  (data) => {
    // Require totalQuantity when status is 'active'
    if (data.status === 'active') {
      return data.totalQuantity != null && data.totalQuantity > 0;
    }
    return true;
  },
  {
    message: 'Total pages required when starting to read',
    path: ['totalQuantity'],
  }
);
```

### 2.2 Form UI Label Update

```typescript
// src/components/forms/DeadlineFormStep2Combined.tsx
const getTotalQuantityLabel = () => {
  const isRequired = selectedStatus === 'active';

  switch (selectedFormat) {
    case 'audio':
      return (
        <>
          Total Time {isRequired && <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>}
        </>
      );
    default:
      return (
        <>
          Total Pages {isRequired && <ThemedText style={{ color: '#dc2626' }}>*</ThemedText>}
        </>
      );
  }
};

// Update helper text
<ThemedText color="textMuted" style={{ lineHeight: 18 }}>
  {selectedStatus === 'pending'
    ? "You can add page count later when you start reading"
    : "We'll use this to calculate your daily reading pace"
  }
</ThemedText>
```

### 3.1 Pace Calculations Guard

```typescript
// src/utils/paceCalculations.ts
export const calculateRequiredPace = (
  totalQuantity: number | null,
  currentProgress: number,
  daysLeft: number,
  format: 'physical' | 'eBook' | 'audio'
): number => {
  if (!totalQuantity || totalQuantity === 0) return 0;

  const remaining = totalQuantity - currentProgress;
  if (daysLeft <= 0) return remaining;
  return Math.ceil(remaining / daysLeft);
};
```

### 6.2 DeadlineActionSheet Modal

```typescript
// src/components/features/deadlines/DeadlineActionSheet.tsx
const [showPageCountModal, setShowPageCountModal] = useState(false);

const handleStartReading = () => {
  if (!deadline.total_quantity || deadline.total_quantity === 0) {
    setShowPageCountModal(true);
    return;
  }

  startReadingDeadline(deadline.id, () => {
    Toast.show({
      type: 'success',
      text1: 'Started reading',
    });
    onClose();
  });
};

// In the action options:
{
  icon: 'play.fill',
  label: 'Start Reading',
  onPress: handleStartReading,
  show: isPending,
}

// Add modal component
<AddPageCountModal
  visible={showPageCountModal}
  onClose={() => setShowPageCountModal(false)}
  deadline={deadline}
  onSuccess={() => {
    setShowPageCountModal(false);
    handleStartReading();
  }}
/>
```

---

## Files to Modify (Summary)

**Total Files**: ~15-17 files

### Database (2 files)
1. New migration: `supabase/migrations/[timestamp]_make_total_quantity_nullable.sql`
2. Auto-generated: `src/types/database.types.ts` (via `npm run genTypes`)

### Validation & Forms (2 files)
3. `src/utils/deadlineFormSchema.ts`
4. `src/components/forms/DeadlineFormStep2Combined.tsx`

### Calculation Utils (5 files)
5. `src/utils/paceCalculations.ts`
6. `src/utils/deadlineCalculations.ts`
7. `src/utils/deadlineProviderUtils.ts`
8. `src/utils/deadlineDisplayUtils.ts`
9. `src/providers/DeadlineProvider.tsx`

### Services (1 file)
10. `src/services/deadlines.service.ts`

### UI Components (3 files)
11. `src/hooks/useDeadlineCardViewModel.ts`
12. `src/components/features/deadlines/DeadlineActionSheet.tsx`
13. `src/components/features/deadlines/modals/AddPageCountModal.tsx` (new file)

### Tests (3+ files)
14. Schema validation tests
15. Service validation tests
16. Provider calculation tests

---

## Risk Assessment

**Risk Level**: Low-Medium
- Pending deadlines are already isolated from active calculations
- Changes are mostly additive (guards, conditionals)
- Existing functionality should not be affected

**Potential Issues**:
- Edge case: Existing pending deadlines created before migration (should be fine, just treated as having no page count)
- UI/UX: Users might forget to add page count (mitigated by modal on "Start Reading")
- Statistics: Charts/stats might need to exclude pending without page count

**Testing Focus**:
- Null handling in all calculation functions
- Form validation works for both pending and active
- Status transition validation prevents reading without page count
- UI displays correctly for all states

---

## Implementation Notes

1. **Order Matters**: Complete phases in order to avoid breaking changes
2. **Type Safety**: After database migration, TypeScript will enforce null checks
3. **User Experience**: Modal on "Start Reading" is critical for smooth UX
4. **Backward Compatibility**: Existing deadlines continue to work (they all have page counts)
5. **Analytics**: Consider tracking how many pending deadlines are created without page count

---

## Post-Implementation Verification

- [ ] Create new pending deadline without page count (should work)
- [ ] View pending deadline card (should show "Page count unknown")
- [ ] Try to start reading without page count (should show modal)
- [ ] Add page count via modal and start reading (should work)
- [ ] Create new active deadline (should require page count)
- [ ] Edit existing pending deadline to add page count (should work)
- [ ] Check statistics/charts don't break
- [ ] Run full test suite: `npm run test:coverage`
- [ ] Check for TypeScript errors: `npm run typecheck`
- [ ] Test on iOS and Android devices

---

## Rollback Plan

If issues arise:
1. Revert database migration: Create new migration to add `NOT NULL` constraint back
2. Revert all code changes via git
3. Regenerate types: `npm run genTypes`

---

## Questions/Decisions Made

**Q**: Should audiobooks (`totalMinutes`) also be optional?
**A**: Yes, apply same logic to `total_minutes` for audio format

**Q**: What happens to pending deadlines created before this change?
**A**: They already have page counts, so no impact

**Q**: Should we show a different placeholder instead of "Page count unknown"?
**A**: Current decision: "Page count unknown" - can be refined based on user feedback

**Q**: Should we allow transitioning to "reading" without page count?
**A**: No - enforce page count requirement via modal on "Start Reading" action

---

**Last Updated**: 2025-11-25
**Status**: Ready for Implementation
