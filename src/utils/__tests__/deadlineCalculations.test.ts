import {
  calculateCurrentProgress,
  calculateCurrentProgressFromForm,
  calculateRemaining,
  calculateRemainingFromForm,
  calculateTotalQuantity,
  calculateTotalQuantityFromForm,
  getPaceEstimate,
} from '../deadlineCalculations';

describe('deadlineCalculations', () => {
  describe('calculateTotalQuantityFromForm', () => {
    it('should convert audio hours to minutes', () => {
      expect(calculateTotalQuantityFromForm('audio', 2, 30)).toBe(150); // 2 hours 30 minutes = 150 minutes
      expect(calculateTotalQuantityFromForm('audio', '3', '15')).toBe(195); // 3 hours 15 minutes = 195 minutes
    });

    it('should handle audio without additional minutes', () => {
      expect(calculateTotalQuantityFromForm('audio', 2)).toBe(120); // 2 hours = 120 minutes
      expect(calculateTotalQuantityFromForm('audio', '5', 0)).toBe(300); // 5 hours = 300 minutes
    });

    it('should return pages as-is for physical books', () => {
      expect(calculateTotalQuantityFromForm('physical', 250)).toBe(250);
      expect(calculateTotalQuantityFromForm('physical', '350')).toBe(350);
    });

    it('should return pages as-is for eBooks', () => {
      expect(calculateTotalQuantityFromForm('eBook', 180)).toBe(180);
      expect(calculateTotalQuantityFromForm('eBook', '220')).toBe(220);
    });
  });

  describe('calculateCurrentProgressFromForm', () => {
    it('should convert audio hours to minutes', () => {
      expect(calculateCurrentProgressFromForm('audio', 1, 45)).toBe(105); // 1 hour 45 minutes = 105 minutes
      expect(calculateCurrentProgressFromForm('audio', '2', '0')).toBe(120); // 2 hours = 120 minutes
    });

    it('should handle zero progress', () => {
      expect(calculateCurrentProgressFromForm('audio', 0, 0)).toBe(0);
      expect(calculateCurrentProgressFromForm('physical', 0)).toBe(0);
    });

    it('should return pages as-is for physical books', () => {
      expect(calculateCurrentProgressFromForm('physical', 100)).toBe(100);
      expect(calculateCurrentProgressFromForm('physical', '150')).toBe(150);
    });

    it('should return pages as-is for eBooks', () => {
      expect(calculateCurrentProgressFromForm('eBook', 75)).toBe(75);
      expect(calculateCurrentProgressFromForm('eBook', '90')).toBe(90);
    });
  });

  describe('calculateTotalQuantity', () => {
    it('should add minutes to audio total (already in minutes)', () => {
      expect(calculateTotalQuantity('audio', 120, 30)).toBe(150); // 120 minutes + 30 minutes = 150 minutes
      expect(calculateTotalQuantity('audio', '180', '15')).toBe(195); // 180 minutes + 15 minutes = 195 minutes
    });

    it('should handle audio without additional minutes', () => {
      expect(calculateTotalQuantity('audio', 120)).toBe(120); // 120 minutes
      expect(calculateTotalQuantity('audio', '300', 0)).toBe(300); // 300 minutes
    });

    it('should return pages as-is for physical books', () => {
      expect(calculateTotalQuantity('physical', 250)).toBe(250);
      expect(calculateTotalQuantity('physical', '350')).toBe(350);
    });

    it('should return pages as-is for eBooks', () => {
      expect(calculateTotalQuantity('eBook', 180)).toBe(180);
      expect(calculateTotalQuantity('eBook', '220')).toBe(220);
    });
  });

  describe('calculateCurrentProgress', () => {
    it('should add minutes to audio progress (already in minutes)', () => {
      expect(calculateCurrentProgress('audio', 60, 15)).toBe(75); // 60 minutes + 15 minutes = 75 minutes
      expect(calculateCurrentProgress('audio', '90', '30')).toBe(120); // 90 minutes + 30 minutes = 120 minutes
    });

    it('should handle zero progress', () => {
      expect(calculateCurrentProgress('audio', 0, 0)).toBe(0);
      expect(calculateCurrentProgress('physical', 0)).toBe(0);
    });

    it('should return pages as-is for physical books', () => {
      expect(calculateCurrentProgress('physical', 100)).toBe(100);
      expect(calculateCurrentProgress('physical', '150')).toBe(150);
    });

    it('should return pages as-is for eBooks', () => {
      expect(calculateCurrentProgress('eBook', 75)).toBe(75);
      expect(calculateCurrentProgress('eBook', '90')).toBe(90);
    });
  });

  describe('calculateRemaining', () => {
    it('should calculate remaining content for audio books', () => {
      expect(calculateRemaining('audio', 180, 30, 60, 15)).toBe(135); // (180+30) - (60+15) = 135 minutes
      expect(calculateRemaining('audio', '240', '0', '120', '30')).toBe(90); // (240+0) - (120+30) = 90 minutes
    });

    it('should calculate remaining content for physical books', () => {
      expect(
        calculateRemaining('physical', 300, undefined, 100, undefined)
      ).toBe(200); // 300 - 100 = 200 pages
      expect(calculateRemaining('physical', '400', '0', '150', '0')).toBe(250); // 400 - 150 = 250 pages
    });

    it('should calculate remaining content for eBooks', () => {
      expect(calculateRemaining('eBook', 250, undefined, 80, undefined)).toBe(
        170
      ); // 250 - 80 = 170 pages
    });

    it('should handle case where no content remains', () => {
      expect(
        calculateRemaining('physical', 100, undefined, 100, undefined)
      ).toBe(0);
      expect(calculateRemaining('audio', 120, 0, 120, 0)).toBe(0);
    });
  });

  describe('calculateRemainingFromForm', () => {
    it('should calculate remaining content for audio books from form data', () => {
      expect(calculateRemainingFromForm('audio', 3, 0, 1, 30)).toBe(90); // (3*60+0) - (1*60+30) = 180 - 90 = 90 minutes
      expect(calculateRemainingFromForm('audio', '4', '15', '2', '45')).toBe(
        90
      ); // (4*60+15) - (2*60+45) = 255 - 165 = 90 minutes
    });

    it('should calculate remaining content for physical books from form data', () => {
      expect(
        calculateRemainingFromForm('physical', 300, undefined, 100, undefined)
      ).toBe(200); // 300 - 100 = 200 pages
    });

    it('should calculate remaining content for eBooks from form data', () => {
      expect(
        calculateRemainingFromForm('eBook', 250, undefined, 80, undefined)
      ).toBe(170); // 250 - 80 = 170 pages
    });
  });

  describe('getPaceEstimate', () => {
    const mockDate = new Date('2024-01-15T12:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate daily pace for physical books', () => {
      const deadline = new Date('2024-01-25T12:00:00Z'); // 10 days from mock date
      expect(getPaceEstimate('physical', deadline, 100)).toBe('10 pages/day'); // 100 pages / 10 days = 10 pages/day
    });

    it('should calculate daily pace for eBooks', () => {
      const deadline = new Date('2024-01-20T12:00:00Z'); // 5 days from mock date
      expect(getPaceEstimate('eBook', deadline, 150)).toBe('30 pages/day'); // 150 pages / 5 days = 30 pages/day
    });

    it('should calculate daily pace for audio books in hours and minutes', () => {
      const deadline = new Date('2024-01-25T12:00:00Z'); // 10 days from mock date
      expect(getPaceEstimate('audio', deadline, 600)).toBe('1 hour/day'); // 600 minutes / 10 days = 60 minutes/day = 1 hour/day

      const deadline2 = new Date('2024-01-20T12:00:00Z'); // 5 days from mock date
      expect(getPaceEstimate('audio', deadline2, 450)).toBe(
        '1 hour 30 minutes/day'
      ); // 450 minutes / 5 days = 90 minutes/day = 1 hour 30 minutes/day
    });

    it('should calculate daily pace for audio books in minutes only', () => {
      const deadline = new Date('2024-01-20T12:00:00Z'); // 5 days from mock date
      expect(getPaceEstimate('audio', deadline, 250)).toBe('50 minutes/day'); // 250 minutes / 5 days = 50 minutes/day
    });

    it('should handle plural vs singular hours', () => {
      const deadline = new Date('2024-01-20T12:00:00Z'); // 5 days from mock date
      expect(getPaceEstimate('audio', deadline, 600)).toBe('2 hours/day'); // 600 minutes / 5 days = 120 minutes/day = 2 hours/day
    });

    it('should warn when Due date has passed', () => {
      const pastDeadline = new Date('2024-01-10T12:00:00Z'); // 5 days before mock date
      expect(getPaceEstimate('physical', pastDeadline, 100)).toBe(
        'This due date has already passed'
      );
      expect(getPaceEstimate('audio', pastDeadline, 300)).toBe(
        'This due date has already passed'
      );
    });

    it('should return empty string for zero remaining content', () => {
      const deadline = new Date('2024-01-25T12:00:00Z');
      expect(getPaceEstimate('physical', deadline, 0)).toBe('');
      expect(getPaceEstimate('audio', deadline, 0)).toBe('');
    });

    it('should handle same-day deadline', () => {
      const sameDay = new Date('2024-01-15T23:59:59Z'); // Same day as mock date
      expect(getPaceEstimate('physical', sameDay, 50)).toBe('50 pages/day'); // All content must be read today
    });

    it('should round up days and pace calculations', () => {
      const deadline = new Date('2024-01-18T06:00:00Z'); // ~2.75 days from mock date
      expect(getPaceEstimate('physical', deadline, 100)).toBe('34 pages/day'); // 100 pages / 3 days (rounded up) = 33.33 -> 34 pages/day
    });
  });
});
