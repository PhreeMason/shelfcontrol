# Custom Shelves Feature - Product Requirements Document

> **Status**: Phase 1 Complete ✅
> **Last Updated**: December 1, 2024
> **Review Notes**: Phase 1 complete. ShelfProvider architecture refactor done.

---

## Table of Contents

1. [Vision](#vision)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Stories](#user-stories)
5. [Feature Overview](#feature-overview)
6. [Phase 1: Foundation](#phase-1-foundation)
7. [Phase 2: Custom Shelves](#phase-2-custom-shelves)
8. [Phase 3: Advanced Features](#phase-3-advanced-features)
9. [Technical Architecture](#technical-architecture)
10. [UI/UX Specifications](#uiux-specifications)
11. [Database Schema](#database-schema)
12. [Implementation Plan](#implementation-plan)
13. [Open Questions](#open-questions)
14. [Appendix](#appendix)

---

## Vision

Inspired by Threads app's "Feeds" feature, implement a **Custom Shelves** system that allows users to create personalized views of their deadlines. This replaces/enhances the current rigid filter system where filters reset when switching between status tabs.

**Terminology**: "Shelves" (fits ShelfControl brand)

---

## Problem Statement

### Current Limitations

1. **Filters tied to status tabs** - Active, Pending, Completed, etc. are fixed
2. **Filters reset on tab switch** - Time range, formats, types, tags, excluded statuses all reset
3. **No saved views** - Users can't save filter combinations for quick access
4. **Fixed tab bar** - Can't customize which tabs appear for quick access
5. **No cross-status filtering** - Can't create a view like "All ARCs from Publisher X due this month" (this is technically possible from the "All" tab but it resets on tab switch)

### User Pain Points

- "I always want to see my overdue items but I have to manually switch to that tab"
- "I wish I could have a quick view of just my NetGalley ARCs"
- "Every time I switch tabs, my filters reset and I have to set them up again"

---

## Goals & Success Metrics

### Goals

1. Allow users to create custom filtered views of their deadlines
2. Let users customize which views appear in the quick-access tab bar
3. Persist filter combinations so users don't lose their setup
4. Provide a foundation for more advanced filtering in the future

### Success Metrics

- [ ] Users can pin/unpin shelves to customize tab bar
- [ ] Shelf selection persists across app sessions
- [ ] Custom shelves can be created with multiple filter criteria (Phase 2)
- [ ] User engagement with shelf panel (analytics)

---

## User Stories

### Phase 1

1. **As a user**, I want to see all available shelves in a slide-out panel so I can quickly switch between different views
2. **As a user**, I want to see how many deadlines are in each shelf so I know where my items are
3. **As a user**, I want to pin my most-used shelves to the tab bar so I can access them quickly
4. **As a user**, I want to unpin shelves I don't use often to reduce clutter

### Phase 2

5. **As a user**, I want to create a custom shelf with specific filters so I can save my preferred view
6. **As a user**, I want to name and customize my shelf so I can identify it easily
7. **As a user**, I want to edit my custom shelves so I can adjust the filters over time
8. **As a user**, I want to delete custom shelves I no longer need

### Phase 3

9. **As a user**, I want smart shelves that automatically update (e.g., "Due This Week")
10. **As a user**, I want to reorder my shelves so my most important ones are at the top

---

## Feature Overview

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Shelf** | A named, filtered view of deadlines |
| **System Shelf** | Pre-defined shelves (All, Active, Overdue, etc.) |
| **Custom Shelf** | User-created shelf with custom filters |
| **Pinned Shelf** | Shelf that appears in the horizontal tab bar |
| **Shelf Panel** | Slide-out panel showing all shelves |

### Shelf Types

| Type | Examples | Editable | Deletable |
|------|----------|----------|-----------|
| System (Always Visible in Shelf Panel) | All, Applied, Pending, Active, Overdue, Paused, To Review, Completed, DNF | No | No |
| System (Conditional) | Rejected, Withdrew *(only appear if user has items)* | No | No |
| Custom | "NetGalley ARCs", "Due This Month", "Audio Books" | Yes | Yes |

### System Shelves Reference

| Shelf ID | Display Name | Visibility | Default Pinned |
|----------|--------------|------------|----------------|
| `all` | All | Always | Yes |
| `applied` | Applied | Always | Yes |
| `pending` | Pending | Always | Yes |
| `active` | Active | Always | Yes |
| `overdue` | Past Due | Always | Yes |
| `paused` | Paused | Always | Yes |
| `toReview` | To Review | Always | Yes |
| `completed` | Completed | Always | Yes |
| `didNotFinish` | DNF | Always | Yes |
| `rejected` | Rejected | If count > 0 | No |
| `withdrew` | Withdrew | If count > 0 | No |

---

## Phase 1: Foundation

### Scope

Build the infrastructure for Custom Shelves with the slide-out panel, using only system shelves.

### Features

1. **Shelf Panel**
   - Slide-out from left (like Threads)
   - Shows all system shelves
   - Deadline count next to each shelf
   - Pin/unpin toggle for each shelf

2. **Shelf Tab Bar**
   - Enhaced version or replacement of current horizontal filter tabs
   - Shows only pinned shelves
   - Menu button to open full panel
   - Scrollable if many shelves pinned

3. **Shelf Selection**
   - Tapping shelf filters main view
   - Selected shelf highlighted in panel and tab bar
   - Selection persists across sessions
   - **Selecting a shelf clears all advanced filters** (time range, formats, tags, etc.)
   - **Pinned shelves display in fixed order** (All → Applied → Pending → Active → Past Due → Paused → To Review → Completed → DNF → Rejected → Withdrew)

4. **Filter Behavior**
   - Selecting any shelf calls `clearAllFilters()` and resets all FilterSheet filters
   - FilterSheet remains available for temporary/session-only filtering
   - Filters do NOT persist when switching between shelves
 
5. **Pin Management**
   - Users can pin/unpin any system shelf
   - Pinned shelves appear in tab bar
   - Pin state persists via AsyncStorage

### Out of Scope (Phase 1)

- Creating custom shelves
- Editing shelves
- Reordering shelves
- Database storage

---

## Phase 2: Custom Shelves

> **Inspiration**: See `inspiration/2025-11-30 00.37.40.jpg` through `00.37.56.jpg` for Threads create/edit flow

### Scope

Allow users to create, edit, and delete custom shelves with filter criteria.

### Features

1. **Create Shelf Flow** *(See `00.37.47.jpg` and `00.37.52.jpg`)*
   - Step 1: Name, description, icon, color
   - Step 2: Add filter criteria
   - Step 3: (Optional) Add specific deadlines

2. **Filter Criteria** *(See `00.37.56.jpg` for topic/tag selection UI)*
   - Statuses (include/exclude)
   - Tags (with search + suggested tags)
   - Types (deadline types)
   - Sources (publishers)
   - Date ranges
   - Formats (physical, eBook, audio)
   - Page ranges

3. **Edit Shelf**
   - Modify name, icon, color
   - Update filter criteria
   - Add/remove specific deadlines

4. **Delete Shelf**
   - Confirmation dialog
   - Cannot delete system shelves

5. **Database Storage**
   - Custom shelves stored in Supabase
   - Filter criteria as JSONB
   - Syncs across devices

6. **Cross-Device Sync**
   - Custom shelves sync immediately via Supabase
   - `is_pinned` column controls tab bar visibility
   - Changes on one device reflect on all user's devices

7. **Manage Shelves Screen** *(See `00.37.40.jpg`)*
   - Reorder with drag handles
   - Edit/delete individual shelves
   - "Create new shelf" at top

---

## Phase 3: Advanced Features

### Scope

Enhanced functionality for power users.

### Features

1. **Smart Shelves**
   - Dynamic criteria (e.g., "Due This Week", "Added Recently")
   - Auto-updating counts

2. **Shelf Reordering**
   - Drag & drop in panel
   - Custom sort order persisted

3. **Shelf-Specific Settings**
   - Per-shelf sort order
   - Per-shelf display options

4. **Quick Actions**
   - Bulk actions from shelf panel
   - "Mark all as read" type operations

5. **Sharing**
   - Export shelf configuration
   - Import shared shelves

---

## Technical Architecture

### Components

```
src/
├── types/
│   └── shelves.types.ts          # Type definitions
├── constants/
│   └── shelves.ts                # System shelf definitions
├── hooks/
│   └── useShelfCounts.ts         # Compute deadline counts
├── components/features/shelves/
│   ├── index.ts                  # Exports
│   ├── ShelvesPanel.tsx          # Slide-out panel
│   ├── ShelfRow.tsx              # Individual shelf row
│   └── ShelfTabBar.tsx           # Horizontal pinned tabs
└── providers/
    └── PreferencesProvider.tsx   # (modified) Add pinnedShelves state
```

### Data Flow

```
User taps shelf in panel
        ↓
ShelvesPanel calls onSelectShelf(shelfId)
        ↓
Home screen updates selectedFilter (PreferencesProvider)
        ↓
FilteredDeadlines re-filters based on new selection
        ↓
DeadlinesList updates with filtered results
```

### State Management

| State | Location | Persistence |
|-------|----------|-------------|
| `selectedShelf` | PreferencesProvider | AsyncStorage |
| `pinnedShelves` | PreferencesProvider | AsyncStorage |
| `isPanelOpen` | Home screen local state | None |
| Custom shelves | Supabase (Phase 2) | Database |

### AsyncStorage Keys (Phase 1)

Following the existing `@preferences/*` pattern in PreferencesProvider:

```typescript
const SHELF_STORAGE_KEYS = {
  SELECTED_SHELF: '@shelves/selectedShelf',   // SystemShelfId
  PINNED_SHELVES: '@shelves/pinnedShelves',   // SystemShelfId[]
};

// Default pinned shelves (all 9 core system shelves)
const DEFAULT_PINNED_SHELVES: SystemShelfId[] = [
  'all', 'applied', 'pending', 'active', 'overdue',
  'paused', 'toReview', 'completed', 'didNotFinish'
];
```

**Note**: System shelf pins use AsyncStorage (local only). Custom shelf pins (Phase 2) use `custom_shelves.is_pinned` column (synced across devices).

### New PreferencesProvider Functions (Phase 1)

```typescript
// Clear all advanced filters when switching shelves
clearAllFilters(): void {
  setTimeRangeFilter('all');
  setSelectedFormats([]);
  setSelectedPageRanges([]);
  setSelectedTypes([]);
  setSelectedTags([]);
  setExcludedStatuses([]);
  setSortOrder('default');
}

// Select shelf and clear filters
selectShelf(shelfId: SystemShelfId): void {
  clearAllFilters();
  setSelectedShelf(shelfId);
}
```

---

## UI/UX Specifications

### Shelf Panel

> **Inspiration**: See `inspiration/2025-11-30 00.36.56.jpg` for Threads feeds panel layout

**Trigger**: Hamburger menu icon in Header

**Animation**:
- Slide in from left edge
- Duration: 250ms
- Easing: ease-out
- Width: 85% of screen (max 340px)
- Backdrop: rgba(0, 0, 0, 0.4)

**Layout**:
```
┌──────────────────────────────┐
│ Shelves              [Edit]  │  ← Header (like Threads "Feeds" header)
├──────────────────────────────┤
│ ★ All                   (42) │  ← Pinned (filled star)
│ ★ Applied                (5) │  ← Pinned
│ ★ Pending                (8) │  ← Pinned
│ ★ Active                (12) │  ← Pinned
│ ★ Past Due               (3) │  ← Pinned
│ ★ Paused                 (2) │  ← Pinned
│ ★ To Review              (5) │  ← Pinned
│ ★ Completed             (10) │  ← Pinned
│ ★ DNF                    (2) │  ← Pinned
│ ☆ Rejected               (1) │  ← Conditional (only if count > 0)
│ ☆ Withdrew               (1) │  ← Conditional (only if count > 0)
├──────────────────────────────┤
│ + Create new shelf           │  ← Phase 2
└──────────────────────────────┘
```

**Interactions**:
- Tap shelf row → Select shelf, close panel
- Tap star icon → Toggle pin state (don't close panel)
- Tap backdrop → Close panel
- Swipe left → Close panel

### Shelf Tab Bar

**Layout**:
```
┌─────────────────────────────────────────────┐
│ [≡] │ All (42) │ Active (12) │ Overdue (3) │
└─────────────────────────────────────────────┘
       ↑ Selected indicator (underline or background)
```

**Behavior**:
- Horizontal scroll if tabs overflow
- Menu button always visible on left
- Selected tab has visual indicator
- Counts update in real-time

### Visual States

| State | Appearance |
|-------|------------|
| Selected shelf | Highlighted background, bold text |
| Pinned shelf | Filled star icon |
| Unpinned shelf | Outline star icon |
| System shelf | No edit/delete options |
| Conditional shelf (Rejected/Withdrew) | Only visible when count > 0, unpinned by default |
| Empty shelf (0 count) | Show with (0) count, still selectable |

### Colors & Theming

Follow existing app theme tokens:
- Use `colors.surface` for panel background
- Use `colors.primary` for selected state
- Use `colors.textSecondary` for counts
- Use `Spacing` tokens for consistent spacing

---

## Database Schema

> **Note**: Database tables are for Phase 2+. Phase 1 uses only AsyncStorage.

### Tables

```sql
-- Custom shelves table
-- Follows codebase patterns: TEXT id with prefix, handle_times trigger, RLS policies
CREATE TABLE custom_shelves (
  id TEXT NOT NULL PRIMARY KEY DEFAULT generate_prefixed_id('shf_'),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                    -- SF Symbol name
  color TEXT NOT NULL DEFAULT '#B8A9D9',  -- Hex color, default to primary
  is_pinned BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,  -- All filter criteria in one column
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, name)  -- Prevent duplicate shelf names per user
);

-- Enable Row Level Security
ALTER TABLE custom_shelves ENABLE ROW LEVEL SECURITY;

-- RLS Policies (match existing patterns)
CREATE POLICY "Users can view own shelves"
  ON custom_shelves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shelves"
  ON custom_shelves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shelves"
  ON custom_shelves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shelves"
  ON custom_shelves FOR DELETE
  USING (auth.uid() = user_id);

-- Use existing handle_times trigger
CREATE TRIGGER handle_times
  BEFORE INSERT OR UPDATE ON custom_shelves
  FOR EACH ROW
  EXECUTE PROCEDURE handle_times();

-- Indexes
CREATE INDEX custom_shelves_user_id_idx ON custom_shelves(user_id);
CREATE INDEX custom_shelves_user_pinned_idx ON custom_shelves(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX custom_shelves_user_sort_idx ON custom_shelves(user_id, sort_order);

-- Comment describing JSONB structure
COMMENT ON TABLE custom_shelves IS 'User-created custom shelves with filter criteria stored as JSONB';

-- Optional: Specific deadlines manually added to shelf (for Phase 2+)
CREATE TABLE custom_shelf_deadlines (
  id TEXT NOT NULL PRIMARY KEY DEFAULT generate_prefixed_id('shd_'),
  shelf_id TEXT NOT NULL REFERENCES custom_shelves(id) ON DELETE CASCADE,
  deadline_id TEXT NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(shelf_id, deadline_id)
);

ALTER TABLE custom_shelf_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shelf deadlines"
  ON custom_shelf_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shelf deadlines"
  ON custom_shelf_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shelf deadlines"
  ON custom_shelf_deadlines FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER handle_times
  BEFORE INSERT OR UPDATE ON custom_shelf_deadlines
  FOR EACH ROW
  EXECUTE PROCEDURE handle_times();

CREATE INDEX custom_shelf_deadlines_shelf_idx ON custom_shelf_deadlines(shelf_id);
CREATE INDEX custom_shelf_deadlines_deadline_idx ON custom_shelf_deadlines(deadline_id);
CREATE INDEX custom_shelf_deadlines_user_idx ON custom_shelf_deadlines(user_id);
```

### Schema Changes from Original PRD

| Original | Updated | Rationale |
|----------|---------|-----------|
| `UUID` id | `TEXT` id with `generate_prefixed_id('shf_')` | Matches codebase pattern (tags, deadlines, etc.) |
| `is_system` column | Removed | System shelves are hardcoded, not in database |
| Separate `custom_shelf_filters` table | `filters JSONB` column | Simpler, matches `user_settings` pattern |
| `DEFAULT NOW()` timestamps | No default (use trigger) | Matches codebase pattern with `handle_times()` |
| Missing RLS policies | Full RLS policies | Required for Supabase security |
| Missing `handle_times` trigger | Added trigger | Required for `created_at`/`updated_at` |

### Filters JSONB Structure

```typescript
interface ShelfFilters {
  // Status filter (which statuses to include)
  statuses?: DeadlineStatusEnum[];  // e.g., ['reading', 'pending']

  // Exclude specific statuses (only used with 'all' base)
  excludeStatuses?: DeadlineStatusEnum[];

  // Tag IDs to filter by (ANY match)
  tagIds?: string[];  // e.g., ['tg_abc123', 'tg_def456']

  // Deadline types (e.g., 'ARC', 'Personal')
  types?: string[];

  // Book formats
  formats?: BookFormatEnum[];  // ['physical', 'eBook', 'audio']

  // Page/duration ranges
  pageRanges?: PageRangeFilter[];  // ['under300', '300to500', 'over500']

  // Time range relative to deadline date
  timeRange?: TimeRangeFilter;  // 'all' | 'thisWeek' | 'thisMonth'

  // Sort order
  sortOrder?: SortOrder;  // 'default' | 'soonest' | 'latest' | etc.
}
```

### Filter Matching Logic

Custom shelf filters use a **hybrid OR/AND approach**:

- **Within a category**: OR logic (any match succeeds)
- **Across categories**: AND logic (all categories must match)
- **Empty array**: No filter applied (matches all)

**Example:**
```typescript
// Shelf: "NetGalley Audio Books"
{
  types: ['NetGalley', 'Edelweiss'],     // OR: NetGalley OR Edelweiss
  formats: ['audio'],                     // AND with types
  statuses: ['reading', 'pending']        // AND with above
}
// Result: (NetGalley OR Edelweiss) AND audio AND (reading OR pending)
```

**Filter Application Pseudocode:**
```typescript
const matchesShelf = (deadline: Deadline, filters: ShelfFilters): boolean => {
  // Empty filter = no restriction
  const matchesStatuses = !filters.statuses?.length ||
    filters.statuses.includes(deadline.status);

  const matchesTags = !filters.tagIds?.length ||
    deadline.tags.some(t => filters.tagIds!.includes(t.id));

  const matchesTypes = !filters.types?.length ||
    filters.types.includes(deadline.type);

  const matchesFormats = !filters.formats?.length ||
    filters.formats.includes(deadline.format);

  const matchesPageRanges = !filters.pageRanges?.length ||
    filters.pageRanges.some(range => isInPageRange(deadline, range));

  const matchesTimeRange = !filters.timeRange ||
    isInTimeRange(deadline, filters.timeRange);

  // AND across all categories
  return matchesStatuses && matchesTags && matchesTypes &&
         matchesFormats && matchesPageRanges && matchesTimeRange;
};
```

### Filter JSONB Examples

```json
// "NetGalley ARCs" shelf
{
  "types": ["NetGalley"],
  "statuses": ["reading", "pending", "applied"]
}

// "Audio Books Due Soon" shelf
{
  "formats": ["audio"],
  "timeRange": "thisMonth",
  "sortOrder": "soonest"
}

// "Short Reads" shelf (under 300 pages, any active status)
{
  "pageRanges": ["under300"],
  "statuses": ["reading", "pending"]
}

// "Everything except Completed" shelf
{
  "excludeStatuses": ["complete", "did_not_finish", "rejected", "withdrew"]
}
```

### Migration Considerations

1. **No migration needed for Phase 1** - Uses AsyncStorage only
2. **Phase 2 migration** should:
   - Create tables with proper RLS
   - NOT migrate existing AsyncStorage data (custom shelves are new)
   - Optionally migrate `pinnedShelves` preference to database for cross-device sync

---

## Implementation Plan

### Phase 1 Steps

| Step | Task | Files | Status |
|------|------|-------|--------|
| 1 | Create type definitions | `src/types/shelves.types.ts` | ✅ Done |
| 2 | Create default shelves constants | `src/constants/shelves.ts` | ✅ Done |
| 3 | Create ShelfProvider | `src/providers/ShelfProvider.tsx` | ✅ Done |
| 4 | Create ShelfRow component | `src/components/features/shelves/ShelfRow.tsx` | ✅ Done |
| 5 | Create ShelvesPanel component | `src/components/features/shelves/ShelvesPanel.tsx` | ✅ Done |
| 6 | Create ShelfTabBar component | `src/components/features/shelves/ShelfTabBar.tsx` | ✅ Done |
| 7 | Create useShelfCounts hook | `src/hooks/useShelfCounts.ts` | ✅ Done |
| 8 | Update Header with menu button | `src/components/navigation/Header.tsx` | ✅ Done |
| 9 | Integrate into Home screen | `src/app/(authenticated)/index.tsx` | ✅ Done |
| 10 | Update FilterSection to use ShelfProvider | `src/components/features/deadlines/FilterSection.tsx` | ✅ Done |
| 11 | Update FilterSheet to use ShelfProvider | `src/components/features/deadlines/FilterSheet.tsx` | ✅ Done |
| 12 | Update FilteredDeadlines to use ShelfProvider | `src/components/features/deadlines/FilteredDeadlines.tsx` | ✅ Done |
| 13 | Testing & polish | - | ✅ Done |

---

## Implementation Progress (Phase 1) - COMPLETE ✅

### Architecture Decision: ShelfProvider

During implementation, we identified that PreferencesProvider was becoming overloaded (33+ state values). We created a dedicated **ShelfProvider** to:
- Consolidate shelf selection, pinned shelves, and all filter state
- Reduce prop drilling (FilterSection previously received 12+ props)
- Provide a natural home for Phase 2 custom shelves

### New Files Created

1. `src/types/shelves.types.ts` - Type definitions for SystemShelfId, SystemShelf, ShelfCounts
2. `src/constants/shelves.ts` - SYSTEM_SHELVES array, DEFAULT_PINNED_SHELVES, helper functions
3. `src/providers/ShelfProvider.tsx` - **NEW** Dedicated provider for shelf + filter state
4. `src/components/features/shelves/ShelvesPanel.tsx` - Slide-out panel with Reanimated animations
5. `src/components/features/shelves/ShelfRow.tsx` - Individual shelf row with pin toggle
6. `src/components/features/shelves/ShelfTabBar.tsx` - Horizontal tab bar for pinned shelves
7. `src/components/features/shelves/index.ts` - Barrel exports
8. `src/hooks/useShelfCounts.ts` - Hook to compute counts for each shelf

### Modified Files

1. `src/providers/PreferencesProvider.tsx`:
   - **Removed** all shelf and filter state (~200 lines)
   - Now only contains view preferences (deadlineViewMode, progressInputModes, metricViewModes, calendar settings)

2. `src/app/_layout.tsx`:
   - Added ShelfProvider to provider tree (wraps Stack inside DeadlineProvider)

3. `src/providers/DeadlineProvider.tsx`:
   - Added `rejectedDeadlines` and `withdrewDeadlines` to context
   - Added analytics events for `deadline_received` and `deadline_applied`

4. `src/utils/deadlineUtils.ts`:
   - Updated `separateDeadlines()` to include `rejected` and `withdrew` arrays

5. `src/components/navigation/Header.tsx`:
   - Added hamburger menu button (left of date)
   - Added `onOpenShelvesPanel` prop

6. `src/components/ui/IconSymbol.tsx`:
   - Added new icon mappings for shelf icons

7. `src/app/(authenticated)/index.tsx`:
   - Uses `useShelf()` hook for all filter state
   - Integrated `ShelvesPanel` component

8. `src/components/features/deadlines/FilterSection.tsx`:
   - Updated props to use `selectedShelf`/`onShelfChange` instead of `selectedFilter`/`onFilterChange`
   - Uses `SystemShelfId` type

9. `src/components/features/deadlines/FilterSheet.tsx`:
   - Updated to use `SystemShelfId` type

10. `src/components/features/deadlines/FilteredDeadlines.tsx`:
    - Updated to use `SystemShelfId` type

11. `src/lib/analytics/events.ts`:
    - Added `deadline_received` and `deadline_applied` events

### Deleted Files

1. `src/hooks/useShelfFiltering.ts` - Replaced by ShelfProvider

### ShelfProvider API

```typescript
interface ShelfContextType {
  // Shelf state
  selectedShelf: SystemShelfId;
  pinnedShelves: SystemShelfId[];
  shelfCounts: ShelfCounts;

  // Filter state (moved from PreferencesProvider)
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedPageRanges: PageRangeFilter[];
  selectedTypes: string[];
  selectedTags: string[];
  excludedStatuses: SystemShelfId[];
  sortOrder: SortOrder;

  // Actions
  selectShelf: (shelfId: SystemShelfId) => Promise<void>;  // Clears filters
  toggleShelfPin: (shelfId: SystemShelfId) => Promise<void>;
  setTimeRangeFilter: (filter: TimeRangeFilter) => Promise<void>;
  // ... other filter setters
  clearAllFilters: () => void;

  isLoading: boolean;
}
```

### Known Issues

- Test files need updating for new prop names (`selectedFilter` → `selectedShelf`)
- Some test fixtures missing `source` and `deadline_type` fields (pre-existing)

---

## Resolved Questions

### Design Decisions

| Question | Decision |
|----------|----------|
| Panel width | 85% of screen (max 340px) |
| Pin indicator | Star icon (filled = pinned, outline = unpinned) |
| Counts position | Right-aligned in row |
| Empty shelf | Show with (0) count, don't hide |
| Default pins | All 9 core system shelves pinned by default |
| Filter behavior | Selecting shelf clears all advanced filters |
| FilterSheet | Kept for temporary session-only filtering |

### Technical Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Count computation | Use existing `DeadlineProvider` pre-computed lists | Already optimized, no new computation needed for Phase 1 |
| Tab bar overflow | Horizontal scroll, no maximum | Matches current FilterSection behavior |
| Animation library | Reanimated | Already used in codebase (`FilterSection.tsx`) |
| Conditional shelves | Rejected/Withdrew only appear if count > 0 | Matches existing "Overdue" tab behavior |
| Pin ordering | Fixed order based on system shelf definitions | Simplifies Phase 1; reordering deferred to Phase 3 |
| Conditional shelf pinning | Pinnable; hidden from tab bar when count = 0 | Users may want quick access when items exist |
| Phase 2 storage | Supabase from day one | Cross-device sync is expected for custom shelves |
| Filter logic | OR within category, AND across categories | Intuitive: "any of these tags" but "must match format AND status" |

## Open Questions

### Future Considerations (Phase 3+)

1. **Shelf sharing**: Do we want users to share shelf configurations?
2. **Shelf limits**: Maximum number of custom shelves per user?
3. **System shelf pin sync**: Should system shelf pins sync across devices? (Currently local-only)

### Additional Resolved Decisions

| Question | Decision |
|----------|----------|
| Minimum pinned shelves | Yes, user can unpin all; panel always accessible via hamburger |
| Auto-switch on empty | No, show empty state |
| Panel close on navigate | Yes, close when navigating away from home |

---

## Appendix

### Inspiration Screenshots

Reference screenshots from Threads app located in `/inspiration/`:

| Screenshot | Description | Relevant For |
|------------|-------------|--------------|
| `2025-11-30 00.36.56.jpg` | **Feeds panel** - Shows slide-out panel with list of feeds, member counts, pinned items at top | Phase 1: Panel layout, shelf list design |
| `2025-11-30 00.37.40.jpg` | **Edit feeds screen** - "Create new feed" button, reorderable list with drag handles, "Your Feeds" section | Phase 2: Edit/manage shelves screen |
| `2025-11-30 00.37.47.jpg` | **Create feed (Step 1)** - Feed name, description input, public toggle, "Add profiles or topics" section | Phase 2: Create shelf flow |
| `2025-11-30 00.37.52.jpg` | **Create feed (Step 2)** - Search bar, suggested profiles list with "Add" buttons | Phase 2: Adding filter criteria |
| `2025-11-30 00.37.56.jpg` | **Topic search** - Search input, "Topics picked for you", "Popular topics" chips | Phase 2: Adding tags/topics to shelf |

#### Key Design Patterns from Threads

1. **Panel Layout** (`00.36.56.jpg`)
   - Clean header with title + action buttons
   - Pinned/featured items at top
   - Grouped sections with labels
   - Member/count badges on right
   - Subtle dividers between sections

2. **Edit Mode** (`00.37.40.jpg`)
   - "Create new" as prominent first option
   - Drag handles for reordering
   - Beta badge for new features
   - "Done" button to exit edit mode

3. **Create Flow** (`00.37.47.jpg`, `00.37.52.jpg`)
   - Multi-step wizard approach
   - Name/description first
   - Toggle for visibility settings
   - Suggested items to add
   - Search to find more

4. **Topic Selection** (`00.37.56.jpg`)
   - Search bar at top
   - Personalized suggestions
   - Popular/trending section
   - Chip/pill UI for quick selection

### Related Files

- Current filter implementation: `src/components/features/deadlines/FilterSection.tsx`
- Filter sheet: `src/components/features/deadlines/FilterSheet.tsx`
- Preferences state: `src/providers/PreferencesProvider.tsx`
- Deadline filtering: `src/components/features/deadlines/FilteredDeadlines.tsx`

### Glossary

| Term | Definition |
|------|------------|
| Shelf | A named, filtered view of deadlines |
| System Shelf | Pre-defined shelf that cannot be edited |
| Custom Shelf | User-created shelf with custom filters |
| Pin | Action of adding a shelf to the tab bar |
| Panel | The slide-out drawer showing all shelves |

---
