// pages/cancel.tsx

export default function Cancel() {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold mb-4">❌ Payment Cancelled</h1>
        <p className="mb-4 text-gray-300">Your payment was not completed.</p>
        <a
          href="/"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          Return to Home
        </a>
      </div>
    );
  }
  