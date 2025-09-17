# ShelfControl

A React Native application for tracking reading deadlines and managing book progress. Built with Expo and TypeScript.

## Features

- Reading deadline management with progress tracking
- Book search and library integration
- User authentication and profile management
- Reading session tracking
- Progress visualization and analytics
- Cross-platform support (iOS, Android, Web)

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

## Performance

- Code splitting with dynamic imports
- Optimized bundle size with tree shaking
- Image optimization with expo-image
- Efficient re-renders with React.memo and useMemo