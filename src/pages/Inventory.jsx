import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Plus, Search } from 'lucide-react';

const Inventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddProduct = () => {
    navigate('/inventory/add');
  };

  const exportToCsv = () => {
    const headers = [
      'Name',
      'Generic Name',
      'Category',
      'SKU',
      'Batch Number',
      'Expiry Date',
      'Quantity',
      'Reorder Level',
      'Purchase Price',
      'Selling Price',
      'Unit Price',
      'Manufacturer',
    ];

    const rows = filteredProducts.map((product) => [
      product.name || '',
      product.generic_name || '',
      product.category || '',
      product.sku || '',
      product.batch_number || '',
      product.expiry_date || '',
      product.quantity ?? '',
      product.reorder_level ?? '',
      product.purchase_price ?? '',
      product.selling_price ?? '',
      product.unit_price ?? '',
      product.manufacturer || '',
    ]);

    const escapeCell = (value) => {
      const cell = String(value).replace(/"/g, '""');
      return `"${cell}"`;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('pharmsuite_token');
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/api/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load inventory');
        }
        setProducts(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return ['all', ...Array.from(unique)];
  }, [products]);

  const inventoryValuation = useMemo(() => {
    return products.reduce((total, product) => {
      const price = Number(product.purchase_price || product.selling_price || 0);
      const quantity = Number(product.quantity || 0);
      return total + price * quantity;
    }, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((product) => {
      if (product.reorder_level === null || product.reorder_level === undefined) {
        return false;
      }
      return Number(product.quantity || 0) <= Number(product.reorder_level || 0);
    }).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const today = new Date();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        String(product.name || '').toLowerCase().includes(term) ||
        String(product.generic_name || '').toLowerCase().includes(term) ||
        String(product.sku || '').toLowerCase().includes(term);

      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

      const quantity = Number(product.quantity || 0);
      const reorder = Number(product.reorder_level || 0);
      const isLowStock = reorder > 0 && quantity <= reorder;
      const isExpired = product.expiry_date && new Date(product.expiry_date) < today;

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && isLowStock) ||
        (stockFilter === 'expired' && isExpired);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const formatCurrency = (value) => {
    return Number(value || 0).toFixed(2);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">Dashboard / Inventory Management</p>
          <h1 className="text-2xl font-extrabold text-gray-800">Medication Stock</h1>
          <p className="text-sm text-gray-500">Real-time oversight of pharmaceutical assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportToCsv}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center gap-2"
          >
            <FileDown size={16} />
            Export List
          </button>
          <button
            type="button"
            onClick={handleAddProduct}
            className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-br from-[#00478d] to-[#005eb8] shadow-lg shadow-blue-200/50 flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Item
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500">Total SKUs</p>
          <p className="text-2xl font-extrabold text-gray-800">{products.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500">Low Stock Alerts</p>
          <p className="text-2xl font-extrabold text-gray-800">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500">Inventory Valuation</p>
          <p className="text-2xl font-extrabold text-gray-800">PKR {formatCurrency(inventoryValuation)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500">Items Dispensed</p>
          <p className="text-2xl font-extrabold text-gray-800">--</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white rounded-xl pl-4 pr-10 py-2 text-sm font-semibold text-gray-700"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStockFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                  stockFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('low')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                  stockFilter === 'low' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Low Stock
              </button>
              <button
                type="button"
                onClick={() => setStockFilter('expired')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                  stockFilter === 'expired' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                Expired
              </button>
            </div>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search medications, SKU, or batch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white rounded-full pl-9 pr-4 py-2 text-sm"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Medication Name</th>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const quantity = Number(product.quantity || 0);
                    const reorder = Number(product.reorder_level || 0);
                    const percent = reorder > 0 ? Math.min(100, Math.round((quantity / reorder) * 100)) : 100;
                    const isLowStock = reorder > 0 && quantity <= reorder;
                    const badgeClass = isLowStock
                      ? 'bg-red-50 text-red-700'
                      : 'bg-green-50 text-green-700';

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
                        <td className="px-6 py-5 text-xs text-gray-500">
                          {product.sku || '—'}
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            {product.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-semibold text-gray-800">
                          PKR {formatCurrency(product.selling_price)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isLowStock ? 'bg-red-400' : 'bg-green-400'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
                              {quantity} Units
                            </span>
                          </div>
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
    </div>
  );
};

export default Inventory;