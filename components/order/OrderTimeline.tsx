'use client';

const STEPS = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const LABELS: Record<string, string> = {
  PENDING: 'Order placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Preparing',
  READY_FOR_DELIVERY: 'Ready for delivery',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export function OrderTimeline({
  currentStatus,
  history = [],
}: {
  currentStatus: string;
  history?: { status: string; note?: string; createdAt: string }[];
}) {
  const cancelled = currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';
  const currentIdx = STEPS.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      {!cancelled && (
        <div className="flex items-start justify-between gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const done = currentIdx >= i;
            const active = currentStatus === step;
            return (
              <div key={step} className="flex-1 min-w-[72px] flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    done
                      ? 'bg-[#2F6B52] border-[#2F6B52] text-white'
                      : 'bg-white border-gray-200 text-gray-400'
                  } ${active ? 'ring-4 ring-[#2F6B52]/20' : ''}`}
                >
                  {done ? '✓' : i + 1}
                </div>
                <p
                  className={`mt-2 text-[10px] sm:text-xs leading-tight ${
                    done ? 'text-[#2F6B52] font-medium' : 'text-gray-400'
                  }`}
                >
                  {LABELS[step] || step}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {cancelled && (
        <p className="text-sm font-medium text-red-600">{LABELS[currentStatus] || currentStatus}</p>
      )}

      {history.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activity</p>
          <ol className="relative border-l border-gray-200 ml-3 space-y-4">
            {history.map((h, idx) => (
              <li key={idx} className="ml-4">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-[#2F6B52] border-2 border-white" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{LABELS[h.status] || h.status}</p>
                {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(h.createdAt).toLocaleString('en-KE')}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
