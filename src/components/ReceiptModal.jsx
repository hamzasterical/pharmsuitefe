import React from 'react';

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return 'PKR 0.00';
  }
  return `PKR ${numericValue.toFixed(2)}`;
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
};

const buildReceiptHtml = (receipt) => {
  const sale = receipt?.sale || {};
  const items = receipt?.items || [];
  const payments = receipt?.payments || [];

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td>${item.name || 'Item'}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${Number(item.unit_price || 0).toFixed(2)}</td>
          <td class="right">${Number(item.line_total || 0).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const paymentRows = payments
    .map(
      (payment) => `
        <div class="row">
          <span>${payment.method}</span>
          <span>${Number(payment.amount || 0).toFixed(2)}</span>
        </div>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: "Courier New", monospace;
            margin: 0;
            padding: 16px;
            width: 280px;
          }
          h1 {
            font-size: 16px;
            text-align: center;
            margin: 0 0 8px;
          }
          .meta {
            font-size: 12px;
            margin-bottom: 12px;
          }
          .meta div { margin-bottom: 4px; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td { padding: 4px 0; }
          th { text-align: left; border-bottom: 1px dashed #888; }
          td.right, th.right { text-align: right; }
          .totals { margin-top: 10px; font-size: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .divider { border-top: 1px dashed #888; margin: 8px 0; }
          .footer { text-align: center; font-size: 11px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <h1>PharmSuite Receipt</h1>
        <div class="meta">
          <div>Invoice: ${sale.invoice_no || `#${sale.id || ''}`}</div>
          <div>Date: ${formatDateTime(sale.sale_date)}</div>
          <div>Customer: ${sale.customer_name || 'Walk-in Customer'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows || '<tr><td colspan="4">No items</td></tr>'}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="totals">
          <div class="row"><span>Subtotal</span><span>${Number(sale.subtotal || 0).toFixed(2)}</span></div>
          <div class="row"><span>Discount</span><span>${Number(sale.discount || 0).toFixed(2)}</span></div>
          <div class="row"><span>Tax</span><span>${Number(sale.tax || 0).toFixed(2)}</span></div>
          <div class="row"><strong>Total</strong><strong>${Number(sale.total || 0).toFixed(2)}</strong></div>
        </div>
        ${payments.length ? '<div class="divider"></div>' : ''}
        ${payments.length ? `<div class="totals">${paymentRows}</div>` : ''}
        <div class="footer">Thank you for your purchase</div>
      </body>
    </html>
  `;
};

const ReceiptModal = ({ open, onClose, receipt }) => {
  if (!open) return null;

  const sale = receipt?.sale || {};
  const items = receipt?.items || [];

  const handlePrint = () => {
    if (!receipt) return;
    const receiptHtml = buildReceiptHtml(receipt);
    const printWindow = window.open('', 'print_receipt', 'width=420,height=680');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Receipt</h3>
            <p className="text-xs text-gray-500">
              {sale.invoice_no || `#${sale.id || ''}`} · {formatDateTime(sale.sale_date)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-semibold">PharmSuite</p>
            <p>Customer: {sale.customer_name || 'Walk-in Customer'}</p>
          </div>

          <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-sm text-gray-500" colSpan={4}>
                      No items found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-700">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 text-sm text-right text-gray-700">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-dashed border-gray-200 pt-4 text-sm text-gray-700 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="font-semibold">{formatCurrency(sale.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-semibold">{formatCurrency(sale.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
