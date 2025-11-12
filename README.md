# ShelfControl

A React Native application for tracking reading deadlines and managing book progress. Built with Expo and TypeScript.

## Features

- **Reading Deadline Management**: Track reading deadlines with progress tracking and status history
- **Book Search & Library**: Search and add books with metadata from external APIs
- **Notes & Hashtags**: Take notes on deadlines with automatic hashtag extraction and filtering
- **Calendar Integration**: Calendar view of deadlines and reading schedule
- **Review Tracking**: Track reviews across multiple platforms (Amazon, Goodreads, BookBub, etc.)
- **Contact Management**: Associate contacts with deadlines
- **Disclosure Templates**: ARC disclosure template management
- **Progress Visualization**: Charts and analytics for reading progress
- **Tags & Organization**: User-defined tags for categorizing deadlines
- **User Authentication**: Secure authentication with Apple Sign-In
- **Activity Tracking**: Complete history of user actions

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase
- **State Management**: TanStack React Query
- **Testing**: Jest with React Native Testing Library
- **Styling**: React Native StyleSheet
- **Authentication**: Supabase Auth with Apple Sign-In

## Development Setup

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see configuration section)

4. Start the development server:
   ```bash
   npm start
   ```

### Development Commands

```bash
# Development
npm start                    # Start Expo development server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npm run web                 # Run on web

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint issues
npm run typecheck           # Run TypeScript compiler check
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting

# Testing
npm run test                # Run all tests
npm run test:ff             # Run tests with fail-fast
npm run test:coverage       # Run tests with coverage report
npm run test:coverage:watch # Run tests with coverage in watch mode
npm run test:debug          # Run tests with debugging info

# Build & Deploy
npm run prebuild            # Clean prebuild
npm run build:android       # Build Android app
npm run build:ios           # Build iOS app
npm run build:local         # Build Android locally
npm run submit:ios          # Submit iOS build to App Store
```

## Project Structure

```
src/
├── app/                    # File-based routing (Expo Router)
│   ├── (authenticated)/    # Protected routes
│   ├── (auth)/            # Authentication screens
│   └── deadline/          # Deadline management screens
├── components/            # Reusable UI components
│   ├── features/          # Feature-specific components
│   ├── navigation/        # Navigation components
│   ├── shared/           # Shared UI components
│   └── themed/           # Themed components
├── hooks/                # Custom React hooks
├── services/             # API and business logic
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── constants/            # App constants
└── __tests__/           # Test configuration and global mocks
```

## Testing

This project maintains comprehensive test coverage for utilities, services, and components. For detailed testing guidelines and best practices, see [TESTING.md](./TESTING.md).

**Current Coverage**: 16.46% overall
- Utilities: 98-100% coverage
- Services: 72.91% coverage (books, auth, deadlines, profile, storage)
- Target: 80% overall coverage

### Running Tests

```bash
npm run test:coverage       # Generate coverage report
open coverage/lcov-report/index.html  # View HTML coverage report
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database

This project uses Supabase for:
- User authentication
- Data persistence
- Real-time subscriptions
- File storage

Generate TypeScript types from your Supabase schema:
```bash
npm run genTypes
```

## Dev Rules to Follow

These rules ensure code quality, consistency, and maintainability across the codebase.

### React Query Patterns (CRITICAL)

1. **NEVER call services directly from components**
   ```typescript
   // ❌ WRONG
   import { deadlinesService } from '@/services/deadlines.service';
   const deadline = await deadlinesService.getDeadlineById(userId, id);

   // ✅ CORRECT
   import { useGetDeadlineById } from '@/hooks/useDeadlines';
   const { data: deadline } = useGetDeadlineById(id);
   ```

2. **Always invalidate queries after mutations**
   ```typescript
   useMutation({
     mutationFn: createDeadline,
     onSuccess: () => {
       queryClient.invalidateQueries({
         queryKey: QUERY_KEYS.DEADLINES.ALL(userId)
       });
     }
   });
   ```

3. **Use centralized query keys** from `constants/queryKeys.ts`

4. **Exception**: Auth-related code (AuthProvider, auth components) may call auth service directly

See [REACT_QUERY_VIOLATIONS.md](./REACT_QUERY_VIOLATIONS.md) for detailed guidelines.

### Component Organization

1. **Follow the 4-tier hierarchy**:
   - `components/ui/` - Base components (no business logic)
   - `components/shared/` - Reusable across features
   - `components/features/` - Feature-specific (organized by domain)
   - `app/` - Page-level route components

2. **Naming conventions**:
   - Components: PascalCase (`DeadlineCard.tsx`)
   - Files: PascalCase for components, camelCase for utilities
   - Hooks: camelCase with `use` prefix (`useDeadlines.ts`)

3. **File structure**:
   ```
   components/features/deadlines/
   ├── DeadlineCard.tsx           # Main component
   ├── DeadlineCardViewModel.ts    # Presentation logic
   └── __tests__/
       └── DeadlineCard.test.tsx   # Tests colocated
   ```

### Type Safety Requirements

1. **Always use generated database types**
   ```typescript
   // ✅ CORRECT
   import { Database } from '@/types/database.types';
   type DeadlineRow = Database['public']['Tables']['deadlines']['Row'];
   ```

2. **Extend types, don't duplicate**
   ```typescript
   // ✅ CORRECT - Extend base types
   interface ReadingDeadlineWithProgress extends DeadlineRow {
     progress: DeadlineProgressRow[];
   }
   ```

3. **Never use `any`** - Use `unknown` and type narrowing if needed

4. **Run typecheck before commits**: `npm run typecheck`

5. **Regenerate types after schema changes**: `npm run genTypes`

### Testing Requirements

1. **Write tests for all new features**:
   - Utilities: 98-100% coverage required
   - Services: 85% coverage target
   - Components: Test critical user flows

2. **Test file location**: Colocate in `__tests__/` folders
   ```
   utils/
   ├── deadlineUtils.ts
   └── __tests__/
       └── deadlineUtils.test.ts
   ```

3. **Run tests before commits**:
   ```bash
   npm run test:ff        # Run with fail-fast
   npm run test:coverage  # Check coverage
   ```

4. **Mock external dependencies**:
   - Use fixtures from `src/__fixtures__/`
   - Mock Supabase client for service tests

### Pre-Commit Checklist

Before committing code, ensure:

- [ ] Code formatted: `npm run format`
- [ ] No linting errors: `npm run lint`
- [ ] Types check: `npm run typecheck`
- [ ] Tests pass: `npm run test`
- [ ] Coverage meets requirements (if applicable)
- [ ] No direct service calls (use hooks)
- [ ] Query keys centralized in `constants/queryKeys.ts`
- [ ] New features have tests
- [ ] Documentation updated (if needed)

### Additional Best Practices

- **Constants over magic values**: Use `constants/` files
- **Error handling**: Services throw, UI displays to user
- **Analytics**: Track important user actions via PostHog
- **Date handling**: Always use `dateNormalization.ts` helpers for server dates
- **ID generation**: Use `generateId()` with appropriate prefixes

## Architecture

ShelfControl uses a modern React Native architecture with clear separation of concerns. For comprehensive architectural documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### High-Level Overview

- **File-based Routing**: Expo Router for simplified navigation
- **Component Hierarchy**: 4-tier system (UI → Shared → Features → Pages)
- **State Management**: TanStack React Query for server state, React Context for app state
- **Service Layer**: Business logic isolated in service classes
- **Type Safety**: Full TypeScript with auto-generated Supabase types
- **Testing**: Jest + React Native Testing Library (85% coverage target)

### Core Architectural Patterns

#### Data Flow

```
Component → Custom Hook → React Query → Service → Supabase
              ↓
         Cache & Invalidation
              ↓
         Auto UI Updates
```

#### Key Principles

1. **Never call services directly** - Always use React Query hooks
2. **Centralized query keys** - All query keys in `constants/queryKeys.ts`
3. **Provider pattern** - Domain logic in providers (Auth, Deadline, Preferences)
4. **Type-first** - Use generated database types, extend for domain models
5. **Hook-based API** - Custom hooks for all data operations

For detailed patterns, database schema, and implementation examples, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Performance

- Code splitting with dynamic imports
- Optimized bundle size with tree shaking
- Image optimization with expo-image
- Efficient re-renders with React.memo and useMemo

## Date & Time Handling

All timestamp fields from Supabase (e.g. `created_at`, `updated_at`, status/progress record timestamps) are stored in UTC. The application normalizes these values to the user's local timezone through a dedicated normalization layer located in `src/utils/dateNormalization.ts`.

Strategy:
- Date-Time strings (contain a time component / ISO like `2025-09-16T10:30:00Z`): Parsed as UTC then converted immediately to local time.
- Date-only strings (`YYYY-MM-DD` such as `deadline_date` or certain book metadata): Treated as pure local calendar dates (no timezone shifting) to avoid off-by-one errors around midnight boundaries.
- All calendar-based calculations (e.g. days left, overdue checks, monthly completion counts) operate on local `startOf('day')` values.
- New timestamps sent to the backend use `new Date().toISOString()` ensuring UTC storage consistency.

Key Helpers (import from `dateNormalization`):
- `isDateOnly(value)` – Detects `YYYY-MM-DD` format.
- `parseServerDateTime(value)` – UTC -> local conversion for timestamp strings.
- `parseServerDateOnly(value)` – Local parse for date-only values.
- `normalizeServerDate(value)` – Dispatches to the appropriate parser, always returning a local Dayjs instance.
- `normalizeServerDateStartOfDay(value)` – Normalized date at local start-of-day boundary.
- `calculateLocalDaysLeft(deadline)` – Local calendar diff for deadlines.

Usage Guidelines:
1. Never call `dayjs(rawServerField)` directly on server-provided fields; always use normalization helpers.
2. For UI display, format the already-local Dayjs instance (e.g. `.format('LL')`).
3. For logic requiring day comparison (sorting, filtering, overdue checks), ensure you use `normalizeServerDateStartOfDay`.
4. When adding new tables/fields with dates, update the README and `dateNormalization.ts` comments if special handling is needed.

Affected Fields (current schema):
- Deadlines: `created_at`, `updated_at`, `deadline_date`
- Deadline Progress: `created_at`, `updated_at`
- Deadline Status: `created_at`, `updated_at`
- Books: `created_at`, `updated_at`, `publication_date` (date-only), `date_added`
- Profiles & other tables: any `*_at` timestamp fields follow the same UTC->local rule.

Tests:
- Added `dateNormalization.test.ts` to lock in helper behavior.
- Updated `deadlineUtils.test.ts` to align with local calendar semantics for `calculateDaysLeft` and sorting logic.

Rationale:
This approach prevents subtle off-by-one issues caused by implicit timezone shifts on date-only values while preserving correct instant-based ordering for true timestamps.