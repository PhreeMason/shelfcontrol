# Multi-Line Chart Implementation Plan

## Overview

Add 4 data lines to the UserReadingLineChart component:
1. **Pages read per day** (existing)
2. **Minutes listened per day** (new)
3. **Target pages per day** (new - historical)
4. **Target minutes per day** (new - historical)

**Key Decisions:**
- All 4 lines on one chart
- Historical targets (what the target was on each past day)
- Targets include active 'reading' status + books completed/DNF'd on that day
- 30-day lookback window
- Runtime calculation (no new DB table)

---

## Architecture Decision: Runtime vs. Database Table

### Selected: Runtime Calculation ✅

**Pros:**
- ✅ No schema changes or migrations needed
- ✅ Always accurate - reflects current state of deadlines
- ✅ Existing `minimumUnitsPerDayFromDeadline()` function already handles this logic
- ✅ Self-healing - if progress is edited, targets recalculate automatically
- ✅ Simpler implementation - follows existing architectural patterns
- ✅ React Query caching minimizes repeated calculations
- ✅ 30-day window is small enough for good performance

**Cons:**
- ⚠️ More computation on each chart render (acceptable for 30 days)
- ⚠️ Repeated calculations for historical data

**Performance Note:** With 30 days × 10 active deadlines = ~300 calculations, modern devices handle this easily.

**Migration Path:** If performance becomes an issue (>100 active deadlines), we can:
1. Add memoization/caching layer
2. Create Supabase materialized view
3. Implement daily batch job to snapshot targets
4. All without changing the chart component API!

---

## Phase 1: Extend Chart Data Utilities (Core Algorithm)

**File:** `src/utils/chartDataUtils.ts`

### 1.1 Create `getAllUserActivityDays()` function

**Purpose:** Unified function that returns pages read, minutes listened, and historical targets for each day.

**Return Structure:**
```typescript
interface UserActivityDay {
  date: string;  // YYYY-MM-DD
  pagesRead: number;
  minutesListened: number;
  targetPages: number;
  targetMinutes: number;
}
```

**Algorithm:**
1. Calculate 30-day cutoff time (from most recent progress)
2. Process pages read (physical + eBook deadlines):
   - Use existing `processBookProgress()` pattern
   - Aggregate by date
3. Process minutes listened (audio deadlines):
   - Use existing `processBookProgress()` pattern
   - Aggregate by date
4. For each day in the window:
   - Get deadlines that were active on that day
   - Calculate historical target for each deadline
   - Sum targets by format (pages vs minutes)
5. Combine all data into unified array

**Key Logic - Deadline Active on Date:**
A deadline is "active" on a historical date if:
- Status was 'reading' on that date, OR
- Completed on that exact date, OR
- DNF'd on that exact date

**Key Logic - Historical Target Calculation:**
For each deadline on each day:
1. Find the progress state as of that day (latest progress ≤ target date)
2. Calculate remaining work: `totalQuantity - progressAsOfDate`
3. Calculate days left: `deadlineDate - targetDate`
4. Required pace: `Math.ceil(remainingWork / daysLeft)`

### 1.2 Create Helper Functions

**`getDeadlinesActiveOnDate(deadlines, targetDate)`**
- Filters deadlines that were active on specific historical date
- Includes deadlines with status = 'reading' OR completed/DNF'd on that day
- Returns filtered array

**`getProgressAsOfDate(progressArray, targetDate)`**
- Finds the latest progress entry on or before target date
- Handles baseline/ignore_in_calcs filtering
- Returns progress value or 0

**`calculateHistoricalRequiredPace(deadline, targetDate)`**
- Calculates required daily pace as of specific historical date
- Uses progress state from that date
- Returns pace value (pages or minutes per day)

**`aggregateTargetsByFormat(deadlines, targetDate)`**
- Groups deadlines by format (reading vs audio)
- Sums required pace for each format
- Returns `{ targetPages, targetMinutes }`

### 1.3 Update Time Window

**Option A:** Modify `calculateCutoffTime()` to accept days parameter:
```typescript
export const calculateCutoffTime = (
  deadlines: ReadingDeadlineWithProgress[],
  lookbackDays: number = 21
): Date
```

**Option B:** Create new function `calculateCutoffTime30Days()`

**Decision:** Option A (configurable parameter)

---

## Phase 2: Add Comprehensive Tests

**File:** `src/utils/__tests__/chartDataUtils.test.ts`

### Test Coverage (Target: 95%+)

**Basic Functionality:**
- ✅ Empty deadlines array returns empty results
- ✅ Single deadline with progress returns correct data
- ✅ Multiple deadlines aggregate correctly

**Format Handling:**
- ✅ Physical format counted in pagesRead
- ✅ eBook format counted in pagesRead
- ✅ Audio format counted in minutesListened
- ✅ Mixed formats (physical + audio) aggregated to separate totals

**Historical Target Calculation:**
- ✅ Target calculated correctly for active deadline on specific date
- ✅ Multiple deadlines' targets summed correctly
- ✅ Deadline completed mid-window includes target up to completion date
- ✅ DNF deadline includes target up to DNF date
- ✅ Deadline completed before window excluded from targets
- ✅ Deadline starting after specific date excluded from that day's target

**Progress Handling:**
- ✅ Baseline progress (ignore_in_calcs) excluded from calculations
- ✅ Progress entries sorted correctly by date
- ✅ Historical progress state retrieved correctly (as of specific date)
- ✅ Missing progress handled gracefully

**Time Window:**
- ✅ 30-day cutoff window applied correctly
- ✅ Progress outside window excluded
- ✅ Targets calculated only for dates in window

**Edge Cases:**
- ✅ Deadline with no progress
- ✅ Deadline with only baseline progress
- ✅ Deadline with deadline_date in the past (overdue)
- ✅ Deadline with deadline_date = today
- ✅ Overlapping deadlines with same dates
- ✅ Progress on same day from multiple books

**Data Integrity:**
- ✅ Date strings in YYYY-MM-DD format
- ✅ Numeric values rounded appropriately
- ✅ No negative values in results
- ✅ No NaN or undefined values

---

## Phase 3: Update Chart Component

**File:** `src/components/charts/UserReadingLineChart.tsx`

### 3.1 Import New Function

```typescript
import { getAllUserActivityDays } from '@/utils/chartDataUtils';
```

### 3.2 Replace Data Calculation

**Before:**
```typescript
const recentDays = getAllUserReadingDays(deadlines);
```

**After:**
```typescript
const activityDays = getAllUserActivityDays(deadlines);
```

### 3.3 Update Chart Data Transformation

```typescript
const chartData = activityDays.map((day, index) => ({
  value: Math.round(day.pagesRead),
  label: index % 2 === 0 ? parseServerDateOnly(day.date).format('M/DD') : '',
  dataPointText: String(Math.round(day.pagesRead)),
  date: parseServerDateOnly(day.date).format('M/DD'),
}));

// Prepare data for additional lines
const chartData2 = activityDays.map((day, index) => ({
  value: Math.round(day.minutesListened),
  label: index % 2 === 0 ? parseServerDateOnly(day.date).format('M/DD') : '',
  dataPointText: String(Math.round(day.minutesListened)),
}));

const chartData3 = activityDays.map((day, index) => ({
  value: Math.round(day.targetPages),
  label: index % 2 === 0 ? parseServerDateOnly(day.date).format('M/DD') : '',
  dataPointText: String(Math.round(day.targetPages)),
}));

const chartData4 = activityDays.map((day, index) => ({
  value: Math.round(day.targetMinutes),
  label: index % 2 === 0 ? parseServerDateOnly(day.date).format('M/DD') : '',
  dataPointText: String(Math.round(day.targetMinutes)),
}));
```

### 3.4 Update maxValue Calculation

```typescript
const maxValue = Math.max(
  ...chartData.map(d => d.value),
  ...chartData2.map(d => d.value),
  ...chartData3.map(d => d.value),
  ...chartData4.map(d => d.value),
  10
);
const yAxisMax = Math.ceil(maxValue * 1.2);
```

### 3.5 Add Lines to LineChart Component

```typescript
<LineChart
  // Line 1: Pages Read (existing)
  data={chartData}
  color={colors.primary}
  dataPointsColor={colors.primary}
  startFillColor={colors.darkPurple}
  endFillColor={colors.primary}

  // Line 2: Minutes Listened
  data2={chartData2}
  color2={colors.secondary}
  dataPointsColor2={colors.secondary}
  startFillColor2={colors.secondary}
  endFillColor2={colors.secondaryLight}

  // Line 3: Target Pages
  data3={chartData3}
  color3={colors.tertiary}
  dataPointsColor3={colors.tertiary}
  thickness3={1}  // Thinner line for target
  hideDataPoints3={true}  // Hide data points for cleaner look

  // Line 4: Target Minutes
  data4={chartData4}
  color4={colors.quaternary}
  dataPointsColor4={colors.quaternary}
  thickness4={1}  // Thinner line for target
  hideDataPoints4={true}  // Hide data points for cleaner look

  // ... rest of existing props
  maxValue={yAxisMax > 0 ? yAxisMax : 10}
/>
```

### 3.6 Add Legend Component

```typescript
<View style={styles.legend}>
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
    <ThemedText style={styles.legendText}>Pages Read</ThemedText>
  </View>
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
    <ThemedText style={styles.legendText}>Minutes Listened</ThemedText>
  </View>
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, { backgroundColor: colors.tertiary }]} />
    <ThemedText style={styles.legendText}>Target Pages</ThemedText>
  </View>
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, { backgroundColor: colors.quaternary }]} />
    <ThemedText style={styles.legendText}>Target Minutes</ThemedText>
  </View>
</View>
```

### 3.7 Update Title

```typescript
<ThemedText variant="title" style={[styles.title, { color: colors.text }]}>
  Reading Activity & Targets
</ThemedText>
```

### 3.8 Add Legend Styles

```typescript
legend: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  paddingHorizontal: 20,
  paddingTop: 10,
  gap: 12,
},
legendRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
legendDot: {
  width: 12,
  height: 12,
  borderRadius: 6,
},
legendText: {
  fontSize: 11,
},
```

---

## Phase 4: Type Safety & Constants

### 4.1 Create/Update Chart Types

**File:** `src/types/charts.types.ts` (create if doesn't exist)

```typescript
import { ReadingDeadlineWithProgress } from './deadline.types';

/**
 * Represents a single day's reading activity and targets
 */
export interface UserActivityDay {
  date: string;  // YYYY-MM-DD format
  pagesRead: number;  // Total pages read this day (physical + eBook)
  minutesListened: number;  // Total minutes listened this day (audio)
  targetPages: number;  // Required pages/day for all reading deadlines
  targetMinutes: number;  // Required minutes/day for all audio deadlines
}

/**
 * Chart data point for react-native-gifted-charts
 */
export interface ChartDataPoint {
  value: number;
  label?: string;
  dataPointText?: string;
  date?: string;
}
```

### 4.2 Add Color Constants to Theme

**File:** Check if colors exist in `src/hooks/useThemeColor.ts` or theme config

Ensure these colors are available:
- `primary` - Pages read line
- `secondary` - Minutes listened line
- `tertiary` - Target pages line
- `quaternary` - Target minutes line

If missing, add to color palette.

---

## Phase 5: Testing & Validation

### 5.1 Run Unit Tests

```bash
# Test new utility functions
npm run test -- chartDataUtils.test.ts

# Run all tests to ensure nothing broke
npm run test
```

### 5.2 Type Check

```bash
npm run typecheck
```

### 5.3 Lint

```bash
npm run lint
```

### 5.4 Manual Testing Scenarios

Test with different user data scenarios:

1. **User with only reading deadlines:**
   - ✅ Pages read line shows data
   - ✅ Target pages line shows data
   - ✅ Minutes listened = 0 (line flat at bottom)
   - ✅ Target minutes = 0 (line flat at bottom)

2. **User with only audio deadlines:**
   - ✅ Minutes listened line shows data
   - ✅ Target minutes line shows data
   - ✅ Pages read = 0
   - ✅ Target pages = 0

3. **User with mixed deadlines:**
   - ✅ All 4 lines show appropriate data
   - ✅ Lines don't overlap confusingly
   - ✅ Legend is readable

4. **User who completed a book mid-window:**
   - ✅ Target line drops to 0 after completion date
   - ✅ Pages read continues to show data

5. **User who DNF'd a book mid-window:**
   - ✅ Target line drops after DNF date
   - ✅ Reading activity reflects actual progress

6. **User with no progress in window:**
   - ✅ Empty state shows
   - ✅ No errors or crashes

7. **User with high variance (0 some days, high others):**
   - ✅ Y-axis scales appropriately
   - ✅ All data points visible

---

## Phase 6: Performance Optimization (If Needed)

Only implement if rendering is slow (>100ms).

### 6.1 Add Memoization

```typescript
const activityDays = useMemo(
  () => getAllUserActivityDays(deadlines),
  [deadlines]
);
```

### 6.2 Profile Render Time

```typescript
const startTime = performance.now();
const activityDays = getAllUserActivityDays(deadlines);
const endTime = performance.now();
console.log(`Chart data calculation took ${endTime - startTime}ms`);
```

### 6.3 Future Optimizations

If still slow:
- Consider breaking into separate charts (reading vs listening)
- Implement data sampling for >60 day windows
- Create materialized view in Supabase
- Add daily_targets table with batch calculation job

---

## Success Criteria

✅ All 4 lines display correctly on chart
✅ Historical targets reflect actual required pace on each date
✅ Targets include deadlines that were completed/DNF'd on that day
✅ 30-day lookback window applied consistently
✅ Test coverage ≥95% for new utility functions
✅ TypeScript compilation with no errors
✅ Lint checks pass
✅ Chart remains performant (<100ms render time)
✅ Empty states handled gracefully
✅ Legend clearly identifies each line

---

## Future Enhancements (Out of Scope)

- Configurable time window (7/14/30/60 days)
- Toggle individual lines on/off
- Separate charts for reading vs. listening
- Daily targets table for >50 active deadlines
- Target accuracy metrics (ahead/behind pace)
- Touch interactions to show exact values per line
- Export chart data to CSV

---

---

## Function-by-Function Discussion & Implementation

This section documents our analysis of each function before implementation.

---

### ✅ Function #1: `getProgressAsOfDate()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:214-258`

**Purpose:** Finds the progress value for a deadline at a specific historical date.

**Implementation Details:**
- Uses `parseServerDateTime()` for progress `created_at` timestamps (UTC → local)
- Uses `parseServerDateOnly()` for target date (YYYY-MM-DD format)
- Date comparison: `isBefore() || isSame()` pattern for "on or before"
- Performance: Checks if array is sorted before sorting (optimization)
- Future dates: Returns 0 (no progress made yet)
- Excludes baseline progress (`ignore_in_calcs: true`)
- Returns latest progress on or before target date

**Edge Cases Handled:**
- ✅ Empty/null progress array → returns 0
- ✅ Future dates → returns 0
- ✅ No progress before target date → returns 0
- ✅ Only baseline progress → returns 0
- ✅ Multiple progress on same day → uses latest
- ✅ Already sorted array → skips sorting step

**Algorithm Complexity:** O(n log n) worst case, O(n) if already sorted

---

### ✅ Function #2: `getDeadlinesActiveOnDate()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:274-296`

**Purpose:** Filters deadlines that were active on a specific historical date.

**Implementation Details:**
- **Simple rule:** A deadline is "active" if progress was recorded on that date
- Checks if any progress entries match the target date (date-only comparison)
- Excludes baseline progress (`ignore_in_calcs: true`)
- Uses `parseServerDateTime()` for progress timestamps
- Uses `parseServerDateOnly()` for target date

**Why This Works:**
- ✅ No need to track status changes - progress implies activity
- ✅ Automatically handles completed/DNF'd books (they have progress on completion day)
- ✅ Set aside books won't have progress, so excluded
- ✅ Simple, fast, and accurate

**Edge Cases Handled:**
- ✅ Empty/null progress array → excluded from results
- ✅ Only baseline progress on date → excluded (skip ignore_in_calcs)
- ✅ Multiple progress on same day → deadline included (some() returns true)

**Algorithm Complexity:** O(n × m) where n = deadlines, m = avg progress per deadline

---

### ✅ Function #3: `calculateHistoricalRequiredPace()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:322-344`

**Purpose:** Calculates required daily pace as of a specific historical date.

**Key Design Decision:** Uses progress **at START of day** (previous day's progress)
- Shows "what you needed to accomplish that morning"
- On completion day, shows actual target needed (not 0)
- After completion, deadline disappears from future days (no progress = not active)

**Implementation Details:**
- Gets progress as of **previous day** using `getProgressAsOfDate()`
- Calculates days left from target date to deadline date
- Uses existing `calculateRequiredPace()` for consistency
- Returns pages/day (reading) or minutes/day (audio)

**Example Flow:**
```
Book: 200 pages, deadline Jan 20
Jan 14: Progress = 50 pages
Jan 15: User reads 150 pages and completes book

calculateHistoricalRequiredPace(deadline, 'Jan 15'):
- Progress at start of Jan 15 = 50 pages (previous day)
- Days left = 5 days
- Required = Math.ceil(150 / 5) = 30 pages/day ✅
- Chart shows target of 30 pages for Jan 15
```

**Edge Cases Handled:**
- ✅ Deadline already passed → returns remaining work
- ✅ Completion day → shows target needed that morning
- ✅ No progress before date → target = full quantity / days left
- ✅ Already ahead of schedule → may return 0 or low number

**Algorithm Complexity:** O(m log m) where m = progress entries per deadline

---

### ✅ Function #4: `getDeadlinesInFlightOnDate()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:366-400`

**Purpose:** Filters deadlines that were "in flight" (actively being worked on) on a specific date.

**"In Flight" Definition:**
1. ✅ Has been started (has non-baseline progress)
2. ✅ Not yet completed as of START of that day
3. ✅ Deadline date >= that day (not overdue)

**Implementation Details:**
- Checks for real progress (excludes baseline with `ignore_in_calcs`)
- Uses `getProgressAsOfDate(previousDay)` to check completion status at start of day
- Compares with `total_quantity` to determine if completed
- Excludes overdue deadlines (strict approach)

**Why This Matters:**
- Target lines should show ALL books user needs to work on
- Not just books they actually worked on that day
- Shows true reading obligation vs. actual performance

**Example:**
```
User has 3 books in flight:
- Book A: Started, 50/200 pages, deadline Jan 20
- Book B: Started, 100/300 pages, deadline Jan 25
- Book C: Completed Jan 14

On Jan 15:
- In flight: Book A ✅, Book B ✅
- Not in flight: Book C ❌ (completed on Jan 14)
```

**Algorithm Complexity:** O(n × m) where n = deadlines, m = progress per deadline

---

### ✅ Function #5: `aggregateTargetsByFormat()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:421-446`

**Purpose:** Aggregates required daily targets for all in-flight deadlines, grouped by format.

**Implementation Details:**
- Calls `getDeadlinesInFlightOnDate()` to get active deadlines
- For each in-flight deadline, calculates `calculateHistoricalRequiredPace()`
- Separates by format:
  - `audio` → targetMinutes
  - `physical` + `eBook` → targetPages
- Returns raw numbers (not rounded)

**Example:**
```
3 books in flight on Jan 15:
- Book A: needs 20 pages/day (physical)
- Book B: needs 30 pages/day (eBook)
- Audiobook: needs 45 min/day (audio)

Result: { targetPages: 50, targetMinutes: 45 }
```

**Performance:**
- 30 days × 8 avg in-flight × O(m log m) ≈ 1,200 ops
- Very fast (< 30ms on typical device)
- React Query caching minimizes recalculation

**Algorithm Complexity:** O(n × m log m) where n = in-flight deadlines, m = progress per deadline

---

### ✅ Function #6: `getAllUserActivityDays()` - COMPLETE

**Location:** `src/utils/chartDataUtils.ts:477-538`

**Purpose:** Main orchestrator that combines actual activity AND targets for each day in 30-day window.

**Implementation Details:**
- Uses 30-day lookback (passed to `calculateCutoffTime(deadlines, 30)`)
- Aggregates pages read from physical + eBook deadlines
- Aggregates minutes listened from audio deadlines
- For each unique date with activity, calculates targets via `aggregateTargetsByFormat()`
- Returns sparse array (only days with activity OR targets)
- Rounds actual progress to 2 decimal places

**Algorithm Flow:**
```
1. Calculate 30-day cutoff from most recent progress
2. Aggregate dailyPagesRead (physical + eBook)
3. Aggregate dailyMinutesListened (audio)
4. Get all unique dates from both maps
5. For each date:
   - Get actual: pagesRead, minutesListened
   - Calculate targets: targetPages, targetMinutes
   - Include if ANY value > 0
6. Sort by date (oldest to newest)
```

**Return Structure:**
```typescript
[
  {
    date: '2024-01-10',
    pagesRead: 50,
    minutesListened: 0,
    targetPages: 75,
    targetMinutes: 30
  },
  // ... for each day with activity or targets
]
```

**Design Decision - Sparse Array:**
- Only includes days where something happened
- Skips days with no progress AND no targets
- Chart library handles sparse data well

**Performance:**
- O(n × m log m) for 30 days × in-flight deadlines
- Typical: 30 × 8 × log(30) ≈ 1,200 ops (~30ms)
- React Query caching prevents repeated calculations

**Algorithm Complexity:** O(d × n × m log m) where d = days, n = deadlines, m = progress per deadline

---

### ✅ Bonus: Updated `calculateCutoffTime()` - COMPLETE

**Location:** `src/utils/paceCalculations.ts:73-95`

**Change:** Added optional `daysToConsider` parameter (default: 21)
- Maintains backward compatibility
- Allows chart to use 30-day window
- Called as: `calculateCutoffTime(deadlines, 30)`

---

---

## Session 1 Progress Summary (2025-01-06)

### ✅ COMPLETED - Phase 1: Core Algorithm Implementation

**All helper functions implemented and TypeScript-compliant:**

1. ✅ `getProgressAsOfDate()` - src/utils/chartDataUtils.ts:214-260
2. ✅ `getDeadlinesActiveOnDate()` - src/utils/chartDataUtils.ts:274-296
3. ✅ `calculateHistoricalRequiredPace()` - src/utils/chartDataUtils.ts:322-344
4. ✅ `getDeadlinesInFlightOnDate()` - src/utils/chartDataUtils.ts:366-400
5. ✅ `aggregateTargetsByFormat()` - src/utils/chartDataUtils.ts:421-446
6. ✅ `getAllUserActivityDays()` - src/utils/chartDataUtils.ts:477-538
7. ✅ `UserActivityDay` interface - src/utils/chartDataUtils.ts:451-457
8. ✅ Updated `calculateCutoffTime()` - src/utils/paceCalculations.ts:73-95 (added optional days parameter)

**All functions pass TypeScript compilation ✅**

### ✅ COMPLETED - Phase 2: Chart Component Update

**File:** `src/components/charts/UserReadingLineChart.tsx`

**Changes made:**
- ✅ Replaced `getAllUserReadingDays()` with `getAllUserActivityDays()`
- ✅ Added `useMemo` for performance optimization
- ✅ Updated title to "Reading Activity & Targets"
- ✅ Added legend with 4 color-coded lines
- ✅ Configured LineChart with 4 data series (data, data2, data3, data4)
- ✅ Enhanced pointerConfig to show all 4 metrics on tap
- ✅ Increased chart height to 200px for better readability
- ✅ Added legend styles

### ⚠️ REMAINING ISSUE - Color Definitions

**Problem:** Chart references `colors.tertiary` and `colors.quaternary` which don't exist in theme.

**Available colors from theme:**
- ✅ `colors.primary` (Line 1 - Pages Read)
- ✅ `colors.secondary` (Line 2 - Minutes Listened)
- ❌ `colors.tertiary` (Line 3 - Target Pages) - NOT IN THEME
- ❌ `colors.quaternary` (Line 4 - Target Minutes) - NOT IN THEME

**Suggested alternatives for next session:**
- Use `colors.accent` for Line 3 (Target Pages)
- Use `colors.orange` or `colors.peach` for Line 4 (Target Minutes)
- Or add `tertiary` and `quaternary` to Colors.ts

**TypeScript errors to fix:**
```
src/components/charts/UserReadingLineChart.tsx:
- Lines 103, 107: Property 'tertiary'/'quaternary' does not exist (legend)
- Lines 138, 140: Property 'tertiary' does not exist (chart config)
- Lines 146, 148: Property 'quaternary' does not exist (chart config)
- Lines 236, 239: Property 'tertiary'/'quaternary' does not exist (pointer tooltip)
```

### 📋 REMAINING TASKS

**Immediate (Next Session):**
1. Fix color references in UserReadingLineChart.tsx
2. Test chart visually on device/simulator
3. Verify all 4 lines display correctly
4. Check performance with real user data

**After Visual Testing:**
5. Write comprehensive tests for all 6 new functions
6. Run `npm run lint && npm run typecheck`
7. Test edge cases (no deadlines, only audio, only reading, etc.)

---

## Implementation Checklist

### Phase 1: Core Algorithm ✅ COMPLETE
- [x] Update `calculateCutoffTime()` to support 30 days
- [x] Create `getProgressAsOfDate()` helper
- [x] Create `getDeadlinesActiveOnDate()` helper
- [x] Create `getDeadlinesInFlightOnDate()` helper
- [x] Create `calculateHistoricalRequiredPace()` helper
- [x] Create `aggregateTargetsByFormat()` helper
- [x] Create `getAllUserActivityDays()` main function
- [x] Create `UserActivityDay` type interface

### Phase 2: Chart Component ✅ MOSTLY COMPLETE
- [x] Import new function (`getAllUserActivityDays`)
- [x] Update data transformation (4 chartData arrays)
- [x] Add lines 2, 3, 4 to LineChart
- [x] Update maxValue calculation (across all 4 lines)
- [x] Add legend component
- [x] Update title ("Reading Activity & Targets")
- [x] Add memoization (`useMemo`)
- [ ] **FIX COLOR REFERENCES** (tertiary/quaternary don't exist)
- [ ] Test visually on device/simulator

### Phase 3: Type Safety ⚠️ IN PROGRESS
- [x] Create chart types (`UserActivityDay` interface)
- [ ] Fix color references (tertiary/quaternary)
- [ ] Run `npm run typecheck` (currently has 8 errors in chart file)
- [ ] Fix type errors

### Phase 4: Testing 🔜 NOT STARTED
- [ ] Write tests for `getProgressAsOfDate()`
- [ ] Write tests for `getDeadlinesActiveOnDate()`
- [ ] Write tests for `getDeadlinesInFlightOnDate()`
- [ ] Write tests for `calculateHistoricalRequiredPace()`
- [ ] Write tests for `aggregateTargetsByFormat()`
- [ ] Write tests for `getAllUserActivityDays()`
- [ ] Test edge cases (no deadlines, only audio, only reading, etc.)
- [ ] Verify 95%+ coverage
- [ ] Run `npm run test`

### Phase 5: Final Validation 🔜 NOT STARTED
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck` (must pass)
- [ ] Test all manual scenarios (from plan)
- [ ] Verify performance (<100ms render)
- [ ] Test on different screen sizes
- [ ] Visual QA on device/simulator

### Phase 6: Polish (Optional) 🔜 NOT STARTED
- [ ] Adjust colors for better contrast
- [ ] Fine-tune legend positioning
- [ ] Add loading states
- [ ] Handle additional edge cases in UI
- [ ] Consider separate charts toggle option

---

## Notes & Decisions

**Date:** 2025-01-06

**Key Decisions:**
1. Runtime calculation chosen over database table for simplicity and flexibility
2. Historical targets show what the pace requirement was on each past day
3. Targets aggregate across all active deadlines (sum, not average)
4. 30-day window for consistency with typical usage patterns
5. All 4 lines on one chart for unified view

**Performance Assumptions:**
- Typical user: 5-15 active deadlines
- 30 days × 15 deadlines = 450 calculations
- Modern devices handle this in <50ms
- React Query caching prevents repeated calculations

**Follow-up Questions:**
- Should we add a toggle to show/hide target lines?
- Do we need different colors for light/dark mode?
- Should empty lines (0 values) be hidden or displayed?

