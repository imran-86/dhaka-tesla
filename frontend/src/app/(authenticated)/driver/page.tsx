import { getCurrentUser } from '@/lib/auth';

export default async function DriverDashboard() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Driver dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome, {user?.name}. Real content in Section 6.
      </p>
    </div>
  );
}