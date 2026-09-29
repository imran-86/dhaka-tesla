
export const DHAKA_ZONES = [
  'Banani',
  'Gulshan 1',
  'Gulshan 2',
  'Mohakhali',
  'Dhanmondi',
  'Mirpur',
  'Uttara',
  'Farmgate',
] as const;

export type DhakaZone = (typeof DHAKA_ZONES)[number];