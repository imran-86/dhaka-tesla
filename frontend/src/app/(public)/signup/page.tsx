import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';
import { getCurrentUser } from '@/lib/auth';

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === 'PASSENGER' ? '/passenger' : '/driver');
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <SignupForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/" className="text-gray-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}