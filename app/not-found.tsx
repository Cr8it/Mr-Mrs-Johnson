export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="text-6xl font-cormorant font-bold text-gold mb-4">404</h1>
        <h2 className="text-2xl font-montserrat text-white mb-8">Page Not Found</h2>
        <p className="text-gray-400 mb-8">The page you are looking for does not exist.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gold text-white rounded-lg font-montserrat text-sm transition-transform hover:scale-105"
        >
          Return Home
        </a>
      </div>
    </div>
  )
} 