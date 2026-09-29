import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Dhaka Tesla Pool</h1>
        {user ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
            <p className="text-sm text-green-800">Logged in as</p>
            <p className="mt-1 text-2xl font-semibold">{user.name}</p>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-gray-700">Not logged in.</p>
            <p className="mt-2 text-sm text-gray-500">
              Login form coming in Section 4.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}