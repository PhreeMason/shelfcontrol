# Services Documentation

This directory contains all business logic and API services for ShelfControl. Services handle communication with Supabase and encapsulate complex operations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Review Tracking Services](#review-tracking-services)
- [Deadline Services](#deadline-services)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Architecture Overview

### Service Layer Principles

1. **Single Responsibility**: Each service handles one domain (deadlines, reviews, auth, etc.)
2. **User Authorization**: All methods accept `userId` and validate ownership
3. **Supabase Client**: All services use the shared Supabase client from `@/lib/supabase`
4. **Error Propagation**: Services throw errors; UI components handle them
5. **Type Safety**: Full TypeScript coverage with generated database types
6. **CRITICAL - React Query Integration**: Services must NEVER be called directly from components (see below)

### React Query Integration - CRITICAL

**IMPORTANT: Services must NEVER be called directly from components or pages.**

All service calls must go through React Query hooks to ensure proper cache management and data consistency.

#### AVOID - Direct Service Call (Wrong Pattern)

```typescript
// In a component
const handleSubmit = async () => {
  try {
    await deadlinesService.updateDeadlineStatus(userId, deadlineId, 'complete');
    router.back();
  } catch (error) {
    console.error(error);
  }
};
```

**Problem:** Cache is not invalidated, causing stale data and UI inconsistencies.

#### RECOMMENDED - Use React Query Hook (Correct Pattern)

```typescript
// In hooks/useDeadlines.ts
export const useCompleteDeadline = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [MUTATION_KEYS.DEADLINES.COMPLETE],
    mutationFn: async (deadlineId: string) => {
      if (!userId) throw new Error('User not authenticated');
      return deadlinesService.completeDeadline(userId, deadlineId);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DEADLINES.ALL(userId),
        });
      }
    },
  });
};

// In component
const { mutate: completeDeadline } = useCompleteDeadline();

const handleSubmit = () => {
  completeDeadline(deadlineId, {
    onSuccess: () => router.back(),
    onError: (error) => showToast('Error', error.message),
  });
};
```

**Benefits:**
- Cache automatically invalidated
- UI updates immediately
- Loading/error states managed
- Optimistic updates possible
- Request deduplication
- Automatic retries

#### Exceptions

**Authentication code is exempt from this requirement:**
- `AuthProvider.tsx` - Manages auth state below React Query layer
- `AppleSSO.tsx` and other auth components - Part of auth flow

All other components MUST use React Query hooks.

See `REACT_QUERY_VIOLATIONS.md` for detailed examples and migration guide.

---

### Database Architecture - Critical Concepts

#### Status Storage Pattern

**IMPORTANT**: Deadline status is NOT stored directly on the `deadlines` table.

```typescript
// Status lives in a separate table
deadlines {
  id, book_title, deadline_date, ...
  // NO status field here
}

deadline_status {
  id,
  deadline_id,  // Foreign key to deadlines
  status        // 'pending' | 'reading' | 'to_review' | 'complete' | 'did_not_finish'
}
```

**All status queries require a JOIN:**

```typescript
// Correct way to query deadlines with status
const { data } = await supabase
  .from('deadlines')
  .select(`
    *,
    status:deadline_status(*)
  `)
  .eq('user_id', userId);
```

#### Status Values

```typescript
type DeadlineStatus =
  | 'pending'           // Queued for reading
  | 'reading'           // Currently reading (UI shows "Active")
  | 'to_review'         // Finished reading, posting reviews
  | 'complete'          // All done
  | 'did_not_finish';   // DNF

// Note: 'paused' was removed from the system
```

#### Overdue Calculation

**Overdue is NOT a database status** - it's a runtime calculation:

```typescript
// Overdue logic
const isOverdue = (deadline) => {
  const hasReadingStatus = deadline.status[0]?.status === 'reading';
  const isPastDeadline = new Date(deadline.deadline_date) < new Date();
  return hasReadingStatus && isPastDeadline;
};

// UI shows "Overdue" badge on Active items, not a separate status
```

#### Status Transitions

Valid transitions enforced by `deadlinesService.updateDeadlineStatus()`:

```
pending → reading

reading → to_review
       → complete (skip review)
       → did_not_finish

to_review → complete
          → did_not_finish

complete → (terminal)
did_not_finish → (terminal)
```

## Database Schema

### Review Tracking Tables

#### `review_tracking`

Stores review deadline and completion metadata (one-to-one with deadlines).

```typescript
{
  id: string;
  deadline_id: string;              // FK to deadlines.id (UNIQUE)
  review_due_date: string | null;   // Optional review deadline
  needs_link_submission: boolean;   // Whether user needs to submit URLs
  all_reviews_complete: boolean;    // Completion flag
  created_at: string;
  updated_at: string;
}
```

#### `review_platforms`

Tracks posting status for individual platforms (one-to-many with review_tracking).

```typescript
{
  id: string;
  review_tracking_id: string;       // FK to review_tracking.id
  platform_name: string;            // "NetGalley", "Goodreads", "My Blog", etc.
  posted: boolean;                  // Whether review has been posted
  posted_date: string | null;       // When it was posted
  review_url: string | null;        // Optional link to review
  created_at: string;
  updated_at: string;
}
```

**Platform Types:**
- Preset: NetGalley, Goodreads, Amazon, Instagram, TikTok, Twitter/X, Facebook, YouTube
- Custom: User-defined strings (e.g., "My Blog", "Substack", "BookBub")

**No required/optional distinction** - all platforms treated equally for completion percentage.

#### Review Notes Integration

Review notes are stored in the existing `deadline_notes` table:

```typescript
deadline_notes {
  id: string;
  deadline_id: string;
  note_text: string;                // Review thoughts
  deadline_progress: number;        // Numeric progress when note created (e.g., 245)
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

When users add review notes during setup, a `deadline_notes` entry is created with the current progress value.

### Status Flow Diagram

```
+---------+     +--------+     +-----------+     +-----------+
| Pending | --> | Reading| --> | To Review | --> | Completed |
+---------+     +--------+     +-----------+     +-----------+
                    |                |
                    |                +---------> +-----+
                    |                             | DNF |
                    +-------------------------+-----+

Alternate Flows:
- Reading -> Completed (skip review tracking)
- Reading -> DNF (quit early)
- To Review -> DNF (decided not to finish after reviewing partial)

Note: Overdue is shown on Reading items, not a separate status
```

## Review Tracking Services

### `reviewTrackingService.createReviewTracking()`

Initializes review tracking for a deadline, optionally creating a review note.

**Signature:**
```typescript
async createReviewTracking(
  userId: string,
  params: CreateReviewTrackingParams
): Promise<{ review_tracking_id: string }>
```

**Parameters:**
```typescript
interface CreateReviewTrackingParams {
  deadline_id: string;
  review_due_date?: string;          // ISO date string, optional
  needs_link_submission: boolean;
  review_notes?: string;             // Saved to deadline_notes table
  platforms: { name: string }[];     // Min 1 platform required
}
```

**Behavior:**
1. Validates user owns the deadline
2. Checks review tracking doesn't already exist
3. Creates `review_tracking` record
4. Creates `review_platforms` records for all platforms
5. If `review_notes` provided:
   - Fetches current progress from `deadline_progress`
   - Creates entry in `deadline_notes` with progress snapshot
6. Returns `review_tracking_id`

**Errors:**
- `"At least one platform must be selected"` - Empty platforms array
- `"Deadline not found or access denied"` - Invalid deadline or wrong user
- `"Review tracking already exists for this deadline"` - Duplicate creation attempt

**Example:**
```typescript
const result = await reviewTrackingService.createReviewTracking(userId, {
  deadline_id: 'rd_123',
  review_due_date: '2025-10-30',
  needs_link_submission: true,
  review_notes: 'Great romantic tension, loved the banter!',
  platforms: [
    { name: 'NetGalley' },
    { name: 'Goodreads' },
    { name: 'My Blog' }
  ]
});
// Returns: { review_tracking_id: 'rt_456' }
```

### `reviewTrackingService.updateReviewPlatforms()`

Batch updates platform posted status and URLs.

**Signature:**
```typescript
async updateReviewPlatforms(
  userId: string,
  reviewTrackingId: string,
  params: UpdateReviewPlatformsParams
): Promise<{ completion_percentage: number }>
```

**Parameters:**
```typescript
interface UpdateReviewPlatformsParams {
  platforms: {
    id: string;           // Platform record ID
    posted: boolean;
    review_url?: string;  // Optional URL
  }[];
}
```

**Behavior:**
1. Validates user owns the review tracking (via deadline relationship)
2. Updates each platform:
   - Sets `posted` status
   - Sets `posted_date` to current timestamp if `posted === true`
   - Updates `review_url` if provided
3. Recalculates completion percentage across all platforms
4. Returns completion percentage

**Calculation:**
```typescript
const totalPlatforms = platforms.length;
const postedPlatforms = platforms.filter(p => p.posted).length;
const completion_percentage = Math.round((postedPlatforms / totalPlatforms) * 100);
```

**Errors:**
- `"Review tracking not found"` - Invalid reviewTrackingId
- `"Review tracking not found or access denied"` - Wrong user

**Example:**
```typescript
const result = await reviewTrackingService.updateReviewPlatforms(
  userId,
  'rt_456',
  {
    platforms: [
      { id: 'rp_001', posted: true, review_url: 'https://netgalley.com/review/123' },
      { id: 'rp_002', posted: true }
    ]
  }
);
// Returns: { completion_percentage: 67 }
```

### `reviewTrackingService.getReviewTrackingByDeadline()`

Fetches review tracking data for a specific deadline.

**Signature:**
```typescript
async getReviewTrackingByDeadline(
  userId: string,
  deadlineId: string
): Promise<ReviewTrackingResponse | null>
```

**Returns:**
```typescript
interface ReviewTrackingResponse {
  review_tracking: {
    id: string;
    deadline_id: string;
    review_due_date: string | null;
    needs_link_submission: boolean;
    all_reviews_complete: boolean;
  };
  platforms: {
    id: string;
    platform_name: string;
    posted: boolean;
    posted_date: string | null;
    review_url: string | null;
  }[];
  completion_percentage: number;
}
```

**Behavior:**
1. Validates user owns the deadline
2. Fetches review_tracking record
3. Fetches all associated platforms
4. Calculates completion percentage
5. Returns null if no review tracking exists (not an error)

**Errors:**
- `"Deadline not found or access denied"` - Invalid deadline or wrong user
- Returns `null` for missing review tracking (PGRST116 error code)

**Example:**
```typescript
const tracking = await reviewTrackingService.getReviewTrackingByDeadline(
  userId,
  'rd_123'
);
```

## Deadline Services

### `deadlinesService.updateDeadlineStatus()`

Updates deadline status with validation of allowed transitions.

**Signature:**
```typescript
async updateDeadlineStatus(
  userId: string,
  deadlineId: string,
  status: 'complete' | 'to_review' | 'reading' | 'did_not_finish' | 'pending'
): Promise<ReadingDeadlineWithProgress>
```

**Status Transition Validation:**

```typescript
const validTransitions = {
  pending: ['reading'],
  reading: ['to_review', 'complete', 'did_not_finish'],
  to_review: ['complete', 'did_not_finish'],
  complete: [],
  did_not_finish: []
};
```

**Behavior:**
1. Fetches deadline with current status (requires JOIN with deadline_status)
2. Validates transition is allowed
3. Updates status in `deadline_status` table
4. Logs activity event
5. Returns updated deadline with joined status and progress

**Important:** Status update occurs in `deadline_status` table via JOIN:

```typescript
// Updates happen here
await supabase
  .from('deadline_status')
  .update({ status, updated_at: new Date().toISOString() })
  .eq('deadline_id', deadlineId);
```

**Errors:**
- `"Deadline not found or access denied"` - Invalid deadline or wrong user
- `"Invalid status transition from {current} to {new}"` - Blocked transition

**Example:**
```typescript
// Valid: Move from reading to to_review
const deadline = await deadlinesService.updateDeadlineStatus(
  userId,
  'rd_123',
  'to_review'
);

// Invalid: Would throw error
await deadlinesService.updateDeadlineStatus(
  userId,
  'rd_123',
  'pending'  // Can't go from to_review back to pending
);
// Error: "Invalid status transition from to_review to pending"
```

## Error Handling

### Service Error Patterns

All services throw errors that should be caught by UI components:

```typescript
// Service layer - throws errors
async createReviewTracking(userId, params) {
  if (!platforms.length) {
    throw new Error('At least one platform must be selected');
  }
  // ...
}

// UI layer - catches and handles
try {
  await reviewTrackingService.createReviewTracking(userId, params);
  showToast('Review tracking set up!');
} catch (error) {
  if (error.message.includes('platform')) {
    showError('Please select at least one platform');
  } else {
    showError('Failed to set up review tracking');
  }
}
```

### Common Error Codes

- `PGRST116` - Record not found (Supabase Postgrest error)
- 403 - Unauthorized (RLS policy violation)
- 400 - Validation error (bad request)

## Usage Examples

### Complete Review Tracking Flow

```typescript
// 1. User finishes reading a book
const deadline = await deadlinesService.getDeadlineById(userId, deadlineId);

// 2. Set up review tracking
const { review_tracking_id } = await reviewTrackingService.createReviewTracking(
  userId,
  {
    deadline_id: deadlineId,
    review_due_date: '2025-11-01',
    needs_link_submission: true,
    review_notes: 'Strong characters, weak plot. 3.5 stars.',
    platforms: [
      { name: 'NetGalley' },
      { name: 'Goodreads' },
      { name: 'Instagram' }
    ]
  }
);

// 3. Update deadline status to to_review
await deadlinesService.updateDeadlineStatus(userId, deadlineId, 'to_review');

// 4. User posts reviews to platforms
const tracking = await reviewTrackingService.getReviewTrackingByDeadline(
  userId,
  deadlineId
);

const netGalleyPlatform = tracking.platforms.find(p => p.platform_name === 'NetGalley');

await reviewTrackingService.updateReviewPlatforms(
  userId,
  review_tracking_id,
  {
    platforms: [
      {
        id: netGalleyPlatform.id,
        posted: true,
        review_url: 'https://netgalley.com/review/12345'
      }
    ]
  }
);
// Returns: { completion_percentage: 33 }

// 5. Mark all platforms as posted
await reviewTrackingService.updateReviewPlatforms(
  userId,
  review_tracking_id,
  {
    platforms: tracking.platforms.map(p => ({
      id: p.id,
      posted: true
    }))
  }
);
// Returns: { completion_percentage: 100 }

// 6. Mark deadline as complete
await deadlinesService.updateDeadlineStatus(userId, deadlineId, 'complete');
```

### Querying Deadlines by Status

```typescript
// Get all "To Review" deadlines
const { data: toReviewDeadlines } = await supabase
  .from('deadlines')
  .select(`
    *,
    progress:deadline_progress(*),
    status:deadline_status(*)
  `)
  .eq('user_id', userId)
  .eq('status.status', 'to_review')  // Note: status comes from joined table
  .order('created_at', { ascending: false });

// Get overdue deadlines (runtime calculation)
const { data: allActiveDeadlines } = await supabase
  .from('deadlines')
  .select(`
    *,
    status:deadline_status(*)
  `)
  .eq('user_id', userId)
  .eq('status.status', 'reading');

const overdueDeadlines = allActiveDeadlines.filter(d =>
  new Date(d.deadline_date) < new Date()
);
```

### Smart Platform Defaults

```typescript
// Apply smart defaults based on deadline source
const getDefaultPlatforms = (deadline) => {
  switch (deadline.source) {
    case 'NetGalley':
      return [{ name: 'NetGalley' }, { name: 'Goodreads' }];
    case 'Publisher ARC':
      return [{ name: 'Goodreads' }];
    case 'Library':
    case 'Personal':
    default:
      return [];
  }
};

const platforms = getDefaultPlatforms(deadline);
await reviewTrackingService.createReviewTracking(userId, {
  deadline_id: deadline.id,
  platforms,
  needs_link_submission: deadline.source === 'NetGalley'
});
```

## Testing

All service methods should be tested with mocked Supabase client:

```typescript
import { reviewTrackingService } from '../reviewTracking.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('reviewTrackingService.createReviewTracking', () => {
  it('creates review tracking with platforms', async () => {
    const mockSupabase = supabase as jest.Mocked<typeof supabase>;
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'rd_123' }, error: null })
    });

    const result = await reviewTrackingService.createReviewTracking(
      'user_123',
      {
        deadline_id: 'rd_123',
        needs_link_submission: false,
        platforms: [{ name: 'Goodreads' }]
      }
    );

    expect(result).toHaveProperty('review_tracking_id');
  });
});
```

## Service Index

- `activityService` - User activity tracking
- `authService` - Authentication and session management
- `booksService` - Book search and library management
- `deadlinesService` - Reading deadline CRUD operations
- `exportService` - CSV export functionality
- `notesService` - Reading notes management
- `profileService` - User profile management
- `reviewTrackingService` - Review tracking and platform management
- `storageService` - File upload and storage

For implementation details, see individual service files in this directory.
