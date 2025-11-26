# Expandable Deadline Card with Progress Scrubber - Implementation Plan

**Created**: 2025-11-17
**Status**: 🚧 In Progress
**Current Phase**: Phase 2 - Detail Page Refactor Complete

---

## 📋 Overview

Transform the deadline update experience by creating an expandable card component that combines DeadlineCard with a progress scrubber and quick action buttons, eliminating the need to navigate to the detail page for common updates.

### Goals
- ✅ Remove quick action buttons (+1, +5, +10 pages)
- ✅ Add intuitive progress scrubber (like media player)
- ✅ Create expandable deadline cards for list views
- ✅ Add quick action buttons (Status, Calendar, Edit, Notes)
- ✅ Reduce navigation friction for progress updates
- ✅ Clean up unused components and code

---

## 🗺️ Implementation Phases

### Phase 1: ReadingProgressUpdate Refactor ✅
**Status**: Complete - Detail Page Matches Mock Design
**Estimated Time**: 6-8 hours
**Actual Time**: 4 hours

#### Tasks
- [x] Remove QuickActionButtons import and usage
- [x] Remove `handleQuickUpdate` function
- [x] Remove quick action UI elements (buttons, labels, divider)
- [x] Add progress scrubber
- [x] Connect scrubber to react-hook-form
- [x] Display format-specific values (pages vs time)
- [x] Show percentage complete
- [x] Create MetricCard component (large toggleable metric)
- [x] Create DateRangeDisplay component
- [x] Integrate DeadlineCardActions into detail page
- [x] Remove ProgressHeader, ProgressInput, ProgressStats, ProgressBar from detail page
- [x] Update layout to match mock design
- [x] Fix scrubber right label behavior for time format
- [x] Update ReadingProgressUpdate tests (42 tests passing, including +/- button tests)
- [x] Delete QuickActionButtons.tsx
- [x] Delete QuickActionButtons.test.tsx
- [x] Clean up `calculateNewProgress` utility (removed - was unused)

#### Verification Checklist
- [x] Detail page (`/deadline/[id]`) shows scrubber instead of quick buttons
- [x] Scrubber updates form value in real-time
- [x] Save button persists progress correctly
- [x] Backward progress warning still works
- [x] Completion dialog appears at 100%
- [x] Works for both page and time formats
- [x] Paused deadlines show disabled scrubber
- [x] All tests passing (42/42 tests)

#### Notes
**2025-11-17** (Initial scrubber implementation):
- ✅ Removed QuickActionButtons component and all related code
- ✅ Removed `calculateNewProgress` utility function (no longer needed)
- ✅ Removed 240+ lines of tests for calculateNewProgress
- ✅ All remaining utils tests passing (33 tests)
- ✅ Implemented progress scrubber with:
  - Real-time value updates (using local state + setValue)
  - Format-specific display (formatProgressDisplay for pages vs time)
  - Percentage complete display
  - Disabled state support for paused deadlines
  - Theme integration (colors.primary, colors.border)
  - Synchronized with external progress changes via useEffect
- ✅ Maintained all existing functionality (backward progress warnings, completion dialog)
- ✅ Committed changes: feat: replace quick action buttons with progress scrubber

**2025-11-18** (Detail page refactor to match mock):
- ✅ Created `MetricCard.tsx` component:
  - Large toggleable metric display (tap to switch remaining ↔ current)
  - Shows formatted value with 50px font (pages or time)
  - Shows percentage complete below
  - Dynamic label: "PAGES LEFT"/"CURRENT PAGE" or "TIME LEFT"/"CURRENT POSITION"
  - Urgency-based coloring for metric value
  - Full test coverage (15 tests)
- ✅ Created `DateRangeDisplay.tsx` component:
  - Shows "Started/Added: X" and "Due: Y" below scrubber
  - Uses dayjs().fromNow() for relative start dates
  - Uses absolute format for due dates
  - Full test coverage (6 tests)
- ✅ Refactored ReadingProgressUpdate to match mock design:
  - Removed ProgressHeader (no header needed)
  - Removed ProgressInput (scrubber-only input)
  - Removed ProgressStats (replaced by MetricCard)
  - Removed ProgressBar (redundant with scrubber)
  - Added MetricCard with toggle state management
  - Added DateRangeDisplay below scrubber
  - Integrated DeadlineCardActions (4 buttons: Status, Calendar, Edit, Notes)
  - Updated layout: MetricCard → Scrubber → DateRange → Save Button → Actions
  - Changed button label from "Update Progress" to "Save"
- ✅ Fixed scrubber right label behavior:
  - Audio format + "remaining" view: Shows total time (e.g., "10h 0m")
  - Audio format + "current" view: Shows remaining + " left" (e.g., "7h 30m left")
  - Pages format: Always shows total + " pages" (e.g., "400 pages")
- ✅ Fixed import errors (DeadlineCardActions named export)
- ✅ Fixed TypeScript errors (UrgencyLevel type)
- ✅ Fixed lint errors (React imports in tests)
- ✅ Removed unused variables (control, remaining, progressPercentage)
- 🎯 **CHECKPOINT**: Detail page now matches mock design - Ready for user testing

**2025-11-18** (Scrubber improvements and simplification):
- ✅ Added increment/decrement buttons (+/-) flanking the scrubber:
  - Decrement button (minus icon) on left - decreases by 1
  - Increment button (plus icon) on right - increases by 1
  - Haptic feedback on press
  - Disabled when at min/max or paused
  - Uses ThemedIconButton component
- ✅ Added minus icon mapping for Android (`minus: 'remove'` in IconSymbol.tsx)
- ✅ Simplified scrubber to direct 1:1 mapping:
  - Removed velocity-based sensitivity calculations
  - Removed distance threshold logic
  - Removed calculateSensitivity function
  - Thumb now follows finger position directly (no lag, no jumping)
  - Scrubber for coarse adjustments, +/- buttons for exact values
- ✅ Cleaned up gesture handling:
  - Removed lastUpdateTime and lastTranslationX tracking
  - Simplified pan gesture to ~15 lines (from ~50 lines)
  - Direct fingerPosition calculation: dragStart + (translation / width) * total
  - Much simpler, more predictable behavior

**2025-11-18** (Extract DeadlineCardActions into section wrapper):
- ✅ Created `DeadlineActionsSection.tsx` wrapper component:
  - Wraps `DeadlineCardActions` with standard section styling
  - Includes "Quick Actions" header with variant="title"
  - Uses `Spacing.md` padding, `BorderRadius.md`, standard shadow
  - Always visible (no conditional rendering)
  - Full test coverage (11 test cases)
- ✅ Removed `DeadlineCardActions` from `ReadingProgressUpdate.tsx`:
  - Removed import statement
  - Removed component usage from JSX
  - Actions now only appear once on detail page (via DeadlineActionsSection)
- ✅ Updated detail page (`src/app/deadline/[id]/index.tsx`):
  - Added `DeadlineActionsSection` import
  - Positioned after `DeadlineHeroSection`, before `ReadingProgressUpdate`
  - Provides consistent section styling with other sections
- ✅ Updated exports in `src/components/features/deadlines/index.ts`
- 📝 **Architecture Note**: Dual usage strategy:
  - **Detail page**: Uses `DeadlineActionsSection` (with section header and styling)
  - **Future expandable card**: Will use `DeadlineCardActions` directly (compact, no wrapper)
  - This separation allows flexibility: full section treatment in detail view, minimal space in list view


---

### Phase 2: DeadlineCardActions Component ✅
**Status**: Complete - Ready for Integration
**Estimated Time**: 6-8 hours
**Actual Time**: 1 hour

#### Tasks
- [x] Create `DeadlineCardActions.tsx` component (renamed to avoid conflict with existing component)
- [x] Implement Status button (toggle reading ↔ paused)
- [x] Implement Calendar button (open UpdateDeadlineDateModal)
- [x] Implement Edit button (navigate to edit screen)
- [x] Implement Notes button (navigate to notes screen)
- [x] Use IconSymbol for all icons
- [x] Style with circular buttons + labels
- [x] Wire up existing mutation hooks
- [x] Add success/error toast handling
- [x] Create DeadlineCardActions.test.tsx (18 tests, all passing)
- [x] Export from deadlines index.ts

#### Component Structure
```tsx
DeadlineCardActions
├── Status Button (arrow.left.arrow.right icon)
├── Calendar Button (calendar.badge.clock icon)
├── Edit Button (pencil icon)
└── Notes Button (note.text icon)
```

#### Verification Checklist
- [x] All 4 buttons render correctly
- [x] Status button toggles deadline status
- [x] Calendar button opens date picker modal
- [x] Edit button navigates to edit screen
- [x] Notes button navigates to notes screen
- [x] Appropriate icons display
- [x] Buttons respect theme colors
- [x] All tests passing (18/18)

#### Notes
**2025-11-17**:
- ✅ Component renamed to `DeadlineCardActions` to avoid naming conflict with existing `DeadlineActionButtons` (used on detail page)
- ✅ Used `arrow.left.arrow.right` icon for status button as requested
- ✅ Implemented all 4 buttons with proper accessibility labels
- ✅ Calendar button opens existing `UpdateDeadlineDateModal` (no inline popover needed)
- ✅ Integrated with `pauseDeadline` and `resumeDeadline` from DeadlineProvider
- ✅ Toast notifications for success/error states
- ✅ All 18 unit tests passing
- 🎯 **CHECKPOINT**: Ready for Phase 3 integration


---

### Phase 3: ExpandableDeadlineCard Component ⏳
**Status**: Pending
**Estimated Time**: 10-12 hours

#### Tasks
- [ ] Create `ExpandableDeadlineCard.tsx` component
- [ ] Implement collapsed state (existing card design)
- [ ] Implement expanded state with scrubber
- [ ] Add large metric display (toggleable remaining/current)
- [ ] Integrate ProgressScrubber from Phase 1
- [ ] Integrate DeadlineCardActions from Phase 2
- [ ] Add Save button above action buttons
- [ ] Add Collapse button at bottom
- [ ] Create expansion animation (smooth height transition)
- [ ] Create `useExpandableDeadlineCard.ts` hook
- [ ] Handle form state for progress updates
- [ ] Wire up progress mutations
- [ ] Add metric toggle logic (remaining ↔ current)
- [ ] Create ExpandableDeadlineCard.test.tsx
- [ ] Export from deadlines index.ts

#### Component Structure
```
ExpandableDeadlineCard
├── Collapsed State (tap to expand)
│   ├── Book cover thumbnail
│   ├── Title + status badge
│   ├── Daily progress needed
│   ├── Due date
│   ├── Days countdown badge
│   └── Progress bar (visual only)
└── Expanded State
    ├── Large metric card (toggleable)
    ├── Progress scrubber
    ├── Date range display
    ├── Save button
    ├── DeadlineActionButtons
    └── Collapse button
```

#### Verification Checklist
- [ ] Card expands on tap
- [ ] Only one card expands at a time (controlled by parent)
- [ ] Smooth expansion animation (60fps)
- [ ] Metric toggle works (remaining ↔ current)
- [ ] Scrubber updates progress
- [ ] Save button persists changes
- [ ] Action buttons work in expanded state
- [ ] Collapse button closes card
- [ ] Paused deadlines show disabled scrubber
- [ ] Works for both page and time formats
- [ ] All tests passing

#### Notes
_Document any issues, decisions, or learnings here_


---

### Phase 4: Integration into DeadlinesList ⏳
**Status**: Pending
**Estimated Time**: 4-6 hours

#### Tasks
- [ ] Update `DeadlinesList.tsx` to use ExpandableDeadlineCard
- [ ] Add `expandedId` state management
- [ ] Replace DeadlineCard with ExpandableDeadlineCard for active deadlines
- [ ] Keep regular DeadlineCard for completed/archived
- [ ] Ensure only one card expands at a time
- [ ] Handle progress update callbacks
- [ ] Test auto-collapse on navigation
- [ ] Update component exports

#### Integration Logic
```tsx
const [expandedId, setExpandedId] = useState<string | null>(null);

// For each deadline:
{isActiveDeadline(deadline) ? (
  <ExpandableDeadlineCard
    deadline={deadline}
    isExpanded={expandedId === deadline.id}
    onToggle={() => setExpandedId(prev => prev === deadline.id ? null : deadline.id)}
  />
) : (
  <DeadlineCard deadline={deadline} />
)}
```

#### Verification Checklist
- [ ] List view shows expandable cards for active deadlines
- [ ] Regular cards show for completed/archived
- [ ] Expanding one card collapses others
- [ ] Progress updates reflect immediately in list
- [ ] Smooth scrolling with expanded cards
- [ ] No performance issues with 20+ deadlines
- [ ] Action buttons work from list view
- [ ] Navigation flows work correctly

#### Notes
_Document any issues, decisions, or learnings here_


---

### Phase 5: Testing & QA ⏳
**Status**: Pending
**Estimated Time**: 8-10 hours

#### Tasks
- [ ] Run all unit tests (`npm test`)
- [ ] Verify >80% code coverage maintained
- [ ] Update Maestro E2E test: `progress-complete-deadline.yaml`
- [ ] Create new Maestro test: `expandable-card-flow.yaml`
- [ ] Manual testing on iOS simulator
- [ ] Manual testing on Android emulator
- [ ] Test with 50+ deadlines (performance)
- [ ] Test all deadline statuses (pending, reading, paused, complete)
- [ ] Test both formats (pages and time/audio)
- [ ] Accessibility testing (VoiceOver/TalkBack)
- [ ] Profile animation performance

#### Manual Test Checklist
- [ ] Expand/collapse feels smooth and responsive
- [ ] Scrubber drag interaction feels natural
- [ ] Only one card expands at a time
- [ ] Backward progress warning appears correctly
- [ ] Completion dialog shows at 100%
- [ ] Status toggle (reading ↔ paused) works
- [ ] Calendar modal opens and updates date
- [ ] Edit navigation works
- [ ] Notes navigation works
- [ ] Paused deadlines disable scrubber
- [ ] List scrolling smooth with expanded cards
- [ ] Works on both iOS and Android
- [ ] No console errors or warnings

#### Test Files Updated
- [x] `ReadingProgressUpdate.test.tsx` (42 tests passing - added +/- button tests)
- [x] `DeadlineCardActions.test.tsx` (new - 18 tests passing)
- [ ] `ExpandableDeadlineCard.test.tsx` (new)
- [ ] `progressUpdateUtils.test.ts`
- [ ] Maestro E2E tests

#### Notes
_Document any bugs found and fixes applied_


---

### Phase 6: Cleanup & Documentation ⏳
**Status**: Pending
**Estimated Time**: 4-6 hours

#### Tasks
- [ ] Delete `QuickActionButtons.tsx` (if not done in Phase 1)
- [ ] Delete `QuickActionButtons.test.tsx` (if not done in Phase 1)
- [ ] Remove `calculateNewProgress` if unused
- [ ] Clean up any dead imports
- [ ] Remove commented-out code
- [ ] Update `TESTING.md` documentation
- [ ] Add usage examples to component docs
- [ ] Review and update type definitions
- [ ] Final code review (no `any` types, proper exports)
- [ ] Update this document with final notes
- [ ] Mark plan as complete

#### Code Cleanup Checklist
- [ ] No unused imports
- [ ] No commented code
- [ ] No `any` types
- [ ] All exports properly typed
- [ ] Consistent formatting
- [ ] No console.log statements

#### Documentation Updated
- [ ] `TESTING.md` - Remove QuickActionButtons references
- [ ] `TESTING.md` - Add ExpandableDeadlineCard section
- [ ] Component README files (if applicable)
- [ ] This implementation plan finalized

#### Notes
_Final notes and learnings from the implementation_


---

## 📁 Files Reference

### Files Created
1. ✅ `docs/EXPANDABLE_CARD_IMPLEMENTATION.md` (this file)
2. ✅ `src/components/features/deadlines/DeadlineCardActions.tsx` (renamed from DeadlineActionButtons)
3. ✅ `src/components/features/deadlines/DeadlineActionsSection.tsx` (section wrapper for DeadlineCardActions)
4. ✅ `src/components/progress/MetricCard.tsx` (large toggleable metric card)
5. ✅ `src/components/progress/DateRangeDisplay.tsx` (date range below scrubber)
6. ✅ `src/components/features/deadlines/__tests__/DeadlineCardActions.test.tsx`
7. ✅ `src/components/features/deadlines/__tests__/DeadlineActionsSection.test.tsx`
8. ✅ `src/components/progress/__tests__/MetricCard.test.tsx`
9. ✅ `src/components/progress/__tests__/DateRangeDisplay.test.tsx`
10. ⏳ `src/components/features/deadlines/ExpandableDeadlineCard.tsx`
11. ⏳ `src/hooks/useExpandableDeadlineCard.ts`
12. ⏳ `src/components/features/deadlines/__tests__/ExpandableDeadlineCard.test.tsx`
13. ⏳ `maestro/expandable-card-flow.yaml` (optional)

### Files Modified
1. ✅ `src/components/progress/ReadingProgressUpdate.tsx` - Fully refactored to match mock design
   - Removed ProgressHeader, ProgressInput, ProgressStats, ProgressBar
   - Added MetricCard, DateRangeDisplay (DeadlineCardActions now removed - moved to section wrapper)
   - Added +/- increment/decrement buttons
   - Simplified scrubber to direct 1:1 mapping
   - Updated scrubber right label to be dynamic
   - Changed layout to match mock
   - Removed DeadlineCardActions import and usage (now in DeadlineActionsSection)
2. ✅ `src/components/progress/__tests__/ReadingProgressUpdate.test.tsx` - Added +/- button tests
3. ✅ `src/components/ui/IconSymbol.tsx` - Added minus icon mapping for Android
4. ✅ `src/app/deadline/[id]/index.tsx` - Added DeadlineActionsSection after DeadlineHeroSection
5. ✅ `src/components/features/deadlines/index.ts` - Added DeadlineCardActions and DeadlineActionsSection exports
6. ⏳ `src/components/features/deadlines/DeadlinesList.tsx`
7. ⏳ `src/components/progress/index.ts`
8. ✅ `src/utils/progressUpdateUtils.ts` - Removed calculateNewProgress
9. ✅ `src/utils/__tests__/progressUpdateUtils.test.ts` - Removed calculateNewProgress tests
10. ⏳ `maestro/progress-complete-deadline.yaml`
10. ⏳ `TESTING.md`

### Files Deleted
1. ✅ `src/components/progress/QuickActionButtons.tsx`
2. ✅ `src/components/progress/__tests__/QuickActionButtons.test.tsx`

---

## 🎯 Success Criteria

- [x] Implementation plan created
- [x] Quick action buttons removed
- [x] Progress scrubber implemented and working
- [x] DeadlineCardActions component created (renamed to avoid conflict)
- [ ] ExpandableDeadlineCard component created
- [ ] Integration into list views complete
- [ ] Users can update progress from list without navigation
- [ ] All 4 action buttons functional (Status, Calendar, Edit, Notes)
- [ ] Only one card expands at a time
- [ ] Smooth 60fps animations
- [ ] All tests passing (unit + integration + E2E)
- [ ] >80% code coverage maintained
- [ ] No regressions in existing functionality
- [ ] Unused code cleaned up
- [ ] Documentation updated

---

## 📊 Progress Tracking

| Phase | Status | Time Spent | Notes |
|-------|--------|------------|-------|
| Phase 1: ReadingProgressUpdate | ✅ Complete | 4h | Detail page fully refactored to match mock design |
| Phase 2: DeadlineCardActions | ✅ Complete | 1h | 4 buttons implemented, 18 tests passing |
| Phase 3: ExpandableDeadlineCard | ⏳ Pending | - | Will reuse MetricCard, scrubber, and actions from Phase 1 |
| Phase 4: Integration | ⏳ Pending | - | - |
| Phase 5: Testing & QA | ⏳ Pending | - | - |
| Phase 6: Cleanup | ⏳ Pending | - | - |

**Legend**: ⏳ Pending | 🚧 In Progress | ✅ Complete | ❌ Blocked

---

## 🔧 Technical Decisions

### Decision 1: Scrubber Component
**Question**: Create separate ProgressScrubber component or inline in ReadingProgressUpdate?
**Decision**: _TBD - Will decide during Phase 1_
**Rationale**: _To be documented_

### Decision 2: Detail Page Behavior ✅
**Question**: Keep ReadingProgressUpdate on detail page or remove it?
**Decision**: Keep and enhance ReadingProgressUpdate to match the expandable card design
**Rationale**: The detail page provides a focused, full-screen experience for progress updates. By refactoring ReadingProgressUpdate to match the expandable card mock (MetricCard, scrubber, DateRangeDisplay, DeadlineCardActions), we provide users with two paths:
1. **Quick updates from list**: Expandable cards for common updates without navigation
2. **Focused updates from detail page**: Full-screen experience for more involved updates or when accessing via notifications/deep links

This dual approach gives users flexibility while maintaining consistency in the UI/UX across both contexts.

### Decision 3: Calendar Quick Actions ✅
**Question**: Inline quick date buttons (+7, +14, +30 days) or just open modal?
**Decision**: Open existing UpdateDeadlineDateModal (no inline popover)
**Rationale**: The existing UpdateDeadlineDateModal already provides quick date buttons (+1 week, +2 weeks, +1 month, end of month) along with a full calendar picker. Reusing this component provides a consistent UX and avoids duplicating functionality. The modal is well-tested and familiar to users.

---

## 🐛 Issues & Resolutions

_Document any bugs, blockers, or unexpected issues encountered during implementation_

### Issue #1
**Phase**: _TBD_
**Description**: _TBD_
**Resolution**: _TBD_
**Date**: _TBD_

---

## 💡 Learnings & Improvements

_Document any insights, patterns, or improvements discovered during implementation_

---

## 📝 Notes

- Mock design reference: [progress-bar-update.tsx](../progress-bar-update.tsx)
- Icon library: IconSymbol (SF Symbols for iOS, Material Icons for Android)
- Form library: react-hook-form with Zod validation
- Animation target: 60fps smooth transitions
- Accessibility: Must support VoiceOver and TalkBack

---

**Last Updated**: 2025-11-18
**Next Checkpoint**: Phase 3 - ExpandableDeadlineCard Component Implementation

**Session Summary (2025-11-18)**:
- ✅ Created MetricCard and DateRangeDisplay components with full test coverage
- ✅ Refactored ReadingProgressUpdate to match mock design exactly
- ✅ Integrated DeadlineCardActions into detail page
- ✅ Fixed scrubber right label behavior for time format
- ✅ Added +/- increment/decrement buttons with haptic feedback
- ✅ Simplified scrubber from velocity-based to direct 1:1 mapping
- ✅ Added Android icon mapping for minus icon
- ✅ Reduced gesture code complexity by ~70% (50 lines → 15 lines)
- ✅ Extracted DeadlineCardActions into DeadlineActionsSection wrapper
- ✅ Positioned actions section on detail page (after hero, before progress)
- ✅ Created DeadlineActionsSection with section styling (11 tests passing)
- ✅ All lint and typecheck errors resolved
- 🎯 Detail page now provides simple, predictable progress scrubbing
- 📝 Phase 3 can now reuse DeadlineCardActions directly (compact) while detail page uses section wrapper (full styling)
