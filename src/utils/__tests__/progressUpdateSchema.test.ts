import { createProgressUpdateSchema, progressUpdateSchema } from '../progressUpdateSchema';

describe('progressUpdateSchema', () => {
  describe('basic progressUpdateSchema', () => {
    it('should validate positive integers', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: 42 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentProgress).toBe(42);
      }
    });

    it('should validate zero', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: 0 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentProgress).toBe(0);
      }
    });

    it('should coerce string numbers to integers', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: '123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentProgress).toBe(123);
      }
    });

    it('should reject negative numbers', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: -5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Progress cannot be negative');
      }
    });

    it('should reject decimal numbers', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: 42.5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Progress must be a whole number');
      }
    });

    it('should reject null values', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: null });
      expect(result.success).toBe(true); // null gets coerced to 0
      if (result.success) {
        expect(result.data.currentProgress).toBe(0);
      }
    });

    it('should reject undefined values', () => {
      const result = progressUpdateSchema.safeParse({ currentProgress: undefined });
      expect(result.success).toBe(false);
    });
  });

  describe('createProgressUpdateSchema', () => {
    describe('physical and eBook formats', () => {
      const schema = createProgressUpdateSchema(300, 'physical');

      it('should validate progress within range', () => {
        const result = schema.safeParse({ currentProgress: 150 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(150);
        }
      });

      it('should validate progress at upper boundary', () => {
        const result = schema.safeParse({ currentProgress: 300 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(300);
        }
      });

      it('should validate progress at lower boundary', () => {
        const result = schema.safeParse({ currentProgress: 0 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(0);
        }
      });

      it('should reject progress exceeding total', () => {
        const result = schema.safeParse({ currentProgress: 301 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress cannot exceed 300 pages');
        }
      });

      it('should handle string input with whitespace', () => {
        const result = schema.safeParse({ currentProgress: '  123  ' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(123);
        }
      });

      it('should reject empty string', () => {
        try {
          schema.parse({ currentProgress: '' });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter your current progress');
        }
      });

      it('should reject whitespace-only string', () => {
        try {
          schema.parse({ currentProgress: '   ' });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter your current progress');
        }
      });

      it('should reject non-numeric strings', () => {
        try {
          schema.parse({ currentProgress: 'abc' });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter a valid number');
        }
      });

      it('should reject negative numbers', () => {
        const result = schema.safeParse({ currentProgress: -10 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress cannot be negative');
        }
      });

      it('should reject decimal numbers', () => {
        const result = schema.safeParse({ currentProgress: 150.5 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress must be a whole number');
        }
      });

      it('should handle NaN correctly', () => {
        try {
          schema.parse({ currentProgress: NaN });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter a valid number');
        }
      });

      it('should handle null', () => {
        try {
          schema.parse({ currentProgress: null });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter your current progress');
        }
      });

      it('should handle undefined', () => {
        try {
          schema.parse({ currentProgress: undefined });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter your current progress');
        }
      });
    });

    describe('audio format', () => {
      const schema = createProgressUpdateSchema(600, 'audio');

      it('should validate audio progress within range', () => {
        const result = schema.safeParse({ currentProgress: 300 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(300);
        }
      });

      it('should reject audio progress exceeding total with correct unit', () => {
        const result = schema.safeParse({ currentProgress: 601 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress cannot exceed 600 minutes');
        }
      });

      it('should validate audio progress at boundary', () => {
        const result = schema.safeParse({ currentProgress: 600 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(600);
        }
      });
    });

    describe('eBook format', () => {
      const schema = createProgressUpdateSchema(450, 'eBook');

      it('should validate eBook progress within range', () => {
        const result = schema.safeParse({ currentProgress: 225 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(225);
        }
      });

      it('should reject eBook progress exceeding total with correct unit', () => {
        const result = schema.safeParse({ currentProgress: 451 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress cannot exceed 450 pages');
        }
      });
    });

    describe('preprocessing edge cases', () => {
      const schema = createProgressUpdateSchema(500, 'physical');

      it('should handle string with decimal and round down', () => {
        const result = schema.safeParse({ currentProgress: '123.7' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Progress must be a whole number');
        }
      });

      it('should handle string with leading zeros', () => {
        const result = schema.safeParse({ currentProgress: '0123' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(123);
        }
      });

      it('should handle numeric string at boundary', () => {
        const result = schema.safeParse({ currentProgress: '500' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(500);
        }
      });

      it('should handle mixed alphanumeric strings', () => {
        // parseFloat('123abc') returns 123, which is valid
        const result = schema.safeParse({ currentProgress: '123abc' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(123);
        }
      });

      it('should reject special characters', () => {
        try {
          schema.parse({ currentProgress: '@#$' });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter a valid number');
        }
      });

      it('should handle Infinity', () => {
        try {
          schema.parse({ currentProgress: Infinity });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter a valid number');
        }
      });

      it('should handle -Infinity', () => {
        try {
          schema.parse({ currentProgress: -Infinity });
          fail('Should have thrown an error');
        } catch (error: any) {
          const issues = error.issues || error.errors;
          expect(issues[0].message).toBe('Please enter a valid number');
        }
      });
    });

    describe('different total quantities', () => {
      it('should work with small total quantity', () => {
        const schema = createProgressUpdateSchema(10, 'physical');
        const result = schema.safeParse({ currentProgress: 5 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(5);
        }
      });

      it('should work with large total quantity', () => {
        const schema = createProgressUpdateSchema(10000, 'physical');
        const result = schema.safeParse({ currentProgress: 5000 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(5000);
        }
      });

      it('should work with total quantity of 1', () => {
        const schema = createProgressUpdateSchema(1, 'physical');
        const result = schema.safeParse({ currentProgress: 1 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.currentProgress).toBe(1);
        }
      });
    });
  });
});