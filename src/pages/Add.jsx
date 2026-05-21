import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, Package } from 'lucide-react';

const Add = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: '',
    purchase_price: '',
    selling_price: '',
    description: '',
    reorder_level: '',
    unit_price: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFallback = () => {
    navigate('/inventory');
  };

  const handleReset = () => {
    setFormData({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: '',
      quantity: '',
      purchase_price: '',
      selling_price: '',
      description: '',
      reorder_level: '',
      unit_price: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/products`, { // Adjust URL and Port if needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product');
      }

      setSuccess('Product added successfully!');
      handleReset();
    } catch (err) {
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-gray-600 mt-1">Enter product details to add to inventory</p>
        </div>

        <button
          onClick={handleFallback}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-800">
          <Package className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">

        <div className="p-6 space-y-6">

          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                type="text"
                name="name"
                placeholder="Product Name *"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="text"
                name="genericName"
                placeholder="Generic Name *"
                value={formData.genericName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Category</option>
                <option value="Pain Relief">Pain Relief</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Vitamins">Vitamins</option>
                <option value="Cold & Flu">Cold & Flu</option>
                <option value="First Aid">First Aid</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="text"
                name="manufacturer"
                placeholder="Manufacturer *"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Inventory Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                type="text"
                name="batch_number"
                placeholder="Batch Number *"
                value={formData.batch_number}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="date"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="number"
                name="reorder_level"
                placeholder="Reorder Level"
                value={formData.reorder_level}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="number"
                name="purchase_price"
                placeholder="Purchase Price"
                value={formData.purchase_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="number"
                name="unit_price"
                placeholder="Unit Price"
                value={formData.unit_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              />

              <input
                type="number"
                name="selling_price"
                placeholder="Selling Price *"
                value={formData.selling_price}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg">

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Add Product
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
};

export default Add;