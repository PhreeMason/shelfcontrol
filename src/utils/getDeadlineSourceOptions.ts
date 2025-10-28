import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { SourceOption } from '@/types/disclosure.types';

export function getDeadlineSourceOptions(
  deadline: ReadingDeadlineWithProgress | null | undefined
): SourceOption[] {
  if (!deadline) return [];

  const options: SourceOption[] = [];

  if (deadline.acquisition_source) {
    options.push({
      value: deadline.acquisition_source,
      label: deadline.acquisition_source,
    });
  }

  if (deadline.publishers && deadline.publishers.length > 0) {
    deadline.publishers.forEach(publisher => {
      if (publisher && !options.some(opt => opt.value === publisher)) {
        options.push({
          value: publisher,
          label: publisher,
        });
      }
    });
  }

  return options;
}
