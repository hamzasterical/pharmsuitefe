import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Search, Trash2 } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState({
    full_name: '',
    phone: '',
    cnic: '',
  });
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [ocrImageFile, setOcrImageFile] = useState(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [ocrParsedItems, setOcrParsedItems] = useState([]);
  const [ocrSelection, setOcrSelection] = useState({});
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrError, setOcrError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('pharmsuite_token');
        const response = await fetch(`${API_BASE}/api/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load products');
        }
        setProducts(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!ocrImageFile) {
      setOcrPreviewUrl('');
      return;
    }

    const nextUrl = URL.createObjectURL(ocrImageFile);
    setOcrPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [ocrImageFile]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const generic = String(product.generic_name || '').toLowerCase();
      return name.includes(term) || generic.includes(term);
    });
  }, [products, searchTerm]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity * item.unit_price, 0);
  }, [cartItems]);

  const numericDiscountPercent = Number(discount || 0);
  const safeDiscountPercent = Number.isNaN(numericDiscountPercent) ? 0 : numericDiscountPercent;
  const numericTax = Number(tax || 0);
  const safeTax = Number.isNaN(numericTax) ? 0 : numericTax;
  const discountAmount = subtotal * (safeDiscountPercent / 100);
  const total = Math.max(0, subtotal - discountAmount + safeTax);
  const displayPaymentAmount = paymentAmount === '' ? total.toFixed(2) : paymentAmount;

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const addProductToCart = (product, quantityToAdd = 1) => {
    setCartItems((prev) => {
      if (!product || product.quantity <= 0) {
        return prev;
      }

      const safeQty = Math.max(1, Number(quantityToAdd || 1));
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => {
          if (item.id !== product.id) {
            return item;
          }
          const nextQty = Math.min(item.quantity + safeQty, product.quantity);
          return { ...item, quantity: nextQty };
        });
      }

      const startingQty = Math.min(safeQty, product.quantity);
      if (startingQty <= 0) {
        return prev;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          unit_price: Number(product.selling_price || 0),
          quantity: startingQty,
          maxQuantity: product.quantity,
        },
      ];
    });
  };

  const handleAddProduct = (product) => {
    addProductToCart(product, 1);
  };

  const handleAdjustQuantity = (id, delta) => {
    setCartItems((prev) => {
      return prev.reduce((acc, item) => {
        if (item.id !== id) {
          acc.push(item);
          return acc;
        }

        const nextQty = item.quantity + delta;
        if (nextQty <= 0) {
          return acc;
        }

        const boundedQty = Math.min(nextQty, item.maxQuantity);
        acc.push({ ...item, quantity: boundedQty });
        return acc;
      }, []);
    });
  };

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setCustomer({ full_name: '', phone: '', cnic: '' });
    setCartItems([]);
    setDiscount('');
    setTax('');
    setPaymentMethod('cash');
    setPaymentAmount('');
    setSearchTerm('');
  };

  const resetOcrPanel = () => {
    setOcrImageFile(null);
    setOcrRawText('');
    setOcrParsedItems([]);
    setOcrSelection({});
    setOcrStatus('idle');
    setOcrError('');
  };

  const handleOcrFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setOcrImageFile(file);
    setOcrRawText('');
    setOcrParsedItems([]);
    setOcrSelection({});
    setOcrStatus(file ? 'ready' : 'idle');
    setOcrError('');
  };

  const handleRunOcr = async () => {
    if (!ocrImageFile) {
      setOcrError('Please upload an image first.');
      return;
    }
    setOcrStatus('ocr');
    setOcrError('');

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const formData = new FormData();
      formData.append('file', ocrImageFile);

      const response = await fetch(`${API_BASE}/api/pos/ocr-prescription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'OCR failed');
      }

      const rawText = data?.data?.rawText || '';
      if (!rawText.trim()) {
        setOcrError('OCR completed but no text was detected.');
      }
      setOcrRawText(rawText);
      setOcrStatus('ocr-done');
    } catch (err) {
      setOcrError(err.message || 'OCR failed');
      setOcrStatus('ready');
    }
  };

  const handleParseWithGpt = async () => {
    if (!ocrRawText.trim()) {
      setOcrError('Run OCR to capture text first.');
      return;
    }
    setOcrStatus('gpt');
    setOcrError('');

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const response = await fetch(`${API_BASE}/api/pos/ocr-parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rawText: ocrRawText,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Parsing failed');
      }

      const medicines = data?.data?.parsed?.medicines || [];
      const metadataPattern = /(hospital|clinic|patient|doctor|dr\.?|address|phone|tel|date|age|reg|mrn|id|invoice|bill|receipt|notes|follow|diagnosis|complain)/i;
      const isLikelyMedicine = (name, dosage) => {
        const cleanName = String(name || '').trim();
        if (!cleanName) {
          return false;
        }
        if (metadataPattern.test(cleanName)) {
          return false;
        }
        if (!/[a-zA-Z]{3,}/.test(cleanName)) {
          return false;
        }
        if (cleanName.length > 60 && !dosage) {
          return false;
        }
        return true;
      };

      let parsed = medicines
        .filter((item) => item && (item.name || item.dosage))
        .map((item, index) => ({
          id: `ocr-${index}`,
          name: String(item.name || '').trim(),
          dosage: String(item.dosage || '').trim(),
        }))
        .filter((item) => isLikelyMedicine(item.name, item.dosage));

      if (parsed.length === 0) {
        if (data?.data?.parsed && Array.isArray(data.data.parsed.medicines)) {
          setOcrParsedItems([]);
          setOcrSelection({});
          setOcrError('No medicines detected in the prescription.');
          setOcrStatus('ready');
          return;
        }

        const hasNameSignal = /[a-zA-Z]{3,}/.test(ocrRawText);
        const hasDosageSignal = /(mg|ml|mcg|g|iu)\b/i.test(ocrRawText);
        if (!hasNameSignal && !hasDosageSignal) {
          setOcrParsedItems([]);
          setOcrSelection({});
          setOcrError('No medicines detected in the prescription.');
          setOcrStatus('ready');
          return;
        }

        const lines = ocrRawText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        parsed = lines.map((line, index) => {
          const parts = line.split(' ');
          const dosage = parts.pop() || '';
          const name = parts.join(' ');
          return {
            id: `ocr-${index}`,
            name: name || line,
            dosage,
          };
        }).filter((item) => isLikelyMedicine(item.name, item.dosage));
        
        if (parsed.length > 0) {
          setOcrError('GPT did not return structured data. Using basic parsing.');
        } else {
          setOcrError('No medicines detected in the prescription.');
        }
      }

      setOcrParsedItems(parsed);
      const nextSelection = parsed.reduce((acc, item) => {
        acc[item.id] = true;
        return acc;
      }, {});
      setOcrSelection(nextSelection);
      setOcrStatus('ready');
    } catch (err) {
      setOcrError(err.message || 'Parsing failed');
      setOcrStatus('ready');
    }
  };

  const handleToggleOcrItem = (id) => {
    setOcrSelection((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddOcrItemsToCart = () => {
    if (ocrParsedItems.length === 0) {
      setOcrError('No parsed items to add.');
      return;
    }

    const selectedItems = ocrParsedItems.filter((item) => ocrSelection[item.id]);
    if (selectedItems.length === 0) {
      setOcrError('Select at least one item to add.');
      return;
    }

    let missingNames = [];
    selectedItems.forEach((item) => {
      const match = products.find((product) => {
        const productName = String(product.name || '').toLowerCase();
        return productName.includes(item.name.toLowerCase());
      });

      if (match) {
        addProductToCart(match, 1);
      } else {
        missingNames.push(item.name);
      }
    });

    if (missingNames.length > 0) {
      setOcrError(`No inventory match for: ${missingNames.join(', ')}`);
    } else {
      setOcrError('');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const itemsToSend = cartItems.filter((item) => item.quantity > 0);

    if (itemsToSend.length === 0) {
      setError('Please add at least one product to the cart.');
      return;
    }

    const paymentValue = Number(paymentAmount || total);
    if (Number.isNaN(paymentValue) || paymentValue <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('pharmsuite_token');
      const response = await fetch(`${API_BASE}/api/pos/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer,
          items: itemsToSend.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          discount: discountAmount,
          tax: safeTax,
          payment: {
            method: paymentMethod,
            amount: paymentValue,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Checkout failed');
      }

      const saleId = data.data?.saleId || data.saleId;
      if (saleId) {
        setReceiptLoading(true);
        try {
          const receiptResponse = await fetch(`${API_BASE}/api/pos/sales/${saleId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const receiptJson = await receiptResponse.json();
          if (receiptResponse.ok) {
            setReceiptData(receiptJson.data || null);
            setReceiptOpen(true);
          }
        } finally {
          setReceiptLoading(false);
        }
      }

      setSuccess('Sale completed successfully.');
      handleReset();
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">New Transaction</h1>
        <p className="text-sm text-gray-500">Select medications and finalize the sale.</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 rounded-xl text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleCheckout} className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <section className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Inventory Search</h2>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by medication, generic, or SKU"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">OCR Intake</h2>
                <p className="text-xs text-gray-500">
                  Upload a prescription image to run Azure OCR and parse the text.
                </p>
              </div>
              <button
                type="button"
                onClick={resetOcrPanel}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            {ocrError && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {ocrError}
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,1.4fr]">
              <div className="space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Upload image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOcrFileChange}
                  className="w-full text-sm"
                />
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 text-center">
                  {ocrPreviewUrl ? (
                    <img
                      src={ocrPreviewUrl}
                      alt="Uploaded prescription preview"
                      className="mx-auto h-40 w-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-gray-500">No image selected yet.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRunOcr}
                    disabled={!ocrImageFile || ocrStatus === 'ocr'}
                    className="h-9 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {ocrStatus === 'ocr' ? 'Running OCR...' : 'Run OCR'}
                  </button>
                  <button
                    type="button"
                    onClick={handleParseWithGpt}
                    disabled={!ocrRawText || ocrStatus === 'gpt'}
                    className="h-9 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {ocrStatus === 'gpt' ? 'Parsing...' : 'Parse with GPT'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                    OCR text
                  </label>
                  <textarea
                    value={ocrRawText}
                    onChange={(e) => setOcrRawText(e.target.value)}
                    placeholder="OCR output will appear here"
                    className="mt-2 h-24 w-full rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600">Parsed medicines</p>
                    <button
                      type="button"
                      onClick={handleAddOcrItemsToCart}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Add to bill
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {ocrParsedItems.length === 0 ? (
                      <p className="text-xs text-gray-500">No parsed items yet.</p>
                    ) : (
                      ocrParsedItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 rounded-lg bg-white px-2 py-2 text-xs text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(ocrSelection[item.id])}
                            onChange={() => handleToggleOcrItem(item.id)}
                            className="mt-1"
                          />
                          <span>
                            <span className="font-semibold">{item.name}</span>
                            {item.dosage ? (
                              <span className="text-gray-500"> · {item.dosage}</span>
                            ) : null}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Matches are added by name against inventory. Dosage is shown for review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex-1">
            <div className="grid grid-cols-[2fr,1.2fr,1fr,1fr,90px] gap-4 bg-gray-50 px-6 py-4 text-[11px] uppercase tracking-widest text-gray-500">
              <span>Product</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Price</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No products found.</div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[2fr,1.2fr,1fr,1fr,90px] gap-4 px-6 py-5 items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.generic_name || 'Generic N/A'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {product.category || 'General'}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">{product.quantity}</span>
                    <span className="font-semibold text-blue-700">
                      PKR {Number(product.selling_price || 0).toFixed(2)}
                    </span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        disabled={product.quantity <= 0}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-40 disabled:hover:bg-blue-50 disabled:hover:text-blue-600"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="w-full lg:w-96 bg-gray-50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 bg-white/60">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Customer Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Search or add customer"
                  value={customer.full_name}
                  onChange={handleCustomerChange}
                  className="mt-2 w-full bg-white rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={customer.phone}
                  onChange={handleCustomerChange}
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200"
                />
                <input
                  type="text"
                  name="cnic"
                  placeholder="CNIC"
                  value={customer.cnic}
                  onChange={handleCustomerChange}
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/70 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">PKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (%)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 bg-gray-100 rounded-lg px-2 py-1 text-right text-sm font-medium"
                />
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Tax</span>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-24 bg-gray-100 rounded-lg px-2 py-1 text-right text-sm font-medium"
                />
              </div>
              <div className="pt-2 flex justify-between items-end">
                <span className="text-base font-semibold text-gray-800">Total</span>
                <span className="text-2xl font-extrabold text-blue-700">PKR {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                placeholder={`Amount (PKR ${total.toFixed(2)})`}
                value={displayPaymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading || receiptLoading}
              className="w-full h-12 bg-gradient-to-br from-[#00478d] to-[#005eb8] text-white font-semibold rounded-xl shadow-lg shadow-blue-200/60 hover:scale-[1.01] active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-full h-11 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-sm text-gray-500">No items added yet.</div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity} · PKR {item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdjustQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold text-gray-700">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustQuantity(item.id, 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      PKR {(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </form>

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={receiptData}
      />
    </div>
  );
};

export default POS;
