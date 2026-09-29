import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ridesApi } from '@/lib/api/rides';
import { teslaApi } from '@/lib/api/tesla';
import { ActiveRideCard } from '@/components/passenger/ActiveRideCard';
import { RecentRidesList } from '@/components/passenger/RecentRidesList';
import { RideRequestForm } from '@/components/passenger/RideRequestForm';
import { TeslaAvailabilityCard } from '@/components/passenger/TeslaAvailabilityCard';

export default async function PassengerDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PASSENGER') redirect('/');

  const [tesla, allRides] = await Promise.all([
    teslaApi.getStatus().catch(() => null),
    ridesApi.listMine().catch(() => []),
  ]);

  const activeRide = allRides.find(
    (r) => r.status === 'REQUESTED' || r.status === 'MATCHED',
  );

  const recentRides = allRides
    .filter((r) => r.id !== activeRide?.id)
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Request a ride or check your active trip.
        </p>
      </div>

      <TeslaAvailabilityCard tesla={tesla} />

      {activeRide ? (
        <ActiveRideCard ride={activeRide} />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <RideRequestForm />
        </div>
      )}

      <RecentRidesList rides={recentRides} />
    </div>
  );
}