const pad = (value: number) => String(value).padStart(2, '0');

export const formatBackupTimestamp = (date = new Date()) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  + `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
);

const sanitizeFilenamePart = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

export const createBackupFilename = (scope?: string, date = new Date()) => {
  const safeScope = scope ? sanitizeFilenamePart(scope) : '';
  const scopePart = safeScope ? `-${safeScope}` : '';
  return `loreplay${scopePart}-backup-${formatBackupTimestamp(date)}.json`;
};
