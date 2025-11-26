# Review Tracking Error Investigation

**Date**: 2025-11-26
**User Email**: `9dhvvszz85@privaterelay.appleid.com`
**Reported Issue**: User repeatedly seeing "Failed to set up review tracking. Please try again."

---

## Investigation Results

**Correct User**: `hellohannahmurray@gmail.com` (ID: `76212ed1-5044-4411-a4f3-31d137b1cbcd`)
**Book**: "Feasting For Thanks" (deadline: `rd_480909f6-7630-4110-aa66-2f7446586134`)

### Timeline
- Report time: Nov 26, 2025 ~2:28 AM EST (~07:28 UTC)
- Review tracking created: `2025-11-26 07:22:59` UTC
- Deadline completed: `2025-11-26 07:25:59` UTC

### Finding
The user **eventually succeeded** - review tracking exists for "Feasting For Thanks". They have 3 successful review tracking records total.

### Screenshot Evidence
![Error Screenshot](screenshot-review-tracking-error.png)

User description: "Tried to update the book by clicking I'm Done Reading. It let me update the book but wouldn't save the review stage. It was happy to save it without the review stage."

### Critical Discovery: No PostHog Error Event
The event `review_tracking_creation_failed` has **NEVER been recorded** in PostHog. This is suspicious because:

1. The hook (`useReviewTracking.ts` line 82-89) has `onError` that calls `analytics.track('review_tracking_creation_failed', ...)`
2. The component (`CompletionFormStep3.tsx` line 241-249) has its own `onError` that shows the toast
3. React Query should call BOTH handlers

**Possible explanations:**
1. Error occurs BEFORE mutation starts (validation, auth check fails early)
2. Analytics not initialized when error fires
3. The error is thrown synchronously before async mutation begins
4. Network completely down (can't send analytics either)

**Conclusion**: User experienced transient failures. The fix to show actual error messages will help diagnose future issues. Additionally, we should ensure analytics tracking is robust.

---

## Root Cause Analysis

The component `CompletionFormStep3.tsx` catches errors but discards the actual error message, showing a generic message instead. The service throws meaningful errors like:
- "Review tracking already exists for this deadline"
- "Deadline not found or access denied"
- "User not authenticated"

But users never see them.

---

## Diagnostic SQL Queries

Run these queries to investigate the user's situation:

### 1. Find the user's profile

```sql
SELECT id, email, created_at
FROM profiles
WHERE email = '9dhvvszz85@privaterelay.appleid.com';
```

### 2. Get the user's deadlines (replace USER_ID from query 1)

```sql
SELECT
  d.id,
  d.book_title,
  d.created_at,
  d.deadline_date,
  ds.status as current_status
FROM deadlines d
LEFT JOIN LATERAL (
  SELECT status
  FROM deadline_status
  WHERE deadline_id = d.id
  ORDER BY created_at DESC
  LIMIT 1
) ds ON true
WHERE d.user_id = 'USER_ID_HERE'
ORDER BY d.created_at DESC
LIMIT 20;
```

### 3. Check if user has any review tracking records

```sql
SELECT
  rt.id as review_tracking_id,
  rt.deadline_id,
  rt.review_due_date,
  rt.needs_link_submission,
  rt.all_reviews_complete,
  rt.created_at,
  d.book_title
FROM review_tracking rt
JOIN deadlines d ON d.id = rt.deadline_id
WHERE d.user_id = 'USER_ID_HERE'
ORDER BY rt.created_at DESC;
```

### 4. Check for duplicate review tracking attempts (most likely cause)

```sql
-- Find deadlines that already have review tracking
-- If user tried to create review tracking for these, they'd get the error
SELECT
  d.id as deadline_id,
  d.book_title,
  rt.id as existing_review_tracking_id,
  rt.created_at as review_tracking_created
FROM deadlines d
JOIN review_tracking rt ON rt.deadline_id = d.id
WHERE d.user_id = 'USER_ID_HERE';
```

### 5. Check recent deadline status changes (to see completion flow)

```sql
SELECT
  ds.deadline_id,
  d.book_title,
  ds.status,
  ds.created_at as status_changed_at
FROM deadline_status ds
JOIN deadlines d ON d.id = ds.deadline_id
WHERE d.user_id = 'USER_ID_HERE'
ORDER BY ds.created_at DESC
LIMIT 30;
```

### 6. Check user_activities for review tracking errors (if logged)

```sql
SELECT
  activity_type,
  metadata,
  created_at
FROM user_activities
WHERE user_id = 'USER_ID_HERE'
  AND (activity_type LIKE '%review%' OR metadata::text LIKE '%review%')
ORDER BY created_at DESC
LIMIT 20;
```

---

## Likely Scenarios

### Scenario A: Duplicate Review Tracking (Most Likely)
- User completed a book and created review tracking
- User somehow got back to the completion flow (back button, refresh, etc.)
- User tried to create review tracking again
- Service rejects with "Review tracking already exists for this deadline"
- UI shows generic "Failed to set up review tracking"

**Evidence**: Query 4 shows deadlines with existing review_tracking records

### Scenario B: Session/Auth Issue
- User's session expired mid-flow
- RLS policy check fails silently
- Generic error shown

**Evidence**: Would need to check app logs or PostHog for auth-related errors

### Scenario C: Invalid Deadline State
- Deadline was deleted or user lost access
- Service throws "Deadline not found or access denied"

**Evidence**: Query 2 shows missing or unexpected deadlines

---

## Proposed Fix

### 1. Show actual error messages to users

```typescript
// In CompletionFormStep3.tsx error handlers
Toast.show({
  type: 'error',
  text1: 'Error',
  text2: error.message || 'Failed to set up review tracking. Please try again.',
});
```

### 2. Auto-redirect on duplicate

```typescript
onError: error => {
  if (error.message?.includes('already exists')) {
    Toast.show({
      type: 'info',
      text1: 'Review tracking exists',
      text2: 'Switching to edit mode...',
    });
    router.replace(`/deadline/${deadline.id}/edit-review-tracking`);
    return;
  }
  // ... show actual error
}
```

### 3. Use existing utilities from reviewFormUtils.ts

Import `createReviewTrackingErrorToast()`, `validatePlatformSelection()`, etc. to reduce redundant code.

---

## Files to Modify

1. `src/components/forms/CompletionFormStep3.tsx` - Main changes
