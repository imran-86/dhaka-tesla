'use client';

import { useActionState } from 'react';
import { loginAction, type LoginState } from '@/app/actions/auth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="nusrat@dhaka-tesla.local"
        autoComplete="email"
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
      />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}