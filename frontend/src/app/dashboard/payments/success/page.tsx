'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-spicy-dark mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-8">
          Your lesson hours have been added to your account.
          You can now schedule classes with your tutor.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard/schedule"
            className="block w-full bg-spicy-red hover:bg-spicy-orange text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Schedule a Class
          </Link>
          <Link
            href="/dashboard/payments"
            className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            View Transaction History
          </Link>
        </div>
      </div>
    </div>
  );
}
