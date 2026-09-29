'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { serverFetch, ServerApiError } from '@/lib/api/server';
import type { Payment } from '@/types';

export interface CreatePaymentState {
  error?: string;
}

export async function createPaymentAction(
  _prev: CreatePaymentState,
  formData: FormData,
): Promise<CreatePaymentState> {
  const poolId = String(formData.get('poolId') ?? '').trim();
  const method = String(formData.get('method') ?? '').toUpperCase();

  if (!poolId) return { error: 'Missing pool.' };
  if (method !== 'CASH' && method !== 'TESLAPAY') {
    return { error: 'Choose a valid payment method.' };
  }

  try {
    await serverFetch<{ payment: Payment }>('/api/payments', {
      method: 'POST',
      body: { poolId, method },
    });
  } catch (err) {
    if (err instanceof ServerApiError) return { error: err.body.message };
    return { error: 'Network error. Please try again.' };
  }

  revalidatePath('/passenger');
  // Redirect outside try/catch so redirect's internal throw is not swallowed.
  redirect(`/passenger?paid=1&method=${method}`);
}