import { customDateFormSchema } from '../customDateFormSchema';

describe('customDateFormSchema', () => {
  it('should validate valid data', () => {
    const validData = {
      name: 'Cover Reveal',
      date: '2025-12-25',
    };
    const result = customDateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if name is empty', () => {
    const invalidData = {
      name: '',
      date: '2025-12-25',
    };
    const result = customDateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('should fail if name is too long', () => {
    const invalidData = {
      name: 'a'.repeat(101),
      date: '2025-12-25',
    };
    const result = customDateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Name must be 100 characters or less'
      );
    }
  });

  it('should fail if date is invalid format', () => {
    const invalidData = {
      name: 'Cover Reveal',
      date: '2025/12/25', // Wrong separator
    };
    const result = customDateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid date format');
    }
  });

  it('should fail if date is missing', () => {
    const invalidData = {
      name: 'Cover Reveal',
      date: '',
    };
    const result = customDateFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });
});
