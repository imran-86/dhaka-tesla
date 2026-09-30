import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { driverApi } from '@/lib/api/driver';
import { StatsRow } from '@/components/driver/StatsRow';
import { PoolHistoryList } from '@/components/driver/PoolHistoryList';

export default async function DriverHistoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'DRIVER') redirect('/');

  const [stats, allPools] = await Promise.all([
    driverApi.getStats().catch(() => ({
      completedTrips: 0,
      totalRevenuePoysha: 0,
      totalPassengers: 0,
    })),
    driverApi.listPools().catch(() => []),
  ]);

  // Show only finished pools in the history list, newest first.
  const pastPools = allPools
    .filter((p) => p.status === 'COMPLETED' || p.status === 'CANCELLED')
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Driver history</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your completed and cancelled trips.
        </p>
      </div>

      <StatsRow stats={stats} />

      <PoolHistoryList pools={pastPools} />
    </div>
  );
}