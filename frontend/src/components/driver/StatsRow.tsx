import { formatPoysha } from '@/lib/format';
import type { DriverStats } from '@/types';

interface Props {
  stats: DriverStats;
}

export function StatsRow({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="Trips completed"
        value={stats.completedTrips.toString()}
      />
      <StatCard
        label="Total revenue"
        value={formatPoysha(stats.totalRevenuePoysha)}
      />
      <StatCard
        label="Passengers served"
        value={stats.totalPassengers.toString()}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}