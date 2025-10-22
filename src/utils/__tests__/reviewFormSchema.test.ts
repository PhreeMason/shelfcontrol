import { reviewFormSchema } from '../reviewFormSchema';

describe('reviewFormSchema', () => {
  describe('hasReviewDeadline field', () => {
    it('should accept true value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: true,
        reviewDueDate: new Date('2025-10-20'),
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept false value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: 'true',
        reviewDueDate: null,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reviewDueDate field', () => {
    it('should accept valid date', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: true,
        reviewDueDate: new Date('2025-10-20'),
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept null value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid date', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: true,
        reviewDueDate: 'invalid-date',
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('needsLinkSubmission field', () => {
    it('should accept true value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept false value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: 'false',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('reviewNotes field', () => {
    it('should accept valid string within limit', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
        reviewNotes: 'Great book, loved the characters!',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
        reviewNotes: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept undefined value', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should accept string at max length (10000 chars)', () => {
      const longNotes = 'a'.repeat(10000);
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
        reviewNotes: longNotes,
      });
      expect(result.success).toBe(true);
    });

    it('should reject string exceeding max length', () => {
      const tooLongNotes = 'a'.repeat(10001);
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        reviewDueDate: null,
        needsLinkSubmission: false,
        reviewNotes: tooLongNotes,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Review notes must be 10000 characters or less'
        );
      }
    });
  });

  describe('complete form validation', () => {
    it('should accept valid complete form', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: true,
        reviewDueDate: new Date('2025-10-20'),
        needsLinkSubmission: true,
        reviewNotes: 'Excellent book with great pacing',
      });
      expect(result.success).toBe(true);
    });

    it('should accept minimal valid form', () => {
      const result = reviewFormSchema.safeParse({
        hasReviewDeadline: false,
        needsLinkSubmission: false,
      });
      expect(result.success).toBe(true);
    });

    it('should reject form missing required fields', () => {
      const result = reviewFormSchema.safeParse({
        reviewDueDate: new Date('2025-10-20'),
        reviewNotes: 'Notes',
      });
      expect(result.success).toBe(false);
    });
  });
});
