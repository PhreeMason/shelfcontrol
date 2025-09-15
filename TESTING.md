# Testing Guide for ShelfControl

This document provides comprehensive guidance for understanding and extending the testing suite in the ShelfControl React Native application.

## Testing Goals

- **Target Coverage**: 80% overall test coverage
- **Current Status**: Phase 1 complete with utility functions at 100% coverage
- **Testing Philosophy**: Test internal business logic separately from components for better maintainability

## Project Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test setup and mocks
│   └── teardown.ts           # Global test cleanup
├── utils/
│   ├── __tests__/
│   │   ├── dateUtils.test.ts  # 100% coverage
│   │   └── formUtils.test.ts  # 100% coverage
│   ├── dateUtils.ts           # Date formatting and calculations
│   └── formUtils.ts           # Form input transformations
└── components/
    └── progress/
        └── __tests__/
            ├── ProgressBar.test.tsx    # Component tests
            └── ProgressInput.test.tsx  # Component tests
```

## Test Infrastructure

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

### Phase 2: Services & Hooks (In Progress)
Priority Services to Test:
```typescript
// services/books.service.ts
- searchBooks()
- fetchBookData()
- fetchBookById()

// services/auth.service.ts
- signIn()
- signOut()
- resetPassword()

// services/deadlines.service.ts
- createDeadline()
- updateProgress()
- getDeadlines()
```

Priority Hooks to Test:
```typescript
// hooks/useBooks.ts
- useSearchBooksList()
- useFetchBookData()
- useFetchBookById()

// hooks/useDeadlines.ts
- Custom deadline logic hooks
```

### Phase 3: Complex Components (Planned)
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
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({
        data: [{ id: 1, title: 'Test Book' }],
        error: null
      })
    }))
  }
}));

// Test the service
describe('booksService', () => {
  it('should fetch books successfully', async () => {
    const result = await booksService.searchBooks('test');
    expect(result).toEqual({ bookList: expect.any(Array) });
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

## Best Practices

1. **Extract Before Testing**: Move complex logic to utility functions before writing tests
2. **Test Utilities First**: Pure functions are easier to test and provide immediate value
3. **Mock External Dependencies**: Keep tests fast and reliable by mocking APIs, navigation, etc.
4. **Use Descriptive Test Names**: `should return 0 for empty string` vs `test1`
5. **Test Edge Cases**: Empty inputs, null values, boundary conditions
6. **Group Related Tests**: Use `describe` blocks to organize tests logically
7. **Keep Tests Simple**: One assertion per test when possible
8. **Update Tests with Code Changes**: Maintain tests as you refactor

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/testing-implementation-details)
- [Jest Expo Configuration](https://docs.expo.dev/develop/unit-testing/)

---

**Last Updated**: Phase 1 Complete - Foundation and utility functions established
**Next Priority**: Phase 2 - Service layer and hooks testing