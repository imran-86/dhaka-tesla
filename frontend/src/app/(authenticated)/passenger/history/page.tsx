import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ridesApi } from '@/lib/api/rides';
import { paymentsApi } from '@/lib/api/payments';
import { RideHistoryList } from '@/components/passenger/RideHistoryList';

export default async function PassengerHistoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PASSENGER') redirect('/');

  const [rides, payments] = await Promise.all([
    ridesApi.listMine().catch(() => []),
    paymentsApi.listMine().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Your rides</h1>
        <p className="mt-1 text-sm text-gray-600">
          A record of every ride you have requested.
        </p>
      </div>

      <RideHistoryList rides={rides} payments={payments} />
    </div>
  );
}