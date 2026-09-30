export const DHAKA_ZONES = [
  'Banani',
  'Gulshan 1',
  'Gulshan 2',
  'Mohakhali',
  'Dhanmondi',
  'Mirpur',
  'Uttara',
  'Farmgate',
  'Bashundhara',
] as const;

export type DhakaZone = (typeof DHAKA_ZONES)[number];

/**
 * Corridor matching rule (MVP, directional).
 *
 * Two rides can share a Tesla only if:
 *   1. They have the same pickup zone (exact match).
 *   2. BOTH dropoff zones appear in COMPATIBLE_CORRIDORS[pickupZone].
 *
 * Pickups are limited to a handful of realistic hubs — the zones a driver
 * would plausibly start from. The remaining zones appear only as
 * destinations, which keeps the corridor map small and readable.
 *
 * Matching is directional. Banani → Mohakhali is compatible with
 * Banani → Gulshan 1, but Mohakhali → Banani is a separate rule and is
 * NOT currently defined.
 */
export const COMPATIBLE_CORRIDORS: Partial<Record<DhakaZone, readonly DhakaZone[]>> = {
  Banani: ['Mohakhali', 'Gulshan 1', 'Gulshan 2', 'Farmgate', 'Dhanmondi'],
  Mohakhali: ['Gulshan 1', 'Gulshan 2', 'Farmgate', 'Dhanmondi'],
  Dhanmondi: ['Farmgate', 'Mirpur', 'Uttara', 'Banani'],
  Mirpur: ['Uttara', 'Bashundhara', 'Farmgate', 'Dhanmondi'],
};

/**
 * Asymmetric distance matrix in kilometers between key Dhaka hubs.
 * Distances are approximate road distances for the MVP, not exact
 * GPS measurements. Only corridor pairs need an entry — the request
 * form filters destinations through COMPATIBLE_CORRIDORS.
 *
 * Demo trips:
 *   Banani → Mohakhali  = 3.0 km (Nusrat)
 *   Banani → Gulshan 1  = 2.5 km (Rafiq)
 *   Banani → Farmgate   = 6.5 km (Shirin)
 */
export const ZONE_DISTANCES_KM: Partial<
  Record<DhakaZone, Partial<Record<DhakaZone, number>>>
> = {
  Banani: {
    Mohakhali: 3.0,
    'Gulshan 1': 2.5,
    'Gulshan 2': 1.5,
    Farmgate: 6.5,
    Dhanmondi: 8.0,
  },
  Mohakhali: {
    'Gulshan 1': 2.0,
    'Gulshan 2': 3.0,
    Farmgate: 5.0,
    Dhanmondi: 6.5,
  },
  Dhanmondi: {
    Farmgate: 3.0,
    Mirpur: 8.0,
    Uttara: 16.0,
    Banani: 8.0,
  },
  Mirpur: {
    Uttara: 6.0,
    Bashundhara: 5.0,
    Farmgate: 8.0,
    Dhanmondi: 8.0,
  },
};

/**
 * Fare model:
 *   subtotal       = BASE_FARE + (distanceKm * PER_KM_RATE)
 *   poolDiscount   = subtotal * POOL_DISCOUNT_PERCENTAGE / 100   (only if pool has >= 2 distinct passengers)
 *   passengerFare  = subtotal - poolDiscount
 *
 * All amounts stored in integer poysha. 1 Taka = 100 poysha.
 * The pool discount applies to the WHOLE subtotal (base + distance),
 * and only when the pool actually carries at least two distinct passengers.
 */
export const FARE_CONFIG = {
  BASE_FARE_POYSHA: 3000,       // ৳30 base
  PER_KM_RATE_POYSHA: 1500,     // ৳15 per km
  POOL_DISCOUNT_PERCENTAGE: 20, // 20% off subtotal when pooled
  MIN_POOL_PASSENGERS: 2,       // discount requires at least this many distinct riders
} as const;