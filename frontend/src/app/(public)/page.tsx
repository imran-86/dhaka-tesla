import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth';

export default async function LandingPage() {
  const user = await getCurrentUser();

  // Already logged in — send to their dashboard.
  if (user) {
    redirect(user.role === 'PASSENGER' ? '/passenger' : '/driver');
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Dhaka Tesla Pool
        </h1>
        <p className="mt-2 text-gray-600">Share a Tesla, split the fare.</p>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Log in</h2>
        <div className="mt-4">
          <LoginForm />
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gray-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}