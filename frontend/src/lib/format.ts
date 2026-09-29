/**
 * Formatting helpers for money and dates.
 * Money always flows as integer poysha; format only at the display layer.
 */

/** Convert poysha (integer) to a ৳ string, e.g. 7500 → "৳75.00" */
export function formatPoysha(poysha: number): string {
  const taka = poysha / 100;
  return `৳${taka.toFixed(2)}`;
}

/** Human-friendly date, e.g. "Sep 29, 3:47 PM" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Status badge colour class, keyed by RideStatus */
export function statusColor(status: string): string {
  switch (status) {
    case 'REQUESTED':
      return 'bg-yellow-100 text-yellow-800';
    case 'MATCHED':
      return 'bg-blue-100 text-blue-800';
    case 'DRIVER_ARRIVED':
      return 'bg-indigo-100 text-indigo-800';
    case 'STARTED':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}