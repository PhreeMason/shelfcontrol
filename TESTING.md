# Testing Guide for ShelfControl

This document provides comprehensive guidance for understanding and extending the testing suite in the ShelfControl React Native application.

## Testing Goals

- **Target Coverage**: 80% overall test coverage
- **Current Status**: Phase 2 complete with utilities and services tested, 10.26% overall coverage
- **Testing Philosophy**: Test internal business logic separately from components for better maintainability

## Project Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test setup and mocks
│   └── teardown.ts           # Global test cleanup
├── utils/
│   ├── __tests__/
│   │   ├── dateUtils.test.ts              # 100% coverage
│   │   ├── formUtils.test.ts              # 100% coverage
│   │   ├── stringUtils.test.ts            # 100% coverage
│   │   ├── deadlineCalculations.test.ts   # 98.41% coverage
│   │   ├── audiobookTimeUtils.test.ts     # 100% coverage
│   │   └── colorUtils.test.ts             # 100% coverage
│   ├── dateUtils.ts           # Date formatting and calculations
│   ├── formUtils.ts           # Form input transformations
│   ├── stringUtils.ts         # String manipulation utilities
│   ├── deadlineCalculations.ts # Reading deadline calculations
│   ├── audiobookTimeUtils.ts  # Time conversion for audiobooks
│   └── colorUtils.ts          # Color manipulation functions
├── services/
│   ├── __tests__/
│   │   ├── books.service.test.ts          # 100% coverage
│   │   └── auth.service.test.ts           # 92.3% coverage
│   ├── books.service.ts       # Book search and data fetching
│   └── auth.service.ts        # Authentication operations
└── components/
    └── progress/
        └── __tests__/
            ├── ProgressBar.test.tsx    # Component tests
            └── ProgressInput.test.tsx  # Component tests
```

## Test Infrastructure

### Test Fixtures

Test fixtures provide realistic mock data for testing. They are located in `src/__fixtures__/`.

#### Available Fixtures

- **`deadlines.mock.json`** - Contains sanitized production deadline data with:
  - Multiple deadline objects with varying states (active, overdue, completed)
  - Different formats (audio, eBook, physical)
  - Progress tracking arrays
  - Status history arrays
  - All PII removed and IDs anonymized

**Usage Example:**
```typescript
import deadlinesMockData from '@/__fixtures__/deadlines.mock.json';

// Use in tests
const mockDeadlines = deadlinesMockData as ReadingDeadlineWithProgress[];
```

This fixture data helps test real-world scenarios and edge cases that occur in production.

### Jest Configuration (`package.json`)

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/src/__tests__/setup.ts"],
    "globalTeardown": "<rootDir>/src/__tests__/teardown.ts",
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/__tests__/**/*",
      "!src/**/index.ts",
      "!src/app/**/*",
      "!src/constants/**/*",
      "!src/types/**/*"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Available Scripts

```bash
npm run test                    # Run all tests
npm run test:coverage          # Run tests with coverage report
npm run test:coverage:watch    # Run tests with coverage in watch mode
npm run test:ff                # Run tests with fail-fast (stop on first failure)
npm run test:debug             # Run tests with debugging info
```

## Testing Patterns

### 1. Utility Function Testing

**Best Practice**: Extract business logic into pure functions for easy testing.

```typescript
// Recommended: Pure function in utils/
export const transformProgressInputText = (text: string): number => {
  if (!text) return 0;
  const parsed = parseInt(text, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// Test file
describe('transformProgressInputText', () => {
  it('should parse valid numeric string to integer', () => {
    expect(transformProgressInputText('123')).toBe(123);
  });

  it('should return 0 for invalid input', () => {
    expect(transformProgressInputText('abc')).toBe(0);
  });
});
```

### 2. Component Testing with Function Extraction

**Before**: Functions embedded in components (hard to test)
```typescript
// Not recommended: Hard to test
const ProgressBar = ({ deadlineDate }) => {
  const formatDeadlineDate = (dateString: string) => {
    return formatDisplayDate(dateString, 'MMMM D');
  };
  // ... component logic
};
```

**After**: Functions extracted to utilities (easy to test)
```typescript
// Recommended: Easy to test
import { formatDeadlineDate } from '@/utils/dateUtils';

const ProgressBar = ({ deadlineDate }) => {
  // ... component logic using formatDeadlineDate
};
```

### 3. Mock Strategy

#### Global Mocks (`src/__tests__/setup.ts`)

Pre-configured mocks for common dependencies:

```typescript
// Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn() }
}));

// Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      // ... other methods
    }))
  }
}));

// React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null
  }))
}));
```

#### Component-Specific Mocks

```typescript
// Mock specific components in test files
jest.mock('@/components/shared/LinearProgressBar', () => {
  return function MockLinearProgressBar(_props: any) {
    return `LinearProgressBar-${_props.progressPercentage}`;
  };
});
```

## Implementation Phases

### Phase 1: Foundation & Utilities (Complete)
- [x] Test infrastructure setup
- [x] Utility function extraction and testing
- [x] Component function extraction
- [x] Coverage: `dateUtils.ts` (100%), `formUtils.ts` (100%)

### Phase 2: Services & Hooks (Complete)
- [x] Core utility functions tested: `stringUtils.ts`, `deadlineCalculations.ts`, `audiobookTimeUtils.ts`, `colorUtils.ts`
- [x] Service layer testing: `books.service.ts` (100%), `auth.service.ts` (92.3%)
- [x] Comprehensive mock strategies for Supabase and external dependencies
- [x] Error handling and edge case coverage
- [x] **Total Coverage**: 10.26% overall (up from 1.36%)

### Phase 3: High-Impact Services (Complete)
- [x] **Major achievement**: `deadlines.service.ts` tested (91.66% coverage, was 0%)
- [x] `profile.service.ts` partially tested (35.8% coverage)
- [x] `storage.service.ts` tested (54% coverage)
- [x] **Total Coverage**: 16.46% overall (60% improvement from Phase 2!)
- [x] **Test Count**: 251 tests passing (up from 197)
### Completed Services:
```typescript
// ✅ services/books.service.ts (100% coverage)
- ✅ searchBooks() - with empty query handling
- ✅ fetchBookData() - with error handling
- ✅ fetchBookById() - with database integration
- ✅ getBookByApiId() - with PGRST116 error handling
- ✅ insertBook() - with format type validation

// ✅ services/auth.service.ts (92.3% coverage)
- ✅ signIn() - with credential validation
- ✅ signOut() - with error handling
- ✅ signUp() - with user data options
- ✅ resetPassword() - with email validation
- ✅ updatePassword() - with auth state management
- ✅ Apple sign-in integration

// ✅ services/deadlines.service.ts (91.66% coverage) - NEW!
- ✅ addDeadline() - with complex book linking logic
- ✅ updateDeadline() - with progress management
- ✅ updateDeadlineProgress() - progress tracking
- ✅ getDeadlines() - data fetching with joins
- ✅ getArchivedDeadlines() - filtering and sorting
- ✅ getDeadlineById() - PGRST116 error handling
- ✅ updateDeadlineStatus() - status transitions
- ✅ completeDeadline() - complex completion logic
- ✅ deleteFutureProgress() - progress cleanup
- ✅ getDeadlineHistory() - with format filtering

// ✅ services/profile.service.ts (35.8% coverage) - NEW!
- ✅ getProfile() - with error handling
- ✅ updateProfile() - data validation
- ✅ updateProfileFromApple() - Apple ID integration

// ✅ services/storage.service.ts (54% coverage) - NEW!
- ✅ setupAvatarsBucket() - bucket creation/update
- ✅ testAvatarsBucket() - accessibility testing
```

### Still Need Testing:
```typescript
// services/profile.service.ts (35.8% coverage) - Partial
- uploadAvatar() - file upload with cleanup
- getAvatarUrl() - file listing and URL generation
- getAvatarSignedUrl() - signed URL creation

// hooks/useBooks.ts (0% coverage)
- useSearchBooksList()
- useFetchBookData()
- useFetchBookById()

// hooks/useDeadlines.ts (0% coverage)
- Custom deadline logic hooks

// hooks/useReadingHistory.ts (0% coverage)
- Reading history management
```

### Phase 4: React Query Hooks (Next Priority)
Focus on completing React Query hook testing to maximize coverage impact:

**High-Impact Targets:**
1. `useDeadlines.ts` - State management and mutations (12 hooks)
2. `useBooks.ts` - React Query integration patterns (3 hooks)
3. `useReadingHistory.ts` - Reading history management
4. Remaining `profile.service.ts` functions (avatar operations)

**Expected Impact:** 20-25% total coverage with complete hook layer testing

### Phase 5: Component Logic Extraction (Future)
Components with Extractable Logic:
```typescript
// components/features/deadlines/DeadlineCard.tsx
Functions to extract:
- getBookCoverIcon()
- getGradientBackground()
- determineUrgencyColors()

// Target: Move to utils/deadlineDisplayUtils.ts
```

## Adding New Tests

### 1. Testing a New Utility Function

```typescript
// 1. Create the utility function
// src/utils/newUtils.ts
export const myNewFunction = (input: string): string => {
  return input.toUpperCase();
};

// 2. Create the test file
// src/utils/__tests__/newUtils.test.ts
import { myNewFunction } from '../newUtils';

describe('newUtils', () => {
  describe('myNewFunction', () => {
    it('should convert string to uppercase', () => {
      expect(myNewFunction('hello')).toBe('HELLO');
    });
  });
});
```

### 2. Testing a Service

```typescript
// Mock Supabase responses
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}));

// Test the service with comprehensive scenarios
describe('booksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array for empty query', async () => {
    const result = await booksService.searchBooks('');
    expect(result).toEqual({ bookList: [] });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('should search books with valid query', async () => {
    const mockResponse = {
      data: { bookList: [{ id: '1', title: 'Test Book' }] },
      error: null,
    };
    (supabase.functions.invoke as jest.Mock).mockResolvedValue(mockResponse);

    const result = await booksService.searchBooks('Harry Potter');

    expect(supabase.functions.invoke).toHaveBeenCalledWith('search-books', {
      body: { query: 'Harry Potter' },
    });
    expect(result).toEqual({ bookList: [{ id: '1', title: 'Test Book' }] });
  });

  it('should handle search errors', async () => {
    const mockError = new Error('Search failed');
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: mockError,
    });

    await expect(booksService.searchBooks('test')).rejects.toThrow('Search failed');
  });
});
```

### 3. Testing a React Hook

```typescript
import { renderHook } from '@testing-library/react-native';
import { useMyCustomHook } from '../useMyCustomHook';

describe('useMyCustomHook', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useMyCustomHook());

    expect(result.current.data).toBeDefined();
    expect(result.current.loading).toBe(false);
  });
});
```

## Coverage Monitoring

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Targets

- **Lines**: 70% minimum, 80% target
- **Functions**: 70% minimum, 80% target
- **Branches**: 70% minimum
- **Statements**: 70% minimum

### Improving Coverage

1. **Identify uncovered code**:
   ```bash
   npm run test:coverage
   # Check the terminal output or HTML report
   ```

2. **Extract functions from components** for easier testing
3. **Add edge case tests** to improve branch coverage
4. **Test error scenarios** in addition to happy paths

## Common Issues & Solutions

### Issue: Tests failing due to missing mocks
**Solution**: Add missing mocks to `src/__tests__/setup.ts`

### Issue: React Native Testing Library can't find text
**Solution**: Use flexible text matching:
```typescript
// Not recommended: Too specific
expect(screen.getByText('Exact text match')).toBeTruthy();

// Recommended: More flexible
expect(screen.getByText(/partial text/)).toBeTruthy();
expect(screen.getByText(/75/)).toBeTruthy(); // Numbers
```

### Issue: Date/time-dependent tests are flaky
**Solution**: Use fixed dates in tests:
```typescript
const fixedDate = new Date('2024-01-15');
const result = calculateDaysLeft('2024-01-20', fixedDate);
expect(result).toBe(5);
```

### Issue: Component tests are too brittle
**Solution**: Focus on behavior over implementation:
```typescript
// Not recommended: Testing implementation details
expect(screen.getByText('ThemedText-muted:75%')).toBeTruthy();

// Recommended: Testing behavior
expect(screen.getByText(/75/)).toBeTruthy();
expect(mockFormatFunction).toHaveBeenCalledWith('2024-01-20');
```

## Phase 3 Achievements

### Major Service Testing Breakthrough
- **251 tests** passing across 13 test suites (up from 197)
- **91.66% coverage** of the most complex service (`deadlines.service.ts`)
- **60% coverage improvement** in one session (10.26% → 16.46%)
- **Professional testing standards** maintained with TypeScript compliance
- **Complex business logic** thoroughly validated

### Service Layer Progress
1. **Complete Service Coverage**: `books.service.ts` (100%), `auth.service.ts` (92.3%)
2. **High-Impact Service Added**: `deadlines.service.ts` (91.66% - was 0%)
3. **Additional Services**: `profile.service.ts` (35.8%), `storage.service.ts` (54%)
4. **Error Handling**: Comprehensive edge cases and error scenarios
5. **Mock Strategies**: Advanced Supabase mocking for complex operations

### Coverage Improvements
- **Before Phase 3**: 10.26% overall coverage
- **After Phase 3**: 16.46% overall coverage (60% improvement!)
- **Services Layer**: Now 72.91% coverage (was ~39%)
- **Utilities**: 6 utility files at 98-100% coverage each
- **Test Quality**: All tests pass with lint and TypeScript compliance

## Best Practices

1. **Extract Before Testing**: Move complex logic to utility functions before writing tests
2. **Test Utilities First**: Pure functions are easier to test and provide immediate value
3. **Mock External Dependencies**: Keep tests fast and reliable by mocking APIs, navigation, etc.
4. **Use Descriptive Test Names**: `should return 0 for empty string` vs `test1`
5. **Test Edge Cases**: Empty inputs, null values, boundary conditions
6. **Group Related Tests**: Use `describe` blocks to organize tests logically
7. **Keep Tests Simple**: One assertion per test when possible
8. **Update Tests with Code Changes**: Maintain tests as you refactor
9. **Type Safety First**: Ensure all mocks and test data match actual TypeScript types
10. **Run Lint and TypeCheck**: Always validate with `npm run lint && npm run typecheck`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/testing-implementation-details)
- [Jest Expo Configuration](https://docs.expo.dev/develop/unit-testing/)

---

**Last Updated**: Phase 2 Complete - Services and utilities thoroughly tested (10.26% coverage)
**Next Priority**: Phase 3 - Remaining services (`deadlines.service.ts`, `profile.service.ts`, `storage.service.ts`) and hooks (`useBooks.ts`, `useDeadlines.ts`)
**Expected Impact**: Completing Phase 3 should achieve 40-50% total coverage