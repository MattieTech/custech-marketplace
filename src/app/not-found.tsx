import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4 tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-3">Page not found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/"
        className="px-6 py-2.5 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
