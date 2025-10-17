# ShelfControl

A React Native application for tracking reading deadlines and managing book progress. Built with Expo and TypeScript.

## Features

- Reading deadline management with progress tracking
- Book search and library integration
- User authentication and profile management
- Reading session tracking
- Progress visualization and analytics

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

## Contributing

1. Follow the existing code style and conventions
2. Format code with Prettier: `npm run format`
3. Ensure all tests pass: `npm run test`
4. Run linting and type checking: `npm run lint && npm run typecheck`
5. Add tests for new functionality
6. Update documentation as needed

## Architecture

- **File-based Routing**: Uses Expo Router for navigation
- **Component Architecture**: Separation of UI components and business logic
- **State Management**: React Query for server state, React hooks for local state
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Testing Strategy**: Unit tests for utilities/services, component tests for UI

### Service Layer

The application uses a service layer pattern for all business logic and database operations. See [src/services/README.md](./src/services/README.md) for:
- Database architecture and schema details
- Review tracking system documentation
- Service API reference with examples
- Error handling patterns

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

If user selects that they need to post links. Update mark complete to be all links submitted mark complete button.