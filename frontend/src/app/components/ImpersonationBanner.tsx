'use client';

import { useAuth } from '../contexts/AuthContext';

export default function ImpersonationBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3">
      <span>
        Viewing as {user.firstName} {user.lastName} ({user.role})
      </span>
      <button
        onClick={stopImpersonating}
        className="bg-white text-amber-700 px-3 py-1 rounded text-xs font-bold hover:bg-amber-100 transition-colors"
      >
        Back to Admin
      </button>
    </div>
  );
}
