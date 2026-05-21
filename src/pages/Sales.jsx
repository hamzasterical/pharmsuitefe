import React, { useEffect, useState } from 'react';
import ReceiptModal from '../components/ReceiptModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const PAGE_SIZE = 50;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const fetchSales = async ({ reset = false } = {}) => {
    if (loading) return;
    setLoading(true);
    setError('');

    const offset = reset ? 0 : sales.length;

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const response = await fetch(
        `${API_BASE}/api/pos/sales?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load sales');
      }

      const rows = data.data || [];
      setSales((prev) => (reset ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales({ reset: true });
  }, []);

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  const handleViewReceipt = async (saleId) => {
    setReceiptLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const response = await fetch(`${API_BASE}/api/pos/sales/${saleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load receipt');
      }

      setReceiptData(data.data || null);
      setReceiptOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to load receipt');
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Sales</h1>
        <p className="text-sm text-gray-500">Latest transactions and payments</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 bg-gray-50">
          <span>Invoice</span>
          <span>Date</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Subtotal</span>
          <span>Total</span>
          <span className="text-right">Receipt</span>
        </div>
        <div className="divide-y">
          {sales.map((sale) => (
            <div key={sale.id} className="grid grid-cols-7 gap-4 px-6 py-4 text-sm">
              <span className="font-semibold text-gray-800">{sale.invoice_no || `#${sale.id}`}</span>
              <span className="text-gray-500">{formatDateTime(sale.sale_date)}</span>
              <span className="text-gray-700">{sale.customer_name || 'Walk-in'}</span>
              <span className="text-gray-700 capitalize">{sale.status}</span>
              <span className="text-gray-700">{sale.subtotal}</span>
              <span className="font-semibold text-gray-800">{sale.total}</span>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleViewReceipt(sale.id)}
                  disabled={receiptLoading}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  View
                </button>
              </div>
            </div>
          ))}

          {!sales.length && !loading && (
            <div className="px-6 py-6 text-sm text-gray-500">No sales yet.</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => fetchSales()}
          disabled={loading || !hasMore}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : hasMore ? 'Load 50 more' : 'No more sales'}
        </button>
        <button
          onClick={() => fetchSales({ reset: true })}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={receiptData}
      />
    </div>
  );
};

export default Sales;
