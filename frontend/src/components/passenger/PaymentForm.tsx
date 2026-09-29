'use client';

import { useActionState } from 'react';
import { createPaymentAction, type CreatePaymentState } from '@/app/actions/payments';
import { Alert } from '@/components/ui/Alert';

interface Props {
  poolId: string;
  amountLabel: string;
}

function MethodButton({
  method,
  label,
  description,
  poolId,
  disabled,
}: {
  method: 'CASH' | 'TESLAPAY';
  label: string;
  description: string;
  poolId: string;
  disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    CreatePaymentState,
    FormData
  >(createPaymentAction, {});

  return (
    <form action={formAction} className="flex-1">
      <input type="hidden" name="poolId" value={poolId} />
      <input type="hidden" name="method" value={method} />

      <button
        type="submit"
        disabled={isPending || disabled}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-left transition hover:border-gray-900 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="text-base font-medium">{label}</div>
        <div className="mt-1 text-xs text-gray-500">{description}</div>
        {isPending && (
          <div className="mt-2 text-xs text-gray-500">Processing…</div>
        )}
      </button>

      {state.error && (
        <div className="mt-2">
          <Alert variant="error">{state.error}</Alert>
        </div>
      )}
    </form>
  );
}

export function PaymentForm({ poolId, amountLabel }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-md bg-gray-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Amount to pay</span>
          <span className="font-semibold">{amountLabel}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <MethodButton
          method="CASH"
          label="Cash"
          description="Pay the driver in cash. No gateway involved."
          poolId={poolId}
          disabled={false}
        />
        <MethodButton
          method="TESLAPAY"
          label="TeslaPay"
          description="Simulated wallet. No real payment gateway."
          poolId={poolId}
          disabled={false}
        />
      </div>
    </div>
  );
}