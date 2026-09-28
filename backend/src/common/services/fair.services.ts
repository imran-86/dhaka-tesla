// import { AppError } from '../utils/AppError';
import {
  COMPATIBLE_CORRIDORS,
  FARE_CONFIG,
  ZONE_DISTANCES_KM,
  type DhakaZone,
} from '../utils/zones.constants';

export interface FareBreakdown {
  /** Distance used for the calculation, in kilometers. */
  distanceKm: number;

  /** Everything below is in integer poysha — the source of truth. */
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;

  /**
   * Convenience Taka values for display only.
   * Never store or compare these — use the poysha fields.
   */
  display: {
    baseFare: string;
    distanceCharge: string;
    poolDiscount: string;
    total: string;
  };
}

const poyshaToTaka = (poysha: number): string => (poysha / 100).toFixed(2);

export class FareService {
  /**
   * Compute the fare for one passenger.
   *
   * @param pickup         Pickup zone name (must be in DHAKA_ZONES).
   * @param destination    Destination zone name (must be in DHAKA_ZONES).
   * @param passengerCount Total passengers in the pool this ride belongs to.
   *                       Discount applies only when >= MIN_POOL_PASSENGERS.
   *
   * Throws AppError(422, 'NO_ROUTE') if the distance is not mapped.
   */
  static calculateFare(
    pickup: DhakaZone,
    destination: DhakaZone,
    passengerCount: number = 1,
  ): FareBreakdown {
    const distanceKm = ZONE_DISTANCES_KM[pickup]?.[destination];
    if (distanceKm === undefined) {
      throw new Error(
        `No distance defined for ${pickup} → ${destination}`,
      );
    }

    const baseFarePoysha = FARE_CONFIG.BASE_FARE_POYSHA;
    const distanceChargePoysha = Math.round(
      distanceKm * FARE_CONFIG.PER_KM_RATE_POYSHA,
    );
    const subtotalPoysha = baseFarePoysha + distanceChargePoysha;

    const isEligibleForDiscount =
      passengerCount >= FARE_CONFIG.MIN_POOL_PASSENGERS;

    const poolDiscountPoysha = isEligibleForDiscount
      ? Math.round(
          (subtotalPoysha * FARE_CONFIG.POOL_DISCOUNT_PERCENTAGE) / 100,
        )
      : 0;

    const totalPoysha = subtotalPoysha - poolDiscountPoysha;

    return {
      distanceKm,
      baseFarePoysha,
      distanceChargePoysha,
      poolDiscountPoysha,
      totalPoysha,
      display: {
        baseFare: poyshaToTaka(baseFarePoysha),
        distanceCharge: poyshaToTaka(distanceChargePoysha),
        poolDiscount: poyshaToTaka(poolDiscountPoysha),
        total: poyshaToTaka(totalPoysha),
      },
    };
  }

  /**
   * Two rides can share a Tesla only when:
   *   1. Same pickup zone (exact match — matching is directional).
   *   2. BOTH dropoff zones appear in COMPATIBLE_CORRIDORS[pickup].
   *
   * Example (compatible):   Banani → Mohakhali  +  Banani → Gulshan 1
   * Example (incompatible): Banani → Dhanmondi  +  Banani → Gulshan 1
   */
  static areRoutesCompatible(
    pickup1: DhakaZone,
    drop1: DhakaZone,
    pickup2: DhakaZone,
    drop2: DhakaZone,
  ): boolean {
    if (pickup1 !== pickup2) return false;

    const corridor = COMPATIBLE_CORRIDORS[pickup1];
    if (!corridor) return false;

    return corridor.includes(drop1) && corridor.includes(drop2);
  }
}