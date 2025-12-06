import React from 'react';
import { createPageUrl } from "@/utils";

export default function Suppliers() {
  // Redirect to Settings suppliers tab
  React.useEffect(() => {
    window.location.href = createPageUrl("Settings") + "?tab=suppliers";
  }, []);

  return (
    <div className="flex items-center justify-center h-96">
      <p className="text-slate-500">Redirecting to Settings...</p>
    </div>
  );
}