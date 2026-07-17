import type { CrmStatus } from '@/types/crm';

interface CrmStatusBadgeProps {
  status: CrmStatus | null;
  showLabel?: boolean;
}

const statusConfig: Record<CrmStatus, { label: string; color: string; icon: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: 'Good Lead - Follow Up', color: 'bg-green-100 text-green-800', icon: '✓' },
  DID_NOT_CONNECT: { label: 'Did Not Connect', color: 'bg-yellow-100 text-yellow-800', icon: '✦' },
  BAD_LEAD: { label: 'Bad Lead', color: 'bg-red-100 text-red-800', icon: '✕' },
  SALE_DONE: { label: 'Sale Done', color: 'bg-green-100 text-green-800', icon: '✓' },
};

export function CrmStatusBadge({ status, showLabel = true }: CrmStatusBadgeProps) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        —
      </span>
    );
  }

  // ✅ THE FIX: Look up the config, but provide a safe fallback if the AI generated an unknown status
  const config = statusConfig[status] || {
    label: status, // Just display whatever weird text the AI sent
    color: 'bg-gray-100 text-gray-800 border border-gray-200', // Safe default colors
    icon: '•' // Safe default icon
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
      <span aria-hidden="true">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}