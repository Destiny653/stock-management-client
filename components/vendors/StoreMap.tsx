import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createPageUrl } from "@/utils";

// Fix for default marker icons in Leaflet
// We need to check if window is defined to avoid SSR issues even though this component should be client-only
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export interface Vendor {
  id: string;
  store_name: string;
  name: string;
  store_address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface StoreMapProps {
  vendors: Vendor[];
  center: [number, number];
  onVendorSelect: (vendor: Vendor) => void;
  t: (key: string) => string;
}

const StoreMap: React.FC<StoreMapProps> = ({ vendors, center, onVendorSelect, t }) => {
  return (
    <MapContainer
      center={center}
      zoom={4}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {vendors.map(vendor => (
        <Marker
          key={vendor.id}
          position={[vendor.latitude, vendor.longitude]}
          eventHandlers={{
            click: () => onVendorSelect(vendor)
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">{vendor.store_name}</h3>
              <p className="text-sm text-slate-600">{vendor.name}</p>
              <p className="text-sm text-slate-500">{vendor.store_address}</p>
              <p className="text-sm text-slate-500">{vendor.city}, {vendor.country}</p>
              <Link href={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
                <Button size="sm" className="mt-2 w-full bg-teal-600 hover:bg-teal-700">
                  {t('viewDetails')}
                </Button>
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default StoreMap;
