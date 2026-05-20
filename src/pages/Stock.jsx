import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load stock data');
        }
        setProducts(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const today = new Date();

  const stockSummary = useMemo(() => {
    const totalItems = products.length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const lowStock = products.filter((p) => {
      const qty = Number(p.quantity || 0);
      const reorder = Number(p.reorder_level || 0);
      return reorder > 0 && qty <= reorder;
    }).length;
    const expired = products.filter((p) => {
      if (!p.expiry_date) return false;
      return new Date(p.expiry_date) < today;
    }).length;
    const nearExpiry = products.filter((p) => {
      if (!p.expiry_date) return false;
      const expDate = new Date(p.expiry_date);
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return expDate >= today && expDate <= thirtyDays;
    }).length;

    return { totalItems, totalUnits, lowStock, expired, nearExpiry };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const qty = Number(p.quantity || 0);
      const reorder = Number(p.reorder_level || 0);
      const isLow = reorder > 0 && qty <= reorder;
      const isExpired = p.expiry_date && new Date(p.expiry_date) < today;
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      const isNearExpiry = p.expiry_date && new Date(p.expiry_date) >= today && new Date(p.expiry_date) <= thirtyDays;

      if (filter === 'low') return isLow;
      if (filter === 'expired') return isExpired;
      if (filter === 'near-expiry') return isNearExpiry;
      return true;
    });
  }, [products, filter]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  };

  const getStockBadge = (product) => {
    const qty = Number(product.quantity || 0);
    const reorder = Number(product.reorder_level || 0);
    const isExpired = product.expiry_date && new Date(product.expiry_date) < today;

    if (isExpired) {
      return { label: 'Expired', className: 'bg-red-100 text-red-700' };
    }
    if (qty === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-700' };
    }
    if (reorder > 0 && qty <= reorder) {
      return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'In Stock', className: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Stock Overview</h1>
        <p className="text-sm text-gray-500">
          Monitor stock levels, expiry dates, and reorder alerts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total SKUs</p>
              <p className="text-xl font-extrabold text-gray-800">{stockSummary.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Units</p>
              <p className="text-xl font-extrabold text-gray-800">{stockSummary.totalUnits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Low Stock</p>
              <p className="text-xl font-extrabold text-amber-600">{stockSummary.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Near Expiry</p>
              <p className="text-xl font-extrabold text-orange-500">{stockSummary.nearExpiry}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Expired</p>
              <p className="text-xl font-extrabold text-red-600">{stockSummary.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl w-fit">
        {[
          { key: 'all', label: 'All Items' },
          { key: 'low', label: 'Low Stock' },
          { key: 'near-expiry', label: 'Near Expiry' },
          { key: 'expired', label: 'Expired' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Batch</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Reorder Level</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading stock data...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    No items found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const badge = getStockBadge(product);
                  const qty = Number(product.quantity || 0);
                  const reorder = Number(product.reorder_level || 0);
                  const percent = reorder > 0 ? Math.min(100, Math.round((qty / reorder) * 100)) : 100;
                  const barColor = badge.label === 'In Stock' ? 'bg-green-400' : badge.label === 'Low Stock' ? 'bg-amber-400' : 'bg-red-400';

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.generic_name || 'Generic N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {product.batch_number || '—'}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">
                        {formatDate(product.expiry_date)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{qty}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-600">
                        {reorder > 0 ? reorder : '—'}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stock;
