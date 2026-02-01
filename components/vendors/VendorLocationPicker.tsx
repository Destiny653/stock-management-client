'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the map component with SSR disabled
// react-leaflet requires browser APIs (window, document) that don't exist on the server
const VendorLocationPickerMap = dynamic(
  () => import('./VendorLocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-md border border-slate-200 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

interface VendorLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: { address: string; city: string; country: string }) => void;
  label?: string;
}

export default function VendorLocationPicker(props: VendorLocationPickerProps) {
  return <VendorLocationPickerMap {...props} />;
}