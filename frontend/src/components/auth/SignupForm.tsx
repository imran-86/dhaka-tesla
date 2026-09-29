'use client';

import { clsx } from 'clsx';
import { useActionState, useState } from 'react';
import { signupAction, type SignupState } from '@/app/actions/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Role = 'PASSENGER' | 'DRIVER';

export function SignupForm() {
  const [role, setRole] = useState<Role>('PASSENGER');
  const [state, formAction, isPending] = useActionState<SignupState, FormData>(
    signupAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-md bg-gray-100 p-1">
        {(['PASSENGER', 'DRIVER'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={clsx(
              'rounded px-3 py-1.5 text-sm font-medium transition',
              role === r
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {r === 'PASSENGER' ? 'Passenger' : 'Driver'}
          </button>
        ))}
      </div>

      {state.error && <Alert variant="error">{state.error}</Alert>}

      <Input name="name" label="Full name" required />
      <Input name="email" type="email" label="Email" required />
      <Input name="phone" label="Phone (optional)" />
      <Input
        name="password"
        type="password"
        label="Password"
        minLength={8}
        required
        hint="At least 8 characters."
      />

      {role === 'DRIVER' && (
        <>
          <Input
            name="vehicleName"
            label="Vehicle name"
            defaultValue="Bullet"
            required
          />
          <Input
            name="capacity"
            type="number"
            label="Seat capacity"
            min={1}
            max={6}
            defaultValue={3}
            required
          />
        </>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending
          ? 'Creating account…'
          : `Sign up as ${role === 'DRIVER' ? 'driver' : 'passenger'}`}
      </Button>
    </form>
  );
}