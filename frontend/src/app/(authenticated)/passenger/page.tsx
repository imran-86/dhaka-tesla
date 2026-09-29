import { getCurrentUser } from '@/lib/auth';
import { ridesApi } from '@/lib/api/rides';
import { teslaApi } from '@/lib/api/tesla';
import { RecentRidesList } from '@/components/passenger/RecentRidesList';
import { TeslaAvailabilityCard } from '@/components/passenger/TeslaAvailabilityCard';
import { redirect } from 'next/navigation';

export default async function PassengerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PASSENGER') redirect('/');

  // Fetch in parallel.
  const [tesla, recentRides] = await Promise.all([
    teslaApi.getStatus().catch(() => null),
    ridesApi.listMine().then((r) => r.slice(0, 2)),
  ]);

  // Find active ride (REQUESTED or MATCHED).
  const activeRide = recentRides.find(
    (r) => r.status === 'REQUESTED' || r.status === 'MATCHED',
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request a ride or check your active trip.
        </p>
      </div>

      <TeslaAvailabilityCard tesla={tesla} />

      {/* Placeholder for Section 5D — ride request form or active ride card */}
      <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-5 text-sm text-gray-500">
        {activeRide
          ? `You have an active ride (${activeRide.status}). Details coming in Section 5D.`
          : 'Ride request form coming in Section 5D.'}
      </div>

      <RecentRidesList rides={recentRides} />
    </div>
  );
}