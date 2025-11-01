import { deadlineFormSchema, DeadlineFormData } from '../deadlineFormSchema';

describe('deadlineFormSchema', () => {
  describe('bookTitle validation', () => {
    it('should accept valid book title', () => {
      const data = {
        bookTitle: 'Valid Book Title',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty book title', () => {
      const data = {
        bookTitle: '',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Book title is required');
      }
    });

    it('should reject missing book title', () => {
      const data = {
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('bookAuthor validation', () => {
    it('should accept valid book author', () => {
      const data = {
        bookTitle: 'Test Book',
        bookAuthor: 'Test Author',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookAuthor).toBe('Test Author');
      }
    });

    it('should accept undefined book author', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty string book author', () => {
      const data = {
        bookTitle: 'Test Book',
        bookAuthor: '',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('format validation', () => {
    it('should accept valid formats', () => {
      const validFormats = ['physical', 'eBook', 'audio'] as const;

      validFormats.forEach(format => {
        const data = {
          bookTitle: 'Test Book',
          format,
          type: 'Library',
          deadline: new Date(),
          totalQuantity: 300,
          flexibility: 'flexible',
          status: 'active',
        };

        const result = deadlineFormSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.format).toBe(format);
        }
      });
    });

    it('should reject invalid format', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'invalid',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a format');
      }
    });

    it('should reject missing format', () => {
      const data = {
        bookTitle: 'Test Book',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('source validation', () => {
    it('should accept valid source', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty source', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: '',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please select or enter a source'
        );
      }
    });

    it('should reject missing source', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject source exceeding 30 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'This is a very long source name that exceeds thirty characters',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Source cannot exceed 30 characters'
        );
      }
    });

    it('should accept source at exactly 30 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: '123456789012345678901234567890',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('acquisition_source validation', () => {
    it('should accept valid acquisition_source', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        acquisition_source: 'NetGalley',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acquisition_source).toBe('NetGalley');
      }
    });

    it('should accept undefined acquisition_source', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acquisition_source).toBeUndefined();
      }
    });

    it('should reject acquisition_source exceeding 30 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        acquisition_source:
          'This is a very long acquisition source that exceeds thirty characters',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Acquisition source cannot exceed 30 characters'
        );
      }
    });

    it('should accept acquisition_source at exactly 30 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        acquisition_source: '123456789012345678901234567890',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('publishers validation', () => {
    it('should accept valid publishers array', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: ['Penguin Random House', 'HarperCollins'],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publishers).toEqual([
          'Penguin Random House',
          'HarperCollins',
        ]);
      }
    });

    it('should accept undefined publishers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publishers).toBeUndefined();
      }
    });

    it('should accept empty publishers array', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: [],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept publishers array with exactly 5 items', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: [
          'Publisher 1',
          'Publisher 2',
          'Publisher 3',
          'Publisher 4',
          'Publisher 5',
        ],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject publishers array exceeding 5 items', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: [
          'Publisher 1',
          'Publisher 2',
          'Publisher 3',
          'Publisher 4',
          'Publisher 5',
          'Publisher 6',
        ],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Maximum 5 publishers allowed'
        );
      }
    });

    it('should reject publisher name exceeding 99 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: [
          'This is a very long publisher name that definitely exceeds ninety-nine characters and should be rejected by validation',
        ],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Publisher name cannot exceed 99 characters'
        );
      }
    });

    it('should accept publisher name at exactly 99 characters', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        publishers: ['123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789'],
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('deadline validation', () => {
    it('should accept valid date', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date('2024-12-01'),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: 'invalid-date',
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing deadline', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Deadline is required');
      }
    });
  });

  describe('totalQuantity validation', () => {
    it('should accept valid positive integer', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers to integers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: '300',
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalQuantity).toBe(300);
        expect(typeof result.data.totalQuantity).toBe('number');
      }
    });

    it('should reject decimal numbers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300.5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a whole number'
        );
      }
    });

    it('should reject zero', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 0,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Total must be greater than 0'
        );
      }
    });

    it('should reject negative numbers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: -100,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Total must be greater than 0'
        );
      }
    });

    it('should reject non-numeric strings', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 'not-a-number',
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a valid number'
        );
      }
    });

    it('should reject missing totalQuantity', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a valid number'
        );
      }
    });
  });

  describe('totalMinutes validation', () => {
    it('should accept valid minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        totalMinutes: 30,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept zero minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        totalMinutes: 0,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        totalMinutes: '30',
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalMinutes).toBe(30);
        expect(typeof result.data.totalMinutes).toBe('number');
      }
    });

    it('should reject negative minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        totalMinutes: -5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Minutes must be 0 or greater'
        );
      }
    });

    it('should reject decimal minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        totalMinutes: 30.5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter whole minutes'
        );
      }
    });

    it('should accept undefined totalMinutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('currentMinutes validation', () => {
    it('should accept valid current minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        currentMinutes: 15,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept zero current minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        currentMinutes: 0,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject negative current minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        currentMinutes: -5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Minutes must be 0 or greater'
        );
      }
    });

    it('should reject decimal current minutes', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'audio',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 10,
        currentMinutes: 15.5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter whole minutes'
        );
      }
    });
  });

  describe('currentProgress validation', () => {
    it('should accept valid current progress', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        currentProgress: 150,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept zero current progress', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        currentProgress: 0,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        currentProgress: '150',
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentProgress).toBe(150);
        expect(typeof result.data.currentProgress).toBe('number');
      }
    });

    it('should reject negative progress', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        currentProgress: -50,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Progress cannot be negative'
        );
      }
    });

    it('should reject decimal progress', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        currentProgress: 150.5,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a whole number'
        );
      }
    });

    it('should accept undefined current progress', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('flexibility validation', () => {
    it('should accept valid flexibility values', () => {
      const validValues = ['flexible', 'strict'] as const;

      validValues.forEach(flexibility => {
        const data = {
          bookTitle: 'Test Book',
          format: 'eBook',
          type: 'Library',
          deadline: new Date(),
          totalQuantity: 300,
          flexibility,
          status: 'active',
        };

        const result = deadlineFormSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.flexibility).toBe(flexibility);
        }
      });
    });

    it('should reject invalid flexibility', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'invalid',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please select deadline flexibility'
        );
      }
    });

    it('should reject missing flexibility', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('status validation', () => {
    it('should accept valid status values', () => {
      const validValues = ['pending', 'active'] as const;

      validValues.forEach(status => {
        const data = {
          bookTitle: 'Test Book',
          format: 'eBook',
          type: 'Library',
          deadline: new Date(),
          totalQuantity: 300,
          flexibility: 'flexible',
          status,
        };

        const result = deadlineFormSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      });
    });

    it('should reject invalid status', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'invalid',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please select a status');
      }
    });

    it('should reject missing status', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('optional book linking fields', () => {
    it('should accept valid book_id', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
        book_id: 'book-123',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.book_id).toBe('book-123');
      }
    });

    it('should accept valid api_id', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
        api_id: 'api-456',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.api_id).toBe('api-456');
      }
    });

    it('should accept undefined optional fields', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.book_id).toBeUndefined();
        expect(result.data.api_id).toBeUndefined();
      }
    });
  });

  describe('ignoreInCalcs validation', () => {
    it('should accept true value', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
        ignoreInCalcs: true,
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ignoreInCalcs).toBe(true);
      }
    });

    it('should accept false value', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
        ignoreInCalcs: false,
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ignoreInCalcs).toBe(false);
      }
    });

    it('should be undefined when not provided', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ignoreInCalcs).toBeUndefined();
      }
    });

    it('should reject non-boolean values', () => {
      const data = {
        bookTitle: 'Test Book',
        format: 'eBook',
        type: 'Library',
        deadline: new Date(),
        totalQuantity: 300,
        flexibility: 'flexible',
        status: 'active',
        ignoreInCalcs: 'not-a-boolean',
      };

      const result = deadlineFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('complete form validation', () => {
    it('should validate complete form with all fields', () => {
      const completeData: DeadlineFormData = {
        bookTitle: 'The Great Gatsby',
        bookAuthor: 'F. Scott Fitzgerald',
        format: 'physical',
        type: 'Library',
        deadline: new Date('2024-12-01'),
        totalQuantity: 180,
        totalMinutes: 0,
        currentProgress: 50,
        currentMinutes: 0,
        flexibility: 'strict',
        status: 'active',
        book_id: 'book-123',
        api_id: 'api-456',
        ignoreInCalcs: false,
      };

      const result = deadlineFormSchema.safeParse(completeData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(completeData);
      }
    });

    it('should validate audio book form', () => {
      const audioData: DeadlineFormData = {
        bookTitle: 'Audio Book Title',
        bookAuthor: 'Audio Author',
        format: 'audio',
        type: 'Audible',
        deadline: new Date('2024-12-01'),
        totalQuantity: 12,
        totalMinutes: 30,
        currentProgress: 2,
        currentMinutes: 15,
        flexibility: 'flexible',
        status: 'pending',
        ignoreInCalcs: false,
      };

      const result = deadlineFormSchema.safeParse(audioData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('audio');
        expect(result.data.totalQuantity).toBe(12);
        expect(result.data.totalMinutes).toBe(30);
        expect(result.data.currentProgress).toBe(2);
        expect(result.data.currentMinutes).toBe(15);
      }
    });

    it('should validate minimal required form', () => {
      const minimalData = {
        bookTitle: 'Minimal Book',
        format: 'eBook',
        type: 'Store',
        deadline: new Date(),
        totalQuantity: 100,
        flexibility: 'flexible',
        status: 'active',
      };

      const result = deadlineFormSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });
  });
});
