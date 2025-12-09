'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Package } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.user_type === 'vendor') {
        router.push('/VendorDashboard');
      } else {
        router.push('/Dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30">
          <Package className="h-8 w-8 text-white" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
          <p className="text-slate-300 font-medium">Loading StockFlow...</p>
        </div>
        <p className="text-slate-500 text-sm">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );
}
