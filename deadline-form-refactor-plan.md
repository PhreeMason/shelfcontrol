# Deadline Form Refactor Plan: 4 Steps → 2 Steps

## Overview

Transform the deadline form from a 4-step process to a 2-step process:
- **Step 1**: Book Search (unchanged)
- **Step 2**: Combined form with all remaining fields, organized into sections with dividers

## User Requirements

Based on clarification discussion:

1. **Save Button**: Always visible in header but disabled until all required fields are filled
2. **Bottom Button**: Keep both header and bottom save buttons
3. **Layout**: Single scrollable form with section headers/dividers
4. **Validation**: Validate fields on blur + on submit
5. **Step Indicators**: Remove entirely
6. **Edit Mode**: Separate optimized layout for editing (handles disabled fields)
7. **Button Style**: Text button ("Save" or "Add")

---

## Current State Analysis

### Current Flow (New Mode - 4 Steps)
1. **Step 1**: Book Search - Search APIs or manual entry
2. **Step 2**: Book Details - Title, Author, Status, Format, Pages/Time
3. **Step 3**: Additional Details - Type, Source, Publishers
4. **Step 4**: Due Date - Deadline, Progress, Flexibility, Pace

### Current Flow (Edit Mode - 3 Steps)
1. **Step 1**: Book Details (skips search)
2. **Step 2**: Additional Details
3. **Step 3**: Due Date

### New Flow (New Mode - 2 Steps)
1. **Step 1**: Book Search (unchanged)
2. **Step 2**: Combined form with sections:
   - Book Details
   - Additional Information
   - Reading Schedule

### New Flow (Edit Mode - 1 Step)
- Single-page form with same sections as new mode Step 2
- Handles disabled fields (format, progress if records exist)

---

## Implementation Plan

### Phase 1: Create New Components

#### 1.1 Create DeadlineFormStep2Combined Component

**File**: `src/components/forms/DeadlineFormStep2Combined.tsx`

**Purpose**: Combine all fields from current Steps 2, 3, and 4 into one scrollable form with sections

**Structure**:
```
┌─────────────────────────────────┐
│ BOOK DETAILS                    │
├─────────────────────────────────┤
│ • Book Title (required)         │
│ • Author                        │
│ • Status (pending/active)       │
│ • Format (physical/eBook/audio) │
│ • Total Pages/Time (required)   │
│   - Minutes (audio only)        │
│                                 │
│ ADDITIONAL INFORMATION          │
├─────────────────────────────────┤
│ • Book Type (required)          │
│ • Acquisition Source            │
│ • Publishers (up to 5)          │
│                                 │
│ READING SCHEDULE                │
├─────────────────────────────────┤
│ • Due Date (required)           │
│ • Current Progress              │
│   - Minutes (audio only)        │
│ • Flexibility (flexible/strict) │
│ • Ignore in Calculations        │
│ • [Pace Estimate Card]          │
└─────────────────────────────────┘
```

**Component Structure**:
```typescript
interface DeadlineFormStep2CombinedProps {
  control: Control<DeadlineFormData>;
  errors: FieldErrors<DeadlineFormData>;
  watch: UseFormWatch<DeadlineFormData>;
  setValue: UseFormSetValue<DeadlineFormData>;
  trigger: UseFormTrigger<DeadlineFormData>;
  selectedFormat: 'physical' | 'eBook' | 'audio';
  selectedStatus: 'pending' | 'active';
  selectedPriority: 'flexible' | 'strict';
  setSelectedFormat: (format: 'physical' | 'eBook' | 'audio') => void;
  setSelectedStatus: (status: 'pending' | 'active') => void;
  setSelectedPriority: (priority: 'flexible' | 'strict') => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  paceEstimate: string;
  existingProgressRecordsCount?: number;
  deadlineFromPublicationDate?: boolean;
  publisherFromAPI?: boolean;
  mode: 'new' | 'edit';
}
```

**Functionality to Preserve**:
- Format switching with page count memory
- Dynamic labels (Pages vs Hours based on format)
- Audio format shows hours + minutes
- Pace estimate calculation and display
- "Linked from library" indicators
- Publisher add/remove logic
- Date picker modal
- Progress lock if existing records (edit mode)
- Typeahead inputs for type and source
- All validation rules

**Implementation Notes**:
- Import all field components from existing Step 2, 3, 4
- Add section headers using `<ThemedText variant="subtitle">` or similar
- Add divider/spacing between sections (16-24px)
- Use `ScrollView` for the container
- All handlers passed from parent (DeadlineFormContainer)

---

#### 1.2 Create EditDeadlineForm Component

**File**: `src/components/forms/EditDeadlineForm.tsx`

**Purpose**: Optimized single-page form for editing existing deadlines

**Differences from New Mode**:
- No step navigation
- Format field is disabled (cannot change after creation)
- Progress fields disabled if existing progress records
- No book search step
- Header with save button only
- Direct submit (no "next" button)

**Component Structure**:
```typescript
interface EditDeadlineFormProps {
  existingDeadline: Deadline;
  onBack: () => void;
  onSubmit: (data: DeadlineFormData) => Promise<void>;
}
```

**Layout**:
```
┌─────────────────────────────────┐
│ [Header: "Edit Deadline" + Save]│
├─────────────────────────────────┤
│ BOOK DETAILS                    │
│ • Title (editable)              │
│ • Author (editable)             │
│ • Status (editable)             │
│ • Format (DISABLED)             │
│ • Total Pages/Time (editable)   │
│                                 │
│ ADDITIONAL INFORMATION          │
│ • Book Type (editable)          │
│ • Source (editable)             │
│ • Publishers (editable)         │
│                                 │
│ READING SCHEDULE                │
│ • Due Date (editable)           │
│ • Progress (DISABLED if records)│
│ • Flexibility (editable)        │
│ • Ignore in Calcs (editable)    │
│ • [Pace Estimate Card]          │
│                                 │
│ [Bottom Save Button]            │
└─────────────────────────────────┘
```

**Implementation Notes**:
- Reuse DeadlineFormStep2Combined for field rendering
- Wrap in SafeAreaView with AppHeader
- Initialize form with existingDeadline data
- Pass `mode="edit"` to combined component
- Show disabled state clearly (opacity, helper text)

---

### Phase 2: Update DeadlineFormContainer

**File**: `src/components/forms/DeadlineFormContainer.tsx`

#### 2.1 Change Total Steps

```typescript
// OLD
const totalSteps = mode === 'new' ? 4 : 3;

// NEW
const totalSteps = mode === 'new' ? 2 : 1; // Edit mode is now single-page
```

#### 2.2 Update Form Steps Array

```typescript
// OLD
const formSteps = mode === 'new'
  ? ['Find Book', 'Book Details', 'Additional Details', 'Set Due Date']
  : ['Book Details', 'Additional Details', 'Set Due Date'];

// NEW
const formSteps = mode === 'new'
  ? ['Find Book', 'Book Details']
  : ['Edit Deadline']; // Edit mode doesn't use steps
```

#### 2.3 Add Blur Validation Mode

```typescript
const {
  control,
  handleSubmit,
  formState: { errors, isValid }, // Add isValid
  setValue,
  watch,
  trigger,
  reset,
} = useForm<DeadlineFormData>({
  resolver: zodResolver(deadlineFormSchema),
  mode: 'onBlur', // ADD THIS - triggers validation on blur
  defaultValues: initialFormData,
});
```

#### 2.4 Create Save Button Component

```typescript
// Add after state declarations, before effects
const saveButton = useMemo(() => {
  // Only show on Step 2 in new mode, or always in edit mode
  if (mode === 'new' && currentStep !== 2) return null;

  const buttonText = isSubmitting
    ? mode === 'new' ? 'Adding...' : 'Updating...'
    : mode === 'new' ? 'Add' : 'Save';

  return (
    <TouchableOpacity
      onPress={() => handleSubmit(onSubmit)()}
      disabled={!isValid || isSubmitting}
      style={[
        styles.saveButton,
        (!isValid || isSubmitting) && styles.saveButtonDisabled,
      ]}
    >
      <ThemedText
        style={[
          styles.saveText,
          { color: colors.textOnPrimary },
          (!isValid || isSubmitting) && styles.saveTextDisabled,
        ]}
      >
        {buttonText}
      </ThemedText>
    </TouchableOpacity>
  );
}, [currentStep, mode, isValid, isSubmitting, handleSubmit, onSubmit, colors]);
```

#### 2.5 Update AppHeader

```typescript
// OLD
<AppHeader title={formSteps[currentStep - 1]} onBack={navigation.goBack}>
  <StepIndicators currentStep={currentStep} totalSteps={totalSteps} />
</AppHeader>

// NEW
<AppHeader
  title={formSteps[currentStep - 1]}
  onBack={navigation.goBack}
  rightElement={saveButton} // Add save button
>
  {/* Remove StepIndicators */}
</AppHeader>
```

#### 2.6 Conditionally Render Edit Mode

```typescript
// Add before the main step navigation JSX
if (mode === 'edit') {
  return (
    <EditDeadlineForm
      existingDeadline={existingDeadline!}
      onBack={navigation.goBack}
      onSubmit={onSubmit}
    />
  );
}

// Then continue with new mode step navigation
return (
  <SafeAreaView ...>
    <AppHeader ...>
    <KeyboardAvoidingView ...>
      {currentStep === 1 && <DeadlineFormStep1 .../>}
      {currentStep === 2 && <DeadlineFormStep2Combined .../>}
      <FormBottomNav .../>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
```

#### 2.7 Update Bottom Navigation

```typescript
// Update FormBottomNav to show both buttons on step 2
<FormBottomNav
  navigation={navigation}
  mode={mode}
  currentStep={currentStep}
  isSubmitting={isSubmitting}
  isValid={isValid} // Pass isValid for consistent disable state
/>
```

#### 2.8 Add Styles for Save Button

```typescript
const styles = StyleSheet.create({
  // ... existing styles
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.7,
  },
});
```

---

### Phase 3: Update Navigation Utilities

**File**: `src/utils/deadlineFormUtils.ts`

#### 3.1 Simplify createFormNavigation

```typescript
// OLD - Complex 4-step navigation
export const createFormNavigation = (
  currentStep: number,
  setCurrentStep: (step: number) => void,
  router: Router,
  trigger: UseFormTrigger<DeadlineFormData>,
  selectedFormat: 'physical' | 'eBook' | 'audio',
  mode: 'new' | 'edit'
) => {
  const nextStep = async () => {
    let isValid = true;

    // Step-specific validation
    if (currentStep === 1) {
      // No validation for book search
    } else if (currentStep === 2) {
      const fieldsToValidate: (keyof DeadlineFormData)[] = [
        'bookTitle',
        'format',
        'totalQuantity',
      ];
      if (selectedFormat === 'audio') {
        fieldsToValidate.push('totalMinutes');
      }
      isValid = await trigger(fieldsToValidate);
    } else if (currentStep === 3) {
      isValid = await trigger(['type']);
    }

    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  // ... rest of navigation
};

// NEW - Simplified 2-step navigation
export const createFormNavigation = (
  currentStep: number,
  setCurrentStep: (step: number) => void,
  router: Router,
  trigger: UseFormTrigger<DeadlineFormData>,
  selectedFormat: 'physical' | 'eBook' | 'audio',
  mode: 'new' | 'edit'
) => {
  const nextStep = async () => {
    // Step 1 (book search) has no validation
    // Step 2 validates everything on submit via handleSubmit
    // So we only need to advance without validation
    setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(authenticated)/(tabs)');
      }
    }
  };

  return { nextStep, goBack };
};
```

#### 3.2 Update findEarliestErrorStep

```typescript
// OLD - Maps errors to 4 steps
export const findEarliestErrorStep = (
  errors: FieldErrors<DeadlineFormData>,
  mode: 'new' | 'edit'
): number => {
  const startStep = mode === 'new' ? 1 : 0;

  const stepFieldMap: { [key: number]: (keyof DeadlineFormData)[] } = {
    [startStep + 1]: ['bookTitle', 'format', 'totalQuantity', 'totalMinutes'],
    [startStep + 2]: ['type', 'acquisition_source', 'publishers'],
    [startStep + 3]: ['deadline', 'currentProgress', 'currentMinutes', 'flexibility'],
  };

  for (let step = startStep + 1; step <= startStep + 3; step++) {
    const fields = stepFieldMap[step];
    if (fields.some(field => errors[field])) {
      return step;
    }
  }

  return startStep + 1;
};

// NEW - Maps errors to 2 steps (or 1 for edit)
export const findEarliestErrorStep = (
  errors: FieldErrors<DeadlineFormData>,
  mode: 'new' | 'edit'
): number => {
  // Edit mode is single-page, so always return 1
  if (mode === 'edit') return 1;

  // New mode: Step 1 is search (no validation), Step 2 has everything
  // If any errors exist, they're on Step 2
  const hasAnyErrors = Object.keys(errors).length > 0;
  return hasAnyErrors ? 2 : 1;
};
```

---

### Phase 4: Update Form Bottom Navigation

**File**: `src/components/forms/DeadlineFormContainer.tsx` (FormBottomNav component)

#### 4.1 Update Button Logic

```typescript
// OLD - 4 steps with different buttons
const isLastStep = currentStep === (mode === 'new' ? 4 : 3);
const buttonText = isLastStep
  ? mode === 'new' ? 'Add Book' : 'Update Book'
  : 'Continue';

// NEW - 2 steps (or 1 for edit)
const isLastStep = currentStep === (mode === 'new' ? 2 : 1);
const buttonText = isLastStep
  ? mode === 'new' ? 'Add Book' : 'Update Book'
  : 'Continue';

// Match header button disabled state
const isDisabled = isLastStep ? (!isValid || isSubmitting) : false;
```

---

### Phase 5: Testing & Validation

#### 5.1 Manual Testing Checklist

**New Mode Flow**:
- [ ] Step 1: Search for book → auto-fills data → advances to Step 2
- [ ] Step 1: Manual entry → advances to Step 2
- [ ] Step 2: All fields render correctly
- [ ] Step 2: Section headers are visible and styled
- [ ] Step 2: Save button in header is visible
- [ ] Step 2: Save button is disabled when form invalid
- [ ] Step 2: Save button enables when all required fields filled
- [ ] Step 2: Bottom button has same behavior as header button
- [ ] Step 2: Blur validation shows errors immediately
- [ ] Step 2: Format switching preserves page counts
- [ ] Step 2: Audio format shows hours + minutes
- [ ] Step 2: Pace estimate updates in real-time
- [ ] Step 2: Publisher add/remove works
- [ ] Step 2: Date picker opens and sets deadline
- [ ] Step 2: Save triggers full validation
- [ ] Step 2: Success → navigates home + shows toast
- [ ] Step 2: Error → shows error toast
- [ ] No step indicators visible

**Edit Mode Flow**:
- [ ] Opens directly to edit form (no step 1)
- [ ] All existing data pre-populated
- [ ] Format field is disabled
- [ ] Progress fields disabled if records exist
- [ ] Progress fields enabled if no records
- [ ] Save button in header visible
- [ ] Save button disabled when invalid
- [ ] Bottom button has same behavior
- [ ] Blur validation works
- [ ] Pace estimate updates
- [ ] Save triggers validation
- [ ] Success → navigates back + shows toast

**Edge Cases**:
- [ ] URL pre-population works (new mode)
- [ ] Publication date auto-fills deadline
- [ ] Duplicate book warning appears
- [ ] Loading states during submission
- [ ] Back navigation from Step 2 → Step 1
- [ ] Back navigation from Step 1 → previous screen
- [ ] Form validation catches all required fields
- [ ] Audio minutes validation (0-59)
- [ ] Publisher max limit (5)
- [ ] Type/source max length (30 chars)

#### 5.2 Regression Testing

Test all existing functionality still works:
- [ ] Analytics tracking (book selection, form completion)
- [ ] Form flow abandonment tracking
- [ ] Search result selection tracking
- [ ] Format memory when switching
- [ ] Initialization prevention (no infinite loops)
- [ ] Error navigation (if errors on submit)
- [ ] Theme colors apply correctly
- [ ] Keyboard avoidance works
- [ ] Scroll behavior on long form
- [ ] Auto-fill indicators show correctly

---

### Phase 6: Cleanup

#### 6.1 Archive Old Components

After thorough testing, can delete:
- `src/components/forms/DeadlineFormStep2.tsx`
- `src/components/forms/DeadlineFormStep3.tsx`
- `src/components/forms/DeadlineFormStep4.tsx`

#### 6.2 Update Imports

Remove any unused imports from deleted components.

#### 6.3 Remove Step Indicators Component

If `StepIndicators` is only used in deadline forms:
- Can optionally remove `src/components/shared/StepIndicators.tsx`
- Or keep for potential future use

---

## Critical Functionality to Preserve

### 1. Format Switching Memory
**Location**: `deadlineFormUtils.ts` lines 417-456

When user switches format, page counts must be preserved:
- Physical/eBook → Audio: Store page count, clear fields
- Audio → Physical/eBook: Restore page count

**Keep this logic in DeadlineFormContainer**

### 2. Pace Estimate Calculation
**Location**: `DeadlineFormContainer.tsx` lines 181-203

Real-time calculation showing pages/hours per day needed.

**Keep this in DeadlineFormContainer, pass to Step2Combined**

### 3. Progress Lock (Edit Mode)
**Location**: `DeadlineFormStep4.tsx` lines 353-357

If deadline has >1 progress records, lock starting progress fields.

**Must implement in EditDeadlineForm**

### 4. Publication Date Auto-Fill
**Location**: `deadlineFormUtils.ts` lines 524-556

If book has future publication date, auto-set as deadline.

**Keep in Step 1, flag passed to Step 2**

### 5. Duplicate Book Warning
**Location**: `DeadlineFormStep1.tsx`

Warn user if adding duplicate book.

**Keep in Step 1, no changes needed**

### 6. Audio Time Conversion
**Location**: `deadlineFormUtils.ts` lines 382-395

Convert between total minutes ↔ hours + minutes for display.

**Keep in utils, use in Step2Combined**

### 7. URL Pre-Population
**Location**: `deadlineFormUtils.ts` lines 271-327

Support pre-filling form from URL query params.

**Keep in DeadlineFormContainer initialization**

### 8. Field-Specific Validation

**From Zod Schema** (`deadlineFormSchema.ts`):
- `bookTitle`: required, min 1 char
- `format`: required, enum
- `totalQuantity`: required, positive integer
- `totalMinutes`: optional (audio), 0-59
- `type`: required, 1-30 chars
- `acquisition_source`: optional, max 30 chars
- `publishers`: optional array, max 5, each max 99 chars
- `deadline`: required Date
- `currentProgress`: optional, ≥0
- `currentMinutes`: optional, ≥0
- `flexibility`: required, enum
- `ignoreInCalcs`: optional boolean

**All validation rules must be preserved**

---

## UI/UX Guidelines

### Section Headers

Use consistent styling:
```typescript
<ThemedText variant="subtitle" style={styles.sectionHeader}>
  BOOK DETAILS
</ThemedText>
```

Style:
```typescript
sectionHeader: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 20,
  marginBottom: 12,
  opacity: 0.7,
  letterSpacing: 0.5,
}
```

### Section Spacing

Between sections: 24px
Within sections (between fields): 16px

### Save Button States

**Enabled**:
- Full opacity
- Primary text color (`textOnPrimary`)
- Touch feedback

**Disabled**:
- 50% opacity
- Reduced text opacity (70%)
- No touch feedback

**Loading**:
- Show "Adding..." or "Updating..." text
- Disable interaction
- Optional: Add spinner icon

### Disabled Fields (Edit Mode)

**Format Field**:
```typescript
<View style={styles.disabledFieldContainer}>
  <SegmentedControl
    items={formatItems}
    selectedItem={selectedFormat}
    onItemPress={() => {}} // No-op
    disabled={true}
    style={styles.disabledField}
  />
  <ThemedText variant="caption" style={styles.disabledHint}>
    Format cannot be changed after creation
  </ThemedText>
</View>
```

**Progress Fields (if records exist)**:
```typescript
<Controller
  control={control}
  name="currentProgress"
  render={({ field }) => (
    <View>
      <ThemedTextInput
        {...field}
        editable={existingProgressRecordsCount <= 1}
        style={[
          existingProgressRecordsCount > 1 && styles.disabledInput
        ]}
      />
      {existingProgressRecordsCount > 1 && (
        <ThemedText variant="caption" style={styles.disabledHint}>
          Starting progress cannot be changed once tracking has started
        </ThemedText>
      )}
    </View>
  )}
/>
```

Style:
```typescript
disabledFieldContainer: {
  opacity: 0.6,
},
disabledField: {
  backgroundColor: 'rgba(0,0,0,0.05)',
},
disabledInput: {
  opacity: 0.6,
  backgroundColor: 'rgba(0,0,0,0.05)',
},
disabledHint: {
  marginTop: 4,
  fontStyle: 'italic',
  opacity: 0.7,
}
```

---

## Files Summary

### New Files
1. `src/components/forms/DeadlineFormStep2Combined.tsx` - Combined form component
2. `src/components/forms/EditDeadlineForm.tsx` - Edit mode layout

### Modified Files
1. `src/components/forms/DeadlineFormContainer.tsx` - Main orchestration
2. `src/utils/deadlineFormUtils.ts` - Navigation and utilities

### Unchanged Files
1. `src/components/forms/DeadlineFormStep1.tsx` - Book search
2. `src/utils/deadlineFormSchema.ts` - Validation schema
3. `src/app/deadline/new.tsx` - Entry point
4. `src/app/deadline/[id]/edit.tsx` - Edit entry point

### Can Delete (After Testing)
1. `src/components/forms/DeadlineFormStep2.tsx`
2. `src/components/forms/DeadlineFormStep3.tsx`
3. `src/components/forms/DeadlineFormStep4.tsx`

---

## Risk Mitigation

### High Risk Areas

1. **Form Validation Breaking**: Changing from progressive validation to blur validation
   - **Mitigation**: Test all field combinations thoroughly
   - **Fallback**: Keep `mode: 'onBlur'` but add manual trigger calls if needed

2. **State Management Complexity**: More state in one component
   - **Mitigation**: Extract handlers to separate functions
   - **Fallback**: Keep existing handler pattern from current steps

3. **Edit Mode Regression**: Separate component could miss edge cases
   - **Mitigation**: Reuse DeadlineFormStep2Combined component
   - **Fallback**: Copy exact logic from new mode with disabled fields

4. **Performance**: Long form with many fields
   - **Mitigation**: Use React.memo, useMemo for expensive calculations
   - **Fallback**: Lazy load sections if needed

### Medium Risk Areas

1. **Navigation Confusion**: Fewer steps might confuse existing users
   - **Mitigation**: Section headers provide clear organization
   - **Fallback**: Add subtle visual dividers

2. **Scroll Position**: User might not see all fields
   - **Mitigation**: Smooth scroll behavior, clear visual hierarchy
   - **Fallback**: Add "scroll to top" button on long forms

3. **Save Button Visibility**: Header button might be missed
   - **Mitigation**: Keep bottom button as well
   - **Fallback**: Add tooltip or hint on first use

### Low Risk Areas

1. **Analytics**: Tracking might need updates for 2-step flow
   - **Mitigation**: Update step numbers in analytics calls
   - **Note**: Form completion tracking unchanged

2. **A11y**: Screen readers need proper labels
   - **Mitigation**: Section headers use semantic headings
   - **Note**: Existing components already have a11y

---

## Success Criteria

The refactor is successful when:

1. ✅ New mode has exactly 2 steps (Find Book → Details)
2. ✅ Edit mode is single-page (no steps)
3. ✅ Save button always visible in header on Step 2
4. ✅ Save button disabled until form valid
5. ✅ Both header and bottom buttons work identically
6. ✅ Section headers clearly organize the form
7. ✅ Blur validation shows errors immediately
8. ✅ All existing functionality preserved
9. ✅ No regressions in edit mode
10. ✅ All manual tests pass
11. ✅ No console errors or warnings
12. ✅ Performance is acceptable (no lag on input)

---

## Timeline Estimate

**Phase 1** (Create Components): 3-4 hours
- DeadlineFormStep2Combined: 2 hours
- EditDeadlineForm: 1-2 hours

**Phase 2** (Update Container): 2-3 hours
- Step count changes: 30 mins
- Save button: 1 hour
- Conditional rendering: 1 hour
- Testing integration: 30 mins

**Phase 3** (Update Utilities): 1 hour
- Navigation simplification: 30 mins
- Error step mapping: 30 mins

**Phase 4** (Bottom Nav): 30 mins

**Phase 5** (Testing): 2-3 hours
- Manual testing: 1-2 hours
- Regression testing: 1 hour
- Bug fixes: variable

**Phase 6** (Cleanup): 30 mins

**Total: 9-12 hours**

---

## Implementation Order

1. Create `DeadlineFormStep2Combined.tsx` (merge all fields)
2. Update `DeadlineFormContainer.tsx` (step count, save button)
3. Test new mode flow thoroughly
4. Create `EditDeadlineForm.tsx` (reuse combined component)
5. Update edit mode rendering
6. Test edit mode flow thoroughly
7. Simplify navigation utilities
8. Regression test everything
9. Clean up old files

---

## Notes

- This plan preserves all existing functionality while reorganizing the UI
- The form validation logic remains unchanged (Zod schema)
- State management patterns stay consistent
- Analytics tracking needs minor updates (step numbers)
- User experience is streamlined from 4 steps to 2
- Edit mode gets its own optimized layout
- Both header and bottom save buttons provide flexibility
- Section headers improve scannability of long form
