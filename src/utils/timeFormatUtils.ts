export function parseAudiobookTime(input: string): number | null {
  if (typeof input !== 'string') return null;

  const normalized = input.toString().replace(/\s+/g, ' ').trim();

  if (!normalized) return 0;

  const colonMatch = normalized.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1]) || 0;
    const minutes = parseInt(colonMatch[2]) || 0;
    return hours * 60 + minutes;
  }

  const decimalHoursMatch = normalized.match(/^(\d+)[.,](\d+)\s*h(?:ours?)?$/i);
  if (decimalHoursMatch) {
    const hours = parseInt(decimalHoursMatch[1]) || 0;
    const decimal = parseInt(decimalHoursMatch[2]) || 0;
    const decimalPlaces = decimalHoursMatch[2].length;
    const fraction = decimal / Math.pow(10, decimalPlaces);
    return Math.floor(hours * 60 + fraction * 60);
  }

  const hoursAndMinutesMatch = normalized.match(
    /^(\d+)\s*(?:h|hours?|hrs?)\s*(?:(\d+)\s*(?:m|minutes?|mins?))?$/i
  );

  if (hoursAndMinutesMatch) {
    const hours = parseInt(hoursAndMinutesMatch[1]) || 0;
    const minutes = parseInt(hoursAndMinutesMatch[2]) || 0;
    return hours * 60 + minutes;
  }

  const minutesOnlyMatch = normalized.match(/^(\d+)\s*(?:m|minutes?|mins?)$/i);
  if (minutesOnlyMatch) {
    return parseInt(minutesOnlyMatch[1]) || 0;
  }

  const plainNumberMatch = normalized.match(/^(\d+)$/);
  if (plainNumberMatch) {
    return parseInt(plainNumberMatch[1]) || 0;
  }

  return null;
}

export function formatAudiobookTime(minutes: number): string {
  if (!minutes || minutes < 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
