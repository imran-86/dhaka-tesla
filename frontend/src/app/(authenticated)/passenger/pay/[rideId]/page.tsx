import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { ridesApi } from '@/lib/api/rides';
import { paymentsApi } from '@/lib/api/payments';
import { PaymentForm } from '@/components/passenger/PaymentForm';
import { formatDateTime, formatPoysha } from '@/lib/format';

interface Props {
  params: Promise<{ rideId: string }>;
}

export default async function PayRidePage({ params }: Props) {
  const { rideId } = await params;

  const user = await getCurrentUser();
  if (!user || user.role !== 'PASSENGER') redirect('/');

  const ride = await ridesApi.getById(rideId).catch(() => null);
  if (!ride || ride.passengerId !== user.id) notFound();
  if (ride.status !== 'COMPLETED' || !ride.poolId) {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-xl font-semibold">Cannot pay for this ride</h1>
        <p className="mt-2 text-sm text-gray-600">
          Only completed trips can be paid for.
        </p>
        <Link
          href="/passenger"
          className="mt-6 inline-block text-sm underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  // Verify it is not already paid.
  const pending = await paymentsApi.listPendingRides().catch(() => []);
  const stillDue = pending.find((p) => p.id === ride.id);
  if (!stillDue) {
    redirect('/passenger?already_paid=1');
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <Link href="/passenger" className="text-sm text-gray-500 hover:underline">
        ← Back
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Pay for your trip</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Route</dt>
            <dd className="font-medium">
              {ride.pickupZone} → {ride.destinationZone}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Seats</dt>
            <dd>{ride.seatsRequested}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Tesla</dt>
            <dd>{stillDue.pool.tesla.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Completed</dt>
            <dd>{formatDateTime(ride.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <PaymentForm
            poolId={ride.poolId}
            amountLabel={formatPoysha(ride.farePoysha)}
          />
        </div>
      </div>
    </div>
  );
}