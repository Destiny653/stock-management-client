'use client';

import dynamic from 'next/dynamic';
import { Loader2, MapPin } from 'lucide-react';
import type { Vendor } from '@/api/base44Client';

// Dynamically import the map component with SSR disabled
const StoreMapComponent = dynamic(
  () => import('./StoreMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface StoreMapProps {
  vendors: (Vendor & { latitude: number; longitude: number })[];
  center: [number, number];
  onVendorSelect: (vendor: Vendor) => void;
  t: (key: string) => string;
}

export default function StoreMap(props: StoreMapProps) {
  return <StoreMapComponent {...props} />;
}
