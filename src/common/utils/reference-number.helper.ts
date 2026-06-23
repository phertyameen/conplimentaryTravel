/**
 * Generates a unique reference number in the format:
 * CTS-[YYYYMMDD]-[XXXX]
 * e.g. CTS-20260622-A3F9
 */
export function generateReferenceNumber(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');

  return `CTS-${datePart}-${randomPart}`;
}