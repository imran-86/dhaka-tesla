export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Dhaka Tesla Pool · Built for RoBenDevs
        assessment
      </div>
    </footer>
  );
}