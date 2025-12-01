# Custom Dates Feature Implementation Plan

## Overview

Add a "Custom Dates" feature allowing users to add named dates (press releases, cover reveals, blog tours, etc.) to any deadline. These dates appear as **all-day events** on the calendar alongside due dates.

### User Requirements
- [x] Fully custom date names with typeahead of previously used values
- [x] All-day calendar display (like due dates)
- [x] No recurrence support
- [x] Available on all deadlines (including archived)

---

## Phase 1: Database Layer ✅ COMPLETE

### 1.1 Create Migration File
- [x] **File**: `supabase/migrations/20251201040000_add_deadline_custom_dates.sql`

### 1.2 Update RPC Function
- [x] Added UNION ALL to `get_daily_activities` function for `custom_date` activity type

---

## Phase 2: Type System Updates ✅ COMPLETE

### Files Modified

| Status | File | Change |
|--------|------|--------|
| [x] | `src/types/customDates.types.ts` | **CREATED** - DeadlineCustomDate, Insert, Update types |
| [x] | `src/constants/database.ts` | Added `DEADLINE_CUSTOM_DATES: 'deadline_custom_dates'` |
| [x] | `src/constants/queryKeys.ts` | Added `CUSTOM_DATES.BY_DEADLINE`, `CUSTOM_DATES.ALL_NAMES` + mutation keys |
| [x] | `src/constants/activityTypes.ts` | Added `'custom_date'` to ActivityType + config |
| [x] | `src/types/calendar.types.ts` | Added `'custom_date'` to validTypes array |

---

## Phase 3: Service Layer ✅ COMPLETE

- [x] **File**: `src/services/customDates.service.ts`

Methods:
- `getCustomDates(userId, deadlineId)` - Fetch dates for a deadline, ordered by date
- `getAllCustomDateNames(userId)` - Fetch distinct names for typeahead
- `addCustomDate(userId, deadlineId, { name, date })` - Create with `generateId('dcd')`
- `updateCustomDate(customDateId, userId, data)` - Update name/date
- `deleteCustomDate(customDateId, userId)` - Delete

All mutations track activity via `activityService.trackUserActivity()`.

---

## Phase 4: React Query Hooks

- [ ] **File**: `src/hooks/useCustomDates.ts`

| Hook | Purpose |
|------|---------|
| `useGetCustomDates(deadlineId)` | Fetch custom dates for deadline |
| `useGetAllCustomDateNames()` | Fetch unique names for typeahead |
| `useAddCustomDate()` | Mutation - invalidates dates + calendar |
| `useUpdateCustomDate()` | Mutation - invalidates dates + calendar |
| `useDeleteCustomDate()` | Mutation - invalidates dates + calendar |

**Invalidation**: On mutations, invalidate:
- `QUERY_KEYS.CUSTOM_DATES.BY_DEADLINE`
- `QUERY_KEYS.CUSTOM_DATES.ALL_NAMES`
- `['deadline', 'daily_activities']` (calendar refresh)

---

## Phase 5: Form Schema

- [ ] **File**: `src/schemas/customDateFormSchema.ts`

```typescript
export const customDateFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  date: z.string().min(1, 'Date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});
```

---

## Phase 6: UI Components

### 6.1 Section Component
- [ ] **File**: `src/components/features/deadlines/DeadlineCustomDatesSection.tsx`

- Section title: "Important Dates" (per LANGUAGE_GUIDE - avoid "deadline")
- Add button triggers form
- List of CustomDateCard items
- Empty state with ghost UI

### 6.2 Card Component
- [ ] **File**: `src/components/features/deadlines/CustomDateCard.tsx`

- Calendar icon + formatted date
- Name prominently displayed
- Edit/Delete actions
- Theming via tokens (THEMING_GUIDE)

### 6.3 Form Component
- [ ] **File**: `src/components/features/deadlines/CustomDateForm.tsx`

- Name input with typeahead (previous values)
- Date picker
- Save/Cancel buttons
- Zod validation via react-hook-form

### 6.4 Name Typeahead
Reuse existing `Typeahead` component pattern with `useGetAllCustomDateNames()` hook.

---

## Phase 7: Calendar Integration

### 7.1 Update Calendar Display
- [ ] **File**: `src/app/(authenticated)/calendar.tsx`

Filter `custom_date` alongside `deadline_due` as all-day items:
```typescript
const allDayActivities = selectedDateActivities.filter(
  item => item.activityType === 'deadline_due' || item.activityType === 'custom_date'
);
```

### 7.2 Create Calendar Card
- [ ] **File**: `src/components/features/calendar/CustomDateCalendarCard.tsx`

Similar to `DeadlineDueCard.tsx`:
- "All Day" time column
- Calendar icon with accent color
- Custom date name + book title

### 7.3 Update Utilities
- [ ] **File**: `src/utils/calendarUtils.ts`

- Update `sortActivitiesByTime` to handle `custom_date` as all-day
- Update `calculateMarkedDates` to add dots for custom dates

---

## Phase 8: Integration

- [ ] **File**: `src/app/deadline/[id]/index.tsx`

Add section after `DeadlineContactsSection`:
```typescript
import { DeadlineCustomDatesSection } from '@/components/features/deadlines/DeadlineCustomDatesSection';

// In JSX:
<DeadlineCustomDatesSection deadline={deadline} />
```

---

## Phase 9: Testing

| Status | Test File | Coverage |
|--------|-----------|----------|
| [ ] | `src/services/__tests__/customDates.service.test.ts` | CRUD operations, activity tracking |
| [ ] | `src/schemas/__tests__/customDateFormSchema.test.ts` | Validation rules |
| [ ] | `src/hooks/__tests__/useCustomDates.test.ts` | Hook integration |

---

## Phase 10: Final Steps

- [ ] Run `npm run genTypes` to regenerate database types
- [ ] Run `npm run lint` to check for issues
- [ ] Run `npm run typecheck` to verify types
- [ ] Run `npm run test` to verify tests pass

---

## Implementation Order

1. **Database**: Migration (table + RPC update)
2. **Types**: Create types file, update constants
3. **Service**: Create customDates.service.ts
4. **Hooks**: Create useCustomDates.ts
5. **Schema**: Create customDateFormSchema.ts
6. **UI**: Card → Form → Section components
7. **Calendar**: Update utils, create card, update screen
8. **Integration**: Add section to deadline detail page
9. **Testing**: Service + schema tests
10. **Generate types**: Run `npm run genTypes`

---

## Files Summary

### Create (10 files)
| Status | File |
|--------|------|
| [x] | `supabase/migrations/20251201040000_add_deadline_custom_dates.sql` |
| [x] | `src/types/customDates.types.ts` |
| [x] | `src/services/customDates.service.ts` |
| [ ] | `src/hooks/useCustomDates.ts` |
| [ ] | `src/schemas/customDateFormSchema.ts` |
| [ ] | `src/components/features/deadlines/DeadlineCustomDatesSection.tsx` |
| [ ] | `src/components/features/deadlines/CustomDateCard.tsx` |
| [ ] | `src/components/features/deadlines/CustomDateForm.tsx` |
| [ ] | `src/components/features/calendar/CustomDateCalendarCard.tsx` |
| [ ] | `src/services/__tests__/customDates.service.test.ts` |

### Modify (7 files)
| Status | File | Change |
|--------|------|--------|
| [x] | `src/constants/database.ts` | Add table constant |
| [x] | `src/constants/queryKeys.ts` | Add query keys |
| [x] | `src/constants/activityTypes.ts` | Add custom_date type |
| [x] | `src/types/calendar.types.ts` | Update validation |
| [ ] | `src/app/deadline/[id]/index.tsx` | Add section |
| [ ] | `src/app/(authenticated)/calendar.tsx` | Handle all-day display |
| [ ] | `src/utils/calendarUtils.ts` | Update transforms |

---

## Reference Files (Patterns to Follow)

- `src/services/contacts.service.ts` - Service pattern
- `src/hooks/useContacts.ts` - Hooks pattern
- `src/components/features/deadlines/DeadlineContactsSection.tsx` - Section UI pattern
- `src/components/features/deadlines/ContactCard.tsx` - Card pattern
- `src/components/features/deadlines/ContactForm.tsx` - Form pattern
- `src/components/features/calendar/DeadlineDueCard.tsx` - Calendar card pattern
- `supabase/migrations/20251028183835_create_deadline_contacts.sql` - Migration pattern
