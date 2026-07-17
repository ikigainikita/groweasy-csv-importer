import type { DataSource } from '@/types/crm';

interface DataSourceBadgeProps {
  source: DataSource;
  showLabel?: boolean;
}

const sourceConfig: Record<Exclude<DataSource, null>, { label: string }> = {
  leads_on_demand: { label: 'Leads on Demand' },
  meridian_tower: { label: 'Meridian Tower' },
  eden_park: { label: 'Eden Park' },
  varah_swamy: { label: 'Varah Swamy' },
  sarjapur_plots: { label: 'Sarjapur Plots' },
};

export function DataSourceBadge({ source, showLabel = true }: DataSourceBadgeProps) {
  if (!source) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
        —
      </span>
    );
  }

  // ✅ THE FIX: Add a fallback object if the source isn't in your config
  const config = sourceConfig[source] || {
    label: source // Just print whatever text the backend sent!
  };

  return (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full">
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}