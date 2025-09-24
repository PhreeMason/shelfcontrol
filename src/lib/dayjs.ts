import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
// Centralized Day.js configuration
// Add additional plugins here (timezone, relativeTime, etc.)

dayjs.extend(utc);
dayjs.extend(relativeTime);

export { dayjs };
