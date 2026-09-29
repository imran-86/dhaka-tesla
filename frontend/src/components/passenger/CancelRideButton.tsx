'use client';

import { useActionState } from 'react';
import { cancelRideAction } from '@/app/actions/rides';
import type { CancelRideState } from '@/app/actions/rides';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export function CancelRideButton({ rideId }: { rideId: string }) {
  const [state, formAction, isPending] = useActionState<CancelRideState, FormData>(
    cancelRideAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="rideId" value={rideId} />

      {state.error && <Alert variant="error">{state.error}</Alert>}

      <Button
        type="submit"
        variant="secondary"
        disabled={isPending}
        onClick={(e) => {
          if (!confirm('Cancel this ride request?')) e.preventDefault();
        }}
      >
        {isPending ? 'Cancelling…' : 'Cancel request'}
      </Button>
    </form>
  );
}