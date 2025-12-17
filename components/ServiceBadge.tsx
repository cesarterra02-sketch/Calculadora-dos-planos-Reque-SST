import React from 'react';
import { Check } from 'lucide-react';

interface ServiceBadgeProps {
  label: string;
}

export const ServiceBadge: React.FC<ServiceBadgeProps> = ({ label }) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-semibold shadow-sm">
      <Check className="w-3 h-3" />
      {label}
    </div>
  );
};