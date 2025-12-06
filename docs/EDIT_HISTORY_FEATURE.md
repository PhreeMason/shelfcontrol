# Edit History Feature Implementation

**Started:** December 5, 2024
**Status:** Complete ✅

## Overview

A dedicated screen for editing timestamps on all deadline-related records, replacing the previous "Edit Dates" feature which only allowed editing 3 date fields.

**User Need:** Users want to backdate progress entries and status changes (e.g., "I finished my first ARC on November 28th but forgot to mark it as completed until the 29th").

---

## Progress Tracker

### Part 1: Rollback (Completed ✅)

- [x] Delete `DeadlineEditDatesSection.tsx`
- [x] Delete `docs/EDIT_DATES_FEATURE.md`
- [x] Remove from deadline detail page
- [x] Remove `updateFinishedAt` from deadlines service
- [x] Remove `useUpdateFinishedAt` hook
- [x] Remove `updateReviewDueDate` from review tracking service
- [x] Remove `useUpdateReviewDueDate` hook
- [x] Remove `UPDATE_FINISHED_AT` mutation key
- [x] Remove `finished_at` from testHelpers
- [x] Create migration to drop `finished_at` column
- [x] Run migration
- [x] Regenerate types (`npm run genTypes`)

### Part 2: New Edit History Screen (Completed ✅)

#### Service Layer
- [x] Add `updateProgressTimestamp()` to deadlines service
- [x] Add `updateStatusTimestamp()` to deadlines service
- [x] Re-add `updateReviewDueDate()` to review tracking service (for Dates tab)

#### Query Keys & Hooks
- [x] Add `UPDATE_PROGRESS_TIMESTAMP` and `UPDATE_STATUS_TIMESTAMP` mutation keys
- [x] Add `useUpdateProgressTimestamp()` hook
- [x] Add `useUpdateStatusTimestamp()` hook
- [x] Re-add `useUpdateReviewDueDate()` hook

#### UI Components
- [x] Create `src/components/features/deadlines/edit-history/EditableHistoryRow.tsx`
- [x] Create `src/components/features/deadlines/edit-history/ProgressHistoryTab.tsx`
- [x] Create `src/components/features/deadlines/edit-history/StatusHistoryTab.tsx`
- [x] Create `src/components/features/deadlines/edit-history/DatesTab.tsx`
- [x] Create `src/components/features/deadlines/edit-history/index.ts`

#### Screen & Navigation
- [x] Create `src/app/deadline/[id]/edit-history.tsx` main screen
- [x] Add route to `src/app/deadline/_layout.tsx`
- [x] Add navigation entry point via DeadlineActionSheet

---

## Architecture

### Screen Structure

```
src/app/deadline/[id]/edit-history.tsx
├── Tab 1: Progress History
│   └── List of progress records with editable timestamps
├── Tab 2: Status History
│   └── List of status records with editable timestamps
└── Tab 3: Dates
    ├── Due Date (deadline_date)
    ├── Custom Dates (reuse existing)
    └── Review Due Date (if exists)
```

### Database Tables Involved

| Table | Field to Edit | Description |
|-------|---------------|-------------|
| `deadline_progress` | `created_at` | When progress was logged |
| `deadline_status` | `created_at` | When status changed |
| `deadlines` | `deadline_date` | Due date |
| `deadline_custom_dates` | `date` | User-defined dates |
| `review_tracking` | `review_due_date` | Review deadline |

---

## Files to Create/Modify

### New Files
```
src/app/deadline/[id]/edit-history.tsx
src/components/features/deadlines/edit-history/
├── EditableHistoryRow.tsx
├── ProgressHistoryTab.tsx
├── StatusHistoryTab.tsx
├── DatesTab.tsx
└── index.ts
```

### Modified Files
```
src/services/deadlines.service.ts      - Add timestamp update methods
src/services/reviewTracking.service.ts - Re-add updateReviewDueDate
src/hooks/useDeadlines.ts              - Add timestamp update hooks
src/hooks/useReviewTracking.ts         - Re-add useUpdateReviewDueDate
src/constants/queryKeys.ts             - Add new keys
src/app/deadline/_layout.tsx           - Add route
```
