'use client';

import { useActionState } from 'react';
import { clsx } from 'clsx';
import { setDriverStatusAction } from '@/app/actions/driver';
import type { StatusToggleState } from '@/app/actions/driver';
import type { TeslaStatus } from '@/types';

interface Props {
  currentStatus: TeslaStatus;
}

export function StatusToggle({ currentStatus }: Props) {
  const [state, formAction, isPending] = useActionState<StatusToggleState, FormData>(
    setDriverStatusAction,
    {},
  );

  const isOnline = currentStatus === 'ONLINE';
  const nextStatus = isOnline ? 'OFFLINE' : 'ONLINE';

  return (
    <form action={formAction}>
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        disabled={isPending}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
          isOnline
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          isPending && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span
          className={clsx(
            'inline-block h-2 w-2 rounded-full',
            isOnline ? 'bg-green-500' : 'bg-gray-500',
          )}
        />
        {isPending ? 'Updating…' : isOnline ? 'Online' : 'Offline'}
        <span className="text-xs opacity-70">
          → click to go {nextStatus.toLowerCase()}
        </span>
      </button>
      {state.error && (
        <p className="mt-1 text-xs text-red-700">{state.error}</p>
      )}
    </form>
  );
}