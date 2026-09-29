import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { driverApi } from '@/lib/api/driver';
import { teslaApi } from '@/lib/api/tesla';
import { ActivePoolCard } from '@/components/driver/ActivePoolCard';
import { PendingRequestList } from '@/components/driver/PendingRequestList';
import { StatusToggle } from '@/components/driver/StatusToggle';

export default async function DriverDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'DRIVER') redirect('/');

  const [teslaStatus, allPools, teslaPublic] = await Promise.all([
    driverApi.getStatus().catch(() => null),
    driverApi.listPools().catch(() => []),
    teslaApi.getStatus().catch(() => null),
  ]);

  if (!teslaStatus) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-700">Could not load Tesla status.</p>
      </div>
    );
  }

  const isOnline = teslaStatus.status === 'ONLINE';

  // Pending requests only available when online.
  const pendingRequests = isOnline
    ? await driverApi.listPendingRequests().catch(() => [])
    : [];

  // The currently open pool (any non-completed, non-cancelled).
  const activePool = allPools.find(
    (p) =>
      p.status === 'MATCHED' ||
      p.status === 'DRIVER_ARRIVED' ||
      p.status === 'STARTED',
  );

  const availableSeats = teslaPublic?.availableSeats ?? teslaStatus.capacity;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Driver dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Hi {user.name}, manage {teslaStatus.name}.
          </p>
        </div>
        <StatusToggle currentStatus={teslaStatus.status} />
      </div>

      {!isOnline && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">
            You are offline. Toggle online to see pending ride requests.
          </p>
        </div>
      )}

      {isOnline && !activePool && (
        <PendingRequestList
          requests={pendingRequests}
          availableSeats={availableSeats}
        />
      )}

      {activePool && <ActivePoolCard pool={activePool} />}

      {isOnline && activePool && pendingRequests.length > 0 && (
        <PendingRequestList
          requests={pendingRequests}
          availableSeats={availableSeats}
        />
      )}
    </div>
  );
}