# Testing Guide for ShelfControl

This document provides comprehensive guidance for understanding and extending the testing suite in the ShelfControl React Native application.

## Testing Goals

- **Target Coverage**: 80% overall test coverage
- **Current Status**: Phase 4 complete with hooks and utilities tested, 37.88% overall coverage
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
│   │   ├── colorUtils.test.ts             # 100% coverage
│   │   ├── typeaheadUtils.test.ts         # 100% coverage
│   │   └── dateNormalization.test.ts      # 85% coverage
│   ├── dateUtils.ts           # Date formatting and calculations
│   ├── formUtils.ts           # Form input transformations
│   ├── stringUtils.ts         # String manipulation utilities
│   ├── deadlineCalculations.ts # Reading deadline calculations
│   ├── audiobookTimeUtils.ts  # Time conversion for audiobooks
│   ├── colorUtils.ts          # Color manipulation functions
│   ├── typeaheadUtils.ts      # Typeahead and suggestion utilities
│   └── dateNormalization.ts   # Date normalization and validation
├── services/
│   ├── __tests__/
│   │   ├── books.service.test.ts          # 100% coverage
│   │   └── auth.service.test.ts           # 92.3% coverage
│   ├── books.service.ts       # Book search and data fetching
│   └── auth.service.ts        # Authentication operations
└── components/
    ├── progress/
    │   └── __tests__/
    │       ├── ProgressBar.test.tsx    # Component tests
    │       └── ProgressInput.test.tsx  # Component tests
    └── shared/
        └── __tests__/
            └── SourceTypeaheadInput.test.tsx # Component tests
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

### Phase 4: React Query Hooks & Advanced Utilities (Complete)
- [x] **Major breakthrough**: React Query hooks testing implementation
- [x] `useDeadlines.ts` hook tested with comprehensive mutation coverage
- [x] New utility functions: `typeaheadUtils.ts` (100%), `dateNormalization.ts` (85%)
- [x] Component integration: `SourceTypeaheadInput.test.tsx`
- [x] **Total Coverage**: 37.88% overall (130% improvement from Phase 3!)
- [x] **Test Count**: 549 tests passing (118% increase from Phase 3)
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

// hooks/useBooks.ts (0% coverage) - Still needed
- useSearchBooksList()
- useFetchBookData()
- useFetchBookById()

// ✅ hooks/useDeadlines.ts (Tested) - NEW!
- ✅ useDeadlines() - with React Query integration
- ✅ useAddDeadline() - mutation testing
- ✅ useUpdateDeadline() - update operations
- ✅ useUpdateDeadlineProgress() - progress tracking
- ✅ useCompleteDeadline() - completion logic
- ✅ useStartReadingDeadline() - status transition to 'reading'
- ✅ useSetAsideDeadline() - status transition to 'set_aside'
- ✅ useReactivateDeadline() - status transition back to 'reading'

// ✅ hooks/useDeadlineSources.ts (Tested) - NEW!
- ✅ Source fetching and caching logic
- ✅ Default source handling
- ✅ User authentication integration

// hooks/useReadingHistory.ts (0% coverage) - Still needed
- Reading history management
```

### Phase 5: DeadlineForm Testing (Complete)
**MAJOR ACHIEVEMENT**: Critical path deadline form testing implemented successfully!

**Completed Components:**
```typescript
// ✅ utils/deadlineFormUtils.ts (93.2% coverage) - NEW!
- ✅ getFormDefaultValues() - mode-specific defaults
- ✅ initializeFormState() - state initialization
- ✅ prepareDeadlineDetailsFromForm() - form data transformation
- ✅ prepareProgressDetailsFromForm() - progress data preparation
- ✅ populateFormFromParams() - URL parameter parsing
- ✅ populateFormFromDeadline() - existing deadline population
- ✅ createFormatChangeHandler() - format switching with memory
- ✅ createPriorityChangeHandler() - priority selection
- ✅ createDateChangeHandler() - date picker logic
- ✅ createFormNavigation() - step navigation and validation
- ✅ handleBookSelection() - book selection workflow
- ✅ createSuccessToast() / createErrorToast() - notifications

// ✅ utils/deadlineFormSchema.ts (100% coverage) - NEW!
- ✅ All field validation rules tested
- ✅ Conditional validation (audio vs non-audio formats)
- ✅ Error message validation
- ✅ Edge cases and boundary conditions
- ✅ Complete form validation scenarios

// ⚠️ components/forms/DeadlineFormStep1.test.tsx (Placeholder)
- ⚠️ Component testing blocked by Jest module resolution issues
- ⚠️ Mock conflicts with React Native Testing Library
- ⚠️ Requires investigation of circular dependencies

// 🔧 Bug Fix: components/forms/DeadlineFormStep1.tsx
- 🔧 Fixed null safety: item.metadata?.authors (line 162)
```

**Phase 5 Results:**
- **101 new tests** for deadline form functionality (70 utils + 30 schema + 1 placeholder)
- **43.66% overall coverage** (up from 37.88% - target achieved!)
- **650 total tests passing** (up from 549)
- **Critical business logic fully tested** with 93.2% coverage
- **All lint and TypeScript checks passing**

### Phase 6: Remaining Components & Integration (Next Priority)
Focus on completing component testing and final integrations:

**High-Impact Targets:**
1. **Component Testing Resolution** - Fix Jest module resolution issues
   - Investigate circular dependency problems with React Native Testing Library
   - Review mock strategy for complex component dependencies
   - Consider alternative testing approaches for form components
2. **Remaining Hook Testing** - Complete hook layer coverage
   - `useBooks.ts` - React Query integration patterns (3 hooks)
   - `useReadingHistory.ts` - Reading history management
3. **Service Layer Completion** - Finish remaining service functions
   - `profile.service.ts` functions (avatar operations - 35.8% → 80%+ target)
4. **Route Component Testing** - Test app navigation components
   - `app/deadline/new.tsx` - New deadline route
   - `app/deadline/[id]/edit.tsx` - Edit deadline route
5. **Integration Testing** - End-to-end form workflows
   - `DeadlineFormContainer.tsx` - Multi-step form integration
   - Form submission and error handling workflows

**Expected Impact:** 55-65% total coverage with complete form workflow testing

## Component Testing Issues & Solutions

### Known Issues
1. **Jest Module Resolution Problem** (`DeadlineFormStep1.test.tsx`)
   ```
   Element type is invalid: expected a string (for built-in components)
   or a class/function (for composite components) but got: undefined.
   ```

2. **Root Causes Identified:**
   - Mock hoisting conflicts with ES6 imports
   - Circular dependencies in component tree
   - React Native Testing Library compatibility issues

### Recommended Solutions
1. **Mock Strategy Revision:**
   ```typescript
   // Consider moving to beforeAll or setupFiles
   jest.mock('@/hooks/useBooks', () => ({
     useSearchBooksList: jest.fn(),
     useFetchBookData: jest.fn(),
   }));
   ```

2. **Alternative Testing Approaches:**
   - Test component logic separately from React components
   - Extract more business logic to utility functions (already successful pattern)
   - Use integration tests for complex component interactions

3. **Component Architecture Review:**
   - Consider breaking down large components into smaller, testable units
   - Implement dependency injection for easier mocking

### Phase 7: Component Logic Extraction (Future)
Components with Extractable Logic:
```typescript
// HIGH PRIORITY: Deadline Form Components
// components/forms/DeadlineFormStep1.tsx
Functions to extract and test:
- validateBookSelection()
- handleBookSearch()
- formatBookDisplayData()

// components/forms/DeadlineFormStep2.tsx
Functions to extract and test:
- validateDateRange()
- calculateReadingPace()
- formatProgressInputs()
- handleFormatTypeChange()

// components/features/deadlines/DeadlineCard.tsx
Functions to extract:
- getBookCoverIcon()
- getGradientBackground()
- determineUrgencyColors()

// Target: Move to utils/deadlineFormUtils.ts and utils/deadlineDisplayUtils.ts
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

## Phase 4 Achievements

### Major React Query Hooks Breakthrough
- **549 tests** passing across 23 test suites (up from 251)
- **Comprehensive hook testing** with React Query integration patterns
- **130% coverage improvement** in one phase (16.46% → 37.88%)
- **Advanced component testing** with typeahead input functionality
- **Professional testing standards** maintained with TypeScript compliance

### Hook & Component Progress
1. **Complete Hook Coverage**: `useDeadlines.ts` (mutations & queries including `useStartReadingDeadline`), `useDeadlineSources.ts`
2. **New Utility Functions**: `typeaheadUtils.ts` (100%), `dateNormalization.ts` (85%)
3. **Component Integration**: `SourceTypeaheadInput.test.tsx` with user interaction testing
4. **Provider Testing**: `DeadlineProvider.test.tsx` with complete mock coverage
5. **Error Handling**: Comprehensive edge cases for hooks and async operations
6. **Mock Strategies**: Advanced React Query and hook testing patterns

### Coverage Improvements
- **Before Phase 4**: 16.46% overall coverage
- **After Phase 4**: 37.88% overall coverage (130% improvement!)
- **Utilities Layer**: 8 utility files at 85-100% coverage each
- **Hooks Layer**: Key deadline management hooks fully tested
- **Test Quality**: All 549 tests pass with lint and TypeScript compliance

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

**Last Updated**: Phase 5 Complete - DeadlineForm utilities and schema testing implemented (43.66% coverage, 650 tests passing)
**Next Priority**: Phase 6 - Component testing resolution, remaining hooks (`useBooks.ts`, `useReadingHistory.ts`), and integration testing
**Expected Impact**: Completing Phase 6 should achieve 55-65% total coverage

## Phase 5 Summary: Deadline Form Testing Success

### What Was Accomplished
- ✅ **101 new tests** for critical deadline form functionality
- ✅ **93.2% coverage** on `deadlineFormUtils.ts` (all business logic functions)
- ✅ **100% coverage** on `deadlineFormSchema.ts` (complete validation testing)
- ✅ **43.66% overall project coverage** achieved (exceeded 40% target)
- ✅ **All lint and TypeScript checks passing**
- ✅ **Bug fix**: Null safety issue in `DeadlineFormStep1.tsx`

### Key Testing Patterns Established
1. **Utility-First Testing**: Extract business logic to pure functions for easy testing
2. **Comprehensive Validation Testing**: Test all form validation scenarios and edge cases
3. **Mock Strategy**: Use Jest mocks for external dependencies with proper type safety
4. **Error Handling**: Test both success and error paths thoroughly
5. **Type Safety**: Maintain strict TypeScript compliance in all test code

### Known Limitations
- **Component Testing Blocked**: Jest module resolution issues prevent full component testing
- **Integration Testing Pending**: Complex component workflows not yet tested
- **React Native Testing Library Issues**: Mock conflicts with RN components

### Recommendations for Next Developer
1. **Prioritize Component Testing Fix**: Investigate Jest module resolution before adding more component tests
2. **Continue Utility-First Pattern**: Extract component logic to utilities for easier testing
3. **Focus on Integration**: Test complete user workflows once component issues resolved
4. **Maintain Coverage**: Current 43.66% is good progress toward 70% target