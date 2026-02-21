'use client';

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'indigo';
}

const colorMap = {
  default: 'text-gray-900',
  green: 'text-green-600',
  red: 'text-red-600',
  amber: 'text-amber-600',
  blue: 'text-blue-600',
  indigo: 'text-indigo-600',
};

export default function KPICard({ label, value, subtitle, trend, trendLabel, color = 'default' }: KPICardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color]}`}>{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
      {trend && trendLabel && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
