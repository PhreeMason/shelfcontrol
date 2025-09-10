/**
 * Utility functions for converting audiobook time between total minutes and hours:minutes format
 */

/**
 * Converts total minutes to hours and remaining minutes
 * @param totalMinutes - Total time in minutes
 * @returns Object with hours and minutes
 */
export function convertMinutesToHoursAndMinutes(totalMinutes: number): { hours: number; minutes: number } {
    if (totalMinutes < 0) {
        throw new Error('Total minutes cannot be negative');
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes };
}

/**
 * Converts hours and minutes to total minutes
 * @param hours - Number of hours
 * @param minutes - Number of minutes (optional, defaults to 0)
 * @returns Total time in minutes
 */
export function convertHoursAndMinutesToTotalMinutes(hours: number, minutes: number = 0): number {
    if (hours < 0 || minutes < 0) {
        throw new Error('Hours and minutes cannot be negative');
    }
    
    if (minutes >= 60) {
        throw new Error('Minutes must be less than 60');
    }
    
    return hours * 60 + minutes;
}