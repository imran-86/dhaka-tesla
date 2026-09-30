import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ridesApi } from '@/lib/api/rides';
import { teslaApi } from '@/lib/api/tesla';
import { paymentsApi } from '@/lib/api/payments';
import { ActiveRideCard } from '@/components/passenger/ActiveRideCard';
import { CompletedRideCard } from '@/components/passenger/CompletedRideCard';
import { RecentRidesList } from '@/components/passenger/RecentRidesList';
import { RideRequestForm } from '@/components/passenger/RideRequestForm';
import { TeslaAvailabilityCard } from '@/components/passenger/TeslaAvailabilityCard';

interface Props {
  searchParams: Promise<{ paid?: string; method?: string; already_paid?: string }>;
}

export default async function PassengerDashboard({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PASSENGER') redirect('/');

  const sp = await searchParams;

  const [tesla, allRides, pendingPayments, corridors] = await Promise.all([
    teslaApi.getStatus().catch(() => null),
    ridesApi.listMine().catch(() => []),
    paymentsApi.listPendingRides().catch(() => []),
    ridesApi.listCorridors().catch(() => ({ pickupZones: [], corridors: {} })),
  ]);

  const activeRide = allRides.find(
    (r) => r.status === 'REQUESTED' || r.status === 'MATCHED',
  );
  const unpaidCompleted = pendingPayments[0] ?? null;

  const recentRides = allRides
    .filter((r) => r.id !== activeRide?.id && r.id !== unpaidCompleted?.id)
    .slice(0, 2);

  const paidBanner = sp.paid === '1';

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request a ride or check your active trip.
        </p>
      </div>

      {paidBanner && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <strong>Payment received</strong>
          {sp.method ? ` via ${sp.method.toLowerCase() === 'cash' ? 'Cash' : 'TeslaPay'}` : ''}.
          Thank you!
        </div>
      )}

      {sp.already_paid === '1' && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          This trip is already paid.
        </div>
      )}

      <TeslaAvailabilityCard tesla={tesla} />

      {activeRide ? (
        <ActiveRideCard ride={activeRide} />
      ) : unpaidCompleted ? (
        <CompletedRideCard ride={unpaidCompleted} />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <RideRequestForm corridors={corridors} />
        </div>
      )}

      <RecentRidesList rides={recentRides} />
    </div>
  );
}