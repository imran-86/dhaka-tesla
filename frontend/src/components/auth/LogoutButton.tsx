import { logoutAction } from '@/app/actions/auth';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        Logout
      </button>
    </form>
  );
}