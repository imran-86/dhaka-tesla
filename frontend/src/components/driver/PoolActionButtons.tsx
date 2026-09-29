'use client';

import { useActionState } from 'react';
import {
  cancelPoolAction,
  completePoolAction,
  startPoolAction,
  type PoolActionState,
} from '@/app/actions/driver';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { RideStatus } from '@/types';

interface Props {
  poolId: string;
  status: RideStatus;
}

function ActionForm({
  poolId,
  action,
  label,
  pendingLabel,
  variant,
  confirmText,
}: {
  poolId: string;
  action: (
    prev: PoolActionState,
    fd: FormData,
  ) => Promise<PoolActionState>;
  label: string;
  pendingLabel: string;
  variant: 'primary' | 'secondary';
  confirmText?: string;
}) {
  const [state, formAction, isPending] = useActionState<PoolActionState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex-1">
      <input type="hidden" name="poolId" value={poolId} />
      {state.error && (
        <div className="mb-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}
      <Button
        type="submit"
        variant={variant}
        disabled={isPending}
        className="w-full"
        onClick={(e) => {
          if (confirmText && !confirm(confirmText)) e.preventDefault();
        }}
      >
        {isPending ? pendingLabel : label}
      </Button>
    </form>
  );
}

export function PoolActionButtons({ poolId, status }: Props) {
  const canStart = status === 'MATCHED' || status === 'DRIVER_ARRIVED';
  const canComplete = status === 'STARTED';
  const canCancel = status === 'MATCHED' || status === 'DRIVER_ARRIVED';

  if (!canStart && !canComplete && !canCancel) {
    return null;
  }

  return (
    <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
      {canStart && (
        <ActionForm
          poolId={poolId}
          action={startPoolAction}
          label="Start trip"
          pendingLabel="Starting…"
          variant="primary"
        />
      )}
      {canComplete && (
        <ActionForm
          poolId={poolId}
          action={completePoolAction}
          label="Complete trip"
          pendingLabel="Completing…"
          variant="primary"
        />
      )}
      {canCancel && (
        <ActionForm
          poolId={poolId}
          action={cancelPoolAction}
          label="Cancel pool"
          pendingLabel="Cancelling…"
          variant="secondary"
          confirmText="Cancel this pool? All attached requests will be cancelled."
        />
      )}
    </div>
  );
}