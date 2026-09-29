import Link from 'next/link';
import { LogoutButton } from '@/components/auth/LogoutButton';
import type { User } from '@/types';

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Dhaka Tesla Pool
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              {user.role === 'PASSENGER' && (
                <>
                  <Link href="/passenger" className="hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/passenger/history" className="hover:text-gray-900">
                    History
                  </Link>
                </>
              )}
              {user.role === 'DRIVER' && (
                <>
                  <Link href="/driver" className="hover:text-gray-900">
                    Dashboard
                  </Link>
                  <Link href="/driver/history" className="hover:text-gray-900">
                    History
                  </Link>
                </>
              )}
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/" className="hover:text-gray-900">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}