# Custom Dates Feature Implementation Plan

## Overview

Add a "Custom Dates" feature allowing users to add named dates (press releases, cover reveals, blog tours, etc.) to any deadline. These dates appear as **all-day events** on the calendar alongside due dates.

### User Requirements
- [x] Fully custom date names with typeahead of previously used values
- [x] All-day calendar display (like due dates)
- [x] No recurrence support
- [x] Available on all deadlines (including archived)

---

## Phase 1: Database Layer

### 1.1 Create Migration File
- [ ] **File**: `supabase/migrations/[timestamp]_add_deadline_custom_dates.sql`

```sql
-- Create deadline_custom_dates table
create table deadline_custom_dates (
  id text not null primary key,
  deadline_id text references deadlines(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  date date not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table deadline_custom_dates enable row level security;

-- RLS Policies (view, insert, update, delete for own data)
create policy "Users can view own custom dates" on deadline_custom_dates
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own custom dates" on deadline_custom_dates
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own custom dates" on deadline_custom_dates
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own custom dates" on deadline_custom_dates
  for delete using ((select auth.uid()) = user_id);

-- Auto-update timestamps trigger
CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_custom_dates
    FOR EACH ROW EXECUTE PROCEDURE handle_times();

-- Indexes
create index deadline_custom_dates_deadline_id_idx on deadline_custom_dates (deadline_id);
create index deadline_custom_dates_user_id_idx on deadline_custom_dates (user_id);
create index deadline_custom_dates_date_idx on deadline_custom_dates (date);
```

### 1.2 Update RPC Function
- [ ] Add UNION ALL to `get_daily_activities` function:

```sql
UNION ALL
-- Custom dates (all-day events)
SELECT
  dcd.date as activity_date,
  'custom_date'::text as activity_type,
  d.id as deadline_id,
  d.book_title,
  dcd.date::timestamptz as activity_timestamp,
  jsonb_build_object(
    'custom_date_name', dcd.name,
    'custom_date_id', dcd.id,
    'format', d.format,
    'author', d.author
  ) as metadata
FROM deadline_custom_dates dcd
INNER JOIN deadlines d ON dcd.deadline_id = d.id
WHERE d.user_id = p_user_id
  AND dcd.date >= p_start_date
  AND dcd.date <= p_end_date
```

---

## Phase 2: Type System Updates

### Files to Modify

| Status | File | Change |
|--------|------|--------|
| [ ] | `src/types/customDates.types.ts` | **CREATE** - DeadlineCustomDate, Insert, Update types |
| [ ] | `src/constants/database.ts` | Add `DEADLINE_CUSTOM_DATES: 'deadline_custom_dates'` |
| [ ] | `src/constants/queryKeys.ts` | Add `CUSTOM_DATES.BY_DEADLINE`, `CUSTOM_DATES.ALL_NAMES` |
| [ ] | `src/constants/activityTypes.ts` | Add `'custom_date'` to ActivityType, add config |
| [ ] | `src/types/calendar.types.ts` | Add `'custom_date'` to validTypes array |

### Activity Type Config
```typescript
custom_date: {
  icon: 'calendar.badge.plus',
  color: Colors.light.accent,
  label: 'Custom Date',
},
```

---

## Phase 3: Service Layer

- [ ] **File**: `src/services/customDates.service.ts`

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
| [ ] | `supabase/migrations/[timestamp]_add_deadline_custom_dates.sql` |
| [ ] | `src/types/customDates.types.ts` |
| [ ] | `src/services/customDates.service.ts` |
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
| [ ] | `src/constants/database.ts` | Add table constant |
| [ ] | `src/constants/queryKeys.ts` | Add query keys |
| [ ] | `src/constants/activityTypes.ts` | Add custom_date type |
| [ ] | `src/types/calendar.types.ts` | Update validation |
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
