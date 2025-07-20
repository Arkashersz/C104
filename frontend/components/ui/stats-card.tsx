import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string;
}

export function StatsCard({ icon, title, value }: StatsCardProps) {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-custom flex items-center space-x-4">
      <div className="text-primary text-3xl">{icon}</div>
      <div>
        <p className="text-text-secondary text-sm">{title}</p>
        <p className="text-xl font-semibold text-primary-dark">{value}</p>
      </div>
    </div>
  );
}