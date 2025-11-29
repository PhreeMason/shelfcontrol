# ShelfControl Architecture

This document provides a comprehensive overview of the ShelfControl application architecture, patterns, and design decisions.

## Table of Contents

- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [Database Architecture](#database-architecture)
- [State Management](#state-management)
- [Service Layer](#service-layer)
- [Hook Patterns](#hook-patterns)
- [Query Key Architecture](#query-key-architecture)
- [Type System](#type-system)
- [Feature Implementation Examples](#feature-implementation-examples)

## Project Structure

```
shelfcontrol/
├── src/
│   ├── app/                    # Expo Router (file-based routing)
│   │   ├── (authenticated)/    # Protected routes (tabs, profile)
│   │   ├── (auth)/            # Auth screens (sign-in, sign-up, password reset)
│   │   └── deadline/          # Deadline management flows ([id], new, edit)
│   ├── components/            # UI Components
│   │   ├── features/          # Feature-specific (deadlines, notes, review, etc.)
│   │   ├── shared/            # Reusable shared components
│   │   ├── themed/            # Theme-aware components
│   │   ├── ui/                # Base UI components
│   │   ├── forms/             # Form components
│   │   ├── progress/          # Progress tracking components
│   │   ├── charts/            # Data visualization
│   │   ├── stats/             # Statistics display
│   │   └── navigation/        # Navigation components
│   ├── hooks/                 # Custom React hooks (use* pattern)
│   ├── services/              # Business logic & API layer
│   ├── providers/             # React Context providers
│   ├── lib/                   # Third-party integrations (Supabase, PostHog, dayjs)
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript definitions
│   ├── constants/             # App constants (database, query keys, status, routes)
│   ├── schemas/               # Validation schemas (Zod)
│   └── __tests__/            # Test setup and global mocks
├── supabase/
│   └── migrations/            # Database migrations
└── maestro/                   # E2E test flows
```

## Component Architecture

ShelfControl follows a **4-tier component hierarchy** to maintain clear separation of concerns and maximize reusability:

### 1. UI Components (`components/ui/`)
- Base building blocks (ToastConfig, etc.)
- No business logic
- Generic, application-agnostic
- Example: Base button, input components

### 2. Shared Components (`components/shared/`)
- Reusable across features
- Context-agnostic but application-aware
- Examples: Avatar, Checkbox, CustomInput, Typeahead, RadioGroup, LinearProgressBar
- Used by multiple features

### 3. Feature Components (`components/features/`)
- Domain-specific components
- Organized by feature domain:
  - `deadlines/` - Deadline cards, filters, lists
  - `notes/` - Note management (NoteFilterSheet, etc.)
  - `review/` - Review tracking (PlatformChecklist, ReviewProgressBar)
  - `completion/` - Book completion flow
  - `profile/` - User profile display
  - `calendar/` - Calendar views
- Contains feature-specific business logic
- Can use shared components

### 4. Page Components (`app/`)
- Route-level components
- Compose features and handle navigation
- Minimal logic, mostly composition

### Routing Pattern (Expo Router)

- **File-based routing**: Pages defined by file location in `app/` directory
- **Route groups**:
  - `(authenticated)` - Protected routes requiring auth
  - `(auth)` - Public authentication routes
  - `deadline` - Deadline management screens
- **Dynamic routes**: `deadline/[id]/` for detail views
- **Layout files**: `_layout.tsx` for nested navigation structure

## Database Architecture

### Supabase Configuration

**Client Setup** (`src/lib/supabase.ts`):
- Custom `LargeSecureStore` for secure session storage
- AES encryption for sensitive data
- Platform-specific storage (SecureStore on native, localStorage on web)
- Auto-refresh tokens enabled

### Database Schema

**Core Tables** (`src/constants/database.ts`):

```typescript
profiles              # User profiles
books                 # Book metadata
deadlines            # Reading deadlines
deadline_progress    # Progress tracking (one-to-many with deadlines)
deadline_status      # Status history (one-to-many with deadlines)
deadline_notes       # Reading notes
deadline_contacts    # Related contacts
tags                 # User-defined tags
deadline_tags        # Tag associations
hashtags             # Extracted hashtags
note_hashtags        # Note-hashtag relationships
disclosure_templates # ARC disclosure templates
review_tracking      # Review tracking metadata
review_platforms     # Platform-specific review status
user_activities      # Activity logging
```

### Critical Database Patterns

#### 1. Status Storage Pattern

**CRITICAL**: Status is NOT stored on the `deadlines` table. Instead, it's maintained in a separate `deadline_status` table for complete history tracking.

**Implications**:
- All status queries MUST JOIN with `deadline_status` table
- Queries must order by `created_at DESC` and take the first record for current status
- Never assume a `status` field exists on deadline records

**Example Query**:
```typescript
SELECT d.*, ds.status
FROM deadlines d
LEFT JOIN LATERAL (
  SELECT status
  FROM deadline_status
  WHERE deadline_id = d.id
  ORDER BY created_at DESC
  LIMIT 1
) ds ON true
```

#### 2. Progress Tracking Pattern

- Multiple progress entries per deadline (timeline)
- Sorted by `created_at` (oldest first for timeline, latest for current)
- Latest entry = current progress
- Enables progress history and visualization

#### 3. Type Generation

- Database types auto-generated from Supabase schema
- Command: `npm run genTypes`
- Output: `src/types/database.types.ts`
- Always regenerate after schema changes

## State Management

ShelfControl uses a **multi-layer state management architecture**:

### Layer 1: TanStack React Query (Primary Data Cache)

- Global server state management
- Automatic cache invalidation
- Optimistic updates
- Request deduplication
- Query client initialized in `app/_layout.tsx`

### Layer 2: React Context Providers

#### 1. AuthProvider (`providers/AuthProvider.tsx`)
- Session management
- Profile state
- Auth operations (signIn, signUp, signOut)
- Navigation logic based on auth state
- PostHog user identification

#### 2. DeadlineProvider (`providers/DeadlineProvider.tsx`)
- Wraps React Query hooks
- Provides computed deadline lists:
  - Active deadlines
  - Overdue deadlines
  - Completed deadlines
  - To review deadlines
- User pace calculations (reading & audiobook)
- Deadline calculation utilities
- Analytics tracking on mutations

#### 3. PreferencesProvider (`providers/PreferencesProvider.tsx`)
- UI preferences and filters
- Filter state (format, type, tags, status)
- Sort order
- Time range filters

#### 4. CompletionFlowProvider (`providers/CompletionFlowProvider.tsx`)
- Multi-step completion flow state
- Review tracking setup
- Form state management

## Service Layer

### Service Architecture Principles

1. **Single Responsibility**: One domain per service
2. **User Authorization**: All methods accept `userId` parameter
3. **Shared Supabase Client**: Import from `@/lib/supabase`
4. **Error Propagation**: Services throw errors, UI handles them
5. **Full TypeScript**: Use generated database types

### Available Services

```typescript
activityService         # User activity tracking
authService            # Authentication & sessions
booksService           # Book search & library
contactsService        # Contact management
deadlinesService       # CRUD for reading deadlines
disclosureTemplatesService  # ARC disclosures
exportService          # CSV export
hashtagsService        # Hashtag extraction & sync
notesService           # Reading notes
profileService         # User profiles
reviewTrackingService  # Review platform tracking
storageService         # File uploads
tagsService            # Tag management
```

### Critical Pattern: NEVER Call Services Directly

**All service calls MUST go through React Query hooks** to ensure:
- Proper cache management
- Consistent error handling
- Loading states
- Automatic UI updates

**Example Pattern**:

```typescript
// ❌ WRONG - Never do this
import { deadlinesService } from '@/services/deadlines.service';
const deadline = await deadlinesService.getDeadlineById(userId, id);

// ✅ CORRECT - Always use hooks
import { useGetDeadlineById } from '@/hooks/useDeadlines';
const { data: deadline, isLoading } = useGetDeadlineById(id);
```

See [REACT_QUERY_VIOLATIONS.md](./REACT_QUERY_VIOLATIONS.md) for detailed guidelines.

### Service → Hook → Component Flow

```typescript
// 1. Service Layer (deadlines.service.ts)
class DeadlinesService {
  async updateDeadlineStatus(userId: string, deadlineId: string, status: string) {
    // Validates transitions, updates DB
    const { data, error } = await supabase
      .from('deadline_status')
      .insert({ deadline_id: deadlineId, status });

    if (error) throw error;
    return data;
  }
}

// 2. Hook Layer (useDeadlines.ts)
export const useCompleteDeadline = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deadlineId: string) =>
      deadlinesService.completeDeadline(session.user.id, deadlineId),
    onSuccess: () => {
      // Invalidate all deadline queries to refresh cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DEADLINES.ALL(session.user.id)
      });
    }
  });
};

// 3. Component Layer
const MyComponent = () => {
  const { mutate: completeDeadline, isPending } = useCompleteDeadline();

  return (
    <Button
      onPress={() => completeDeadline(deadlineId)}
      disabled={isPending}
    >
      Complete
    </Button>
  );
};
```

## Hook Patterns

### Custom Hooks Organization

**Data Hooks** (React Query wrappers):
```typescript
useGetDeadlines()          # Fetch all deadlines
useGetDeadlineById(id)     # Fetch single deadline
useAddDeadline()           # Create deadline (mutation)
useUpdateDeadline()        # Update deadline (mutation)
useCompleteDeadline()      # Complete deadline (mutation)
useGetNotes(deadlineId)    # Fetch notes
useAddNote()               # Create note (mutation)
useGetTags()               # Fetch tags
```

**Computed/Utility Hooks**:
```typescript
useDeadlineCardViewModel() # Card display logic
useProgressInputViewModel()# Progress input calculations
useColorScheme()          # Theme detection
useThemeColor()           # Color resolution
useDebouncedInput()       # Debounced input values
useTodaysDeadlines()      # Filter today's items
```

**Analytics Hooks**:
```typescript
usePageTracking()         # Page view tracking
useAnalytics()            # Analytics helper
```

### Hook Naming Conventions

- `useGet*` - Data fetching queries (read operations)
- `useAdd*/useCreate*` - Create mutations
- `useUpdate*` - Update mutations
- `useDelete*` - Delete mutations
- `use*ViewModel` - Presentation logic
- `use*State` - Component-level state logic

## Query Key Architecture

All query keys are centralized in `src/constants/queryKeys.ts` for type safety and consistency:

```typescript
export const QUERY_KEYS = {
  DEADLINES: {
    ALL: (userId: string) => ['deadlines', userId],
    DETAIL: (userId: string, deadlineId: string) => ['deadline', userId, deadlineId],
    TYPES: (userId: string) => ['deadline', 'types', userId],
    PROGRESS: (userId: string) => ['deadline_progress', userId],
  },
  NOTES: {
    BY_DEADLINE: (userId: string, deadlineId: string) => ['notes', userId, deadlineId],
  },
  TAGS: {
    ALL: (userId: string) => ['tags', userId],
    BY_DEADLINE: (userId: string, deadlineId: string) => ['tags', userId, deadlineId],
  },
  HASHTAGS: {
    ALL: (userId: string) => ['hashtags', userId],
  },
  REVIEW_TRACKING: {
    BY_DEADLINE: (userId: string, deadlineId: string) => ['review_tracking', userId, deadlineId],
  },
};

export const MUTATION_KEYS = {
  DEADLINES: {
    ADD: 'addDeadline',
    UPDATE: 'updateDeadline',
    DELETE: 'deleteDeadline',
  },
};
```

### Benefits

- **Type-safe query keys**: TypeScript ensures correct parameters
- **Consistent invalidation**: Same key structure for queries and invalidation
- **Easy refactoring**: Change key structure in one place
- **Multi-tenant support**: All keys scoped by `userId`

### Query Invalidation Pattern

```typescript
// After mutation, invalidate related queries
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.DEADLINES.ALL(userId)
});

// Invalidate specific deadline and its related data
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.DEADLINES.DETAIL(userId, deadlineId)
});
queryClient.invalidateQueries({
  queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(userId, deadlineId)
});
```

## Type System

ShelfControl maintains strict TypeScript typing across the entire codebase.

### Type Organization

#### 1. Generated Types (`database.types.ts`)
- Auto-generated from Supabase schema
- Source of truth for database structure
- Regenerate with: `npm run genTypes`
- Never manually edit this file

#### 2. Domain Types

Located in `src/types/`:
```
deadline.types.ts      # Deadline domain models
notes.types.ts         # Note models
review.types.ts        # Review tracking
tags.types.ts          # Tag system
hashtags.types.ts      # Hashtag extraction
contacts.types.ts      # Contact management
disclosure.types.ts    # ARC disclosures
bookSearch.ts          # Book search results
progressInput.types.ts # Progress calculations
```

#### 3. Extended Types Pattern

Domain types extend database types with relationships and computed properties:

```typescript
// Import base type from generated file
import { Database } from './database.types';
type DeadlineRow = Database['public']['Tables']['deadlines']['Row'];
type DeadlineProgressRow = Database['public']['Tables']['deadline_progress']['Row'];
type DeadlineStatusRow = Database['public']['Tables']['deadline_status']['Row'];

// Extend with relations and computed properties
export interface ReadingDeadlineWithProgress extends DeadlineRow {
  progress: DeadlineProgressRow[];
  status: DeadlineStatusRow[];
  books?: {
    publisher?: string;
  };
}

// Add computed properties in hooks/utils
export interface DeadlineViewModel extends ReadingDeadlineWithProgress {
  daysLeft: number;
  isOverdue: boolean;
  currentStatus: string;
  currentProgress: number;
}
```

### Type Safety Best Practices

1. **Never use `any`** - Use `unknown` if type is truly unknown, then narrow
2. **Use generated database types** - Don't duplicate type definitions
3. **Extend, don't replace** - Build on database types for domain models
4. **Type service parameters** - All service methods fully typed
5. **Type hook returns** - Explicitly type React Query hooks

## Feature Implementation Examples

### Example 1: Notes Feature with Hashtags

The notes feature demonstrates multi-service coordination and automatic data synchronization.

#### Flow

1. User creates/edits note → `useAddNote()` / `useUpdateNote()`
2. Hook calls `notesService.addNote()` or `notesService.updateNote()`
3. On success, hook automatically calls `hashtagsService.syncNoteHashtags()`
4. Invalidates both notes and hashtags queries
5. UI updates automatically with new hashtags

#### Files Involved

- **Services**: `services/notes.service.ts`, `services/hashtags.service.ts`
- **Hooks**: `hooks/useNotes.ts`, `hooks/useHashtags.ts`
- **Types**: `types/notes.types.ts`, `types/hashtags.types.ts`
- **Components**: `components/features/notes/*`
- **Utils**: `utils/hashtagUtils.ts`

#### Code Example

```typescript
// Hook coordinates multiple services
export const useAddNote = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deadlineId, content }: AddNoteParams) => {
      // 1. Add note
      const note = await notesService.addNote(
        session.user.id,
        deadlineId,
        content
      );

      // 2. Sync hashtags
      await hashtagsService.syncNoteHashtags(
        session.user.id,
        note.id,
        content
      );

      return note;
    },
    onSuccess: (_, { deadlineId }) => {
      // 3. Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTES.BY_DEADLINE(session.user.id, deadlineId)
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.HASHTAGS.ALL(session.user.id)
      });
    }
  });
};
```

### Example 2: Deadline Feature

The deadline feature shows the complete data flow through all architectural layers.

#### Flow

1. **Fetch**: Component calls `useGetDeadlines()` (React Query hook)
2. **Provider**: `DeadlineProvider` wraps hook and computes derived state
3. **Consume**: Components use `useDeadlines()` hook to access deadlines
4. **Mutate**: User actions trigger `useAddDeadline()`, `useUpdateDeadline()`, etc.
5. **Refresh**: Automatic cache invalidation updates all related queries
6. **Analytics**: Provider tracks mutations via PostHog

#### Files Involved

- **Service**: `services/deadlines.service.ts`
- **Hooks**: `hooks/useDeadlines.ts`
- **Provider**: `providers/DeadlineProvider.tsx`
- **Types**: `types/deadline.types.ts`
- **Components**: `components/features/deadlines/*`
- **Utils**: `utils/deadlineUtils.ts`, `utils/deadlineCalculations.ts`, `utils/paceCalculations.ts`

#### Architecture Diagram

```
┌─────────────────┐
│   Component     │
│  (DeadlineCard) │
└────────┬────────┘
         │ useDeadlines()
         ↓
┌─────────────────────┐
│ DeadlineProvider    │
│ - Computed lists    │
│ - Pace calculations │
└────────┬────────────┘
         │ useGetDeadlines()
         ↓
┌─────────────────────┐
│  React Query Hook   │
│  - Cache            │
│  - Loading state    │
└────────┬────────────┘
         │ deadlinesService.getDeadlines()
         ↓
┌─────────────────────┐
│   Service Layer     │
│  - Business logic   │
│  - Validation       │
└────────┬────────────┘
         │ Supabase Client
         ↓
┌─────────────────────┐
│   Supabase DB       │
│  - deadlines        │
│  - deadline_status  │
│  - deadline_progress│
└─────────────────────┘
```

## UI Patterns & Anti-Patterns

### Modal Best Practices

**❌ NEVER nest React Native Modal components**

Nesting modals can cause critical touch responder issues where Pressable/TouchableOpacity components fail to respond to user input.

**Problem**: When multiple React modals dismiss simultaneously and navigation occurs in the same event loop tick, the new screen may render before the old modal's component tree is fully unmounted. This prevents React Native's touch responder system from properly initializing, resulting in non-functional buttons.

**Example of nested modals (DON'T DO THIS)**:
```typescript
// ❌ BAD: Nested modals
<Modal visible={outerModalVisible}>
  <Modal visible={innerModalVisible}>
    {/* Inner modal content */}
  </Modal>
</Modal>
```

**Solutions**:

1. **Use native Alert.alert() for simple confirmations**:
   ```typescript
   // ✅ GOOD: Native alert instead of custom modal
   Alert.alert(
     'Confirmation Title',
     'Are you sure?',
     [
       { text: 'Cancel', style: 'cancel' },
       { text: 'Confirm', onPress: handleConfirm },
     ]
   );
   ```

2. **Use state management to show modals sequentially**:
   ```typescript
   // ✅ GOOD: Single modal with state switching
   const [modalState, setModalState] = useState<'none' | 'step1' | 'step2'>('none');

   <Modal visible={modalState !== 'none'}>
     {modalState === 'step1' && <Step1Content />}
     {modalState === 'step2' && <Step2Content />}
   </Modal>
   ```

3. **Ensure modals fully dismiss before navigation**:
   ```typescript
   // ✅ GOOD: Wait for modal to close before navigating
   const handleComplete = () => {
     onClose(); // Close modal
     // Use setTimeout or onModalHide callback before navigation
     setTimeout(() => router.push('/next-screen'), 100);
   };
   ```

**Key Learnings**:
- Nested React modals interfere with touch event handling
- Native UI elements (`Alert.alert()`) are more reliable for simple confirmations
- Synchronous navigation after modal dismissal is risky
- Always test touch interactions when components render as initial screens vs. after state changes

### Division-by-Zero Guards

**Always guard division operations** to prevent crashes from edge cases like:
- New users with no reading history (`userPace = 0`)
- Books with 100% progress (`remaining = 0`)
- Deadlines with zero total quantity

**Pattern**:
```typescript
// ❌ BAD: Can produce Infinity or NaN
const percentage = (current / total) * 100;

// ✅ GOOD: Guard against zero denominator
const percentage = total > 0 ? (current / total) * 100 : 0;
```

**Common locations requiring guards**:
- Progress percentage calculations
- Pace calculations (pages/day, minutes/day)
- Slider/scrubber position calculations
- Statistical averages

See `docs/bugs/100-PERCENT-PROGRESS-CRASH.md` for a detailed case study.

## Summary

ShelfControl's architecture is built on these key principles:

1. **File-based routing** (Expo Router) for simplified navigation
2. **TanStack React Query** for centralized server state management
3. **Service layer pattern** for clean API separation
4. **Provider pattern** for domain state and computed values
5. **4-tier component hierarchy** for clear separation of concerns
6. **TypeScript-first** with generated database types
7. **Supabase BaaS** for auth, database, and storage
8. **Centralized constants** for maintainability
9. **Hook-based API** for all data operations
10. **Analytics integration** for product insights

This architecture provides a scalable, maintainable foundation with excellent developer experience and type safety throughout.
