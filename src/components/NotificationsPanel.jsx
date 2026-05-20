import React from 'react';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const NotificationsPanel = ({ open, onClose, alerts, loading, error }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            <p className="text-xs text-gray-500">Inventory alerts</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="h-full overflow-y-auto px-5 py-4">
          {loading && (
            <p className="text-sm text-gray-500">Loading alerts...</p>
          )}
          {error && !loading && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {!loading && !error && alerts.length === 0 && (
            <p className="text-sm text-gray-500">No active alerts.</p>
          )}

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {alert.alert_type === 'expiry' ? 'Expiry Alert' : 'Low Stock'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {alert.product_name || 'Product'}
                    </p>
                  </div>
                  <span
                    className={
                      alert.alert_type === 'expiry'
                        ? 'rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700'
                        : 'rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700'
                    }
                  >
                    {alert.alert_type}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{alert.message}</p>
                <div className="mt-2 text-[11px] text-gray-400">
                  {formatDateTime(alert.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default NotificationsPanel;
