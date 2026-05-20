import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertsError, setAlertsError] = useState("");
  const [chartMode, setChartMode] = useState("sales");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          fetch(`${API_BASE}/api/products`),
          fetch(`${API_BASE}/api/pos/sales?limit=50&offset=0`),
          fetch(`${API_BASE}/api/alerts?limit=20`),
        ]);

        const [productsResult, salesResult, alertsResult] = results;
        const errors = [];

        if (productsResult.status === "fulfilled") {
          const productsData = await productsResult.value.json();
          if (!productsResult.value.ok) {
            errors.push(productsData.message || "Failed to load products");
          } else if (isMounted) {
            setProducts(productsData.data || []);
          }
        } else {
          errors.push("Failed to load products");
        }

        if (salesResult.status === "fulfilled") {
          const salesData = await salesResult.value.json();
          if (!salesResult.value.ok) {
            errors.push(salesData.message || "Failed to load sales");
          } else if (isMounted) {
            setSales(salesData.data || []);
          }
        } else {
          errors.push("Failed to load sales");
        }

        if (alertsResult.status === "fulfilled") {
          const alertsData = await alertsResult.value.json();
          if (!alertsResult.value.ok) {
            if (isMounted) {
              setAlertsError(alertsData.message || "Failed to load alerts");
            }
          } else if (isMounted) {
            setAlerts(alertsData.data || []);
          }
        } else if (isMounted) {
          setAlertsError("Failed to load alerts");
        }

        if (errors.length && isMounted) {
          setError(errors.join(" | "));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [API_BASE]);

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);
    if (Number.isNaN(numericValue)) {
      return "PKR 0.00";
    }
    return `PKR ${numericValue.toFixed(2)}`;
  };

  const stats = useMemo(() => {
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todaysSales = sales.filter((sale) => {
      if (!sale.sale_date) return false;
      return new Date(sale.sale_date) >= dayStart;
    });

    const dailyRevenue = todaysSales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),
      0
    );

    const lowStockAlerts = alerts.filter((alert) => alert.alert_type === "low_stock");
    const lowStockProducts = products.filter((product) => {
      const threshold = Number(product.reorder_level ?? 20);
      return Number(product.quantity || 0) <= threshold;
    });

    const lowStockNames = (lowStockAlerts.length ? lowStockAlerts : lowStockProducts)
      .slice(0, 2)
      .map((item) => item.product_name || item.name)
      .filter(Boolean)
      .join(", ");

    return [
      {
        title: "Daily Revenue",
        value: formatCurrency(dailyRevenue),
        note: `${todaysSales.length} sales today`,
        accent: "text-blue-700",
      },
      {
        title: "Sales Today",
        value: `${todaysSales.length}`,
        note: "Total completed sales",
        accent: "text-gray-800",
      },
      {
        title: "Low Stock Alerts",
        value: `${lowStockAlerts.length || lowStockProducts.length}`,
        note: lowStockNames ? `Critical: ${lowStockNames}` : "No low stock items",
        accent: "text-red-600",
      },
    ];
  }, [alerts, products, sales]);

  const weeklySales = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayLabel = days[date.getDay()];
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dailySales = sales.filter((sale) => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate >= start && saleDate < end;
      });

      const total = dailySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      result.push({ day: dayLabel, sales: total / 1000, volume: dailySales.length });
    }

    return result;
  }, [sales]);

  const hourlyTraffic = useMemo(() => {
    const buckets = [8, 10, 12, 14, 16, 18];
    return buckets.map((hour) => {
      const start = new Date();
      start.setHours(hour, 0, 0, 0);
      const end = new Date();
      end.setHours(hour + 2, 0, 0, 0);

      const count = sales.filter((sale) => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate >= start && saleDate < end;
      }).length;

      const labelHour = hour <= 12 ? hour : hour - 12;
      const labelSuffix = hour < 12 ? "AM" : "PM";

      return {
        hour: `${labelHour} ${labelSuffix}`,
        value: count,
      };
    });
  }, [sales]);

  const revenueTrend = useMemo(() => {
    const range = 14;
    const today = new Date();
    const result = [];

    for (let i = range - 1; i >= 0; i -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dailySales = sales.filter((sale) => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate >= start && saleDate < end;
      });

      const total = dailySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      result.push({
        day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: total / 1000,
      });
    }

    return result;
  }, [sales]);

  const categoryStock = useMemo(() => {
    const totals = products.reduce((acc, product) => {
      const category = product.category || "Uncategorized";
      const quantity = Number(product.quantity || 0);
      acc[category] = (acc[category] || 0) + quantity;
      return acc;
    }, {});

    const sorted = Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 6) return sorted;

    const top = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    return [...top, { name: "Other", value: otherTotal }];
  }, [products]);

  const pieColors = ["#1d4ed8", "#22c55e", "#f97316", "#14b8a6", "#facc15", "#94a3b8"];

  const watchlist = useMemo(() => {
    if (alerts.length) {
      return alerts.slice(0, 5).map((alert) => {
        const isExpiry = alert.alert_type === "expiry";
        return {
          name: alert.product_name || "Product",
          note: alert.message,
          badge: isExpiry ? "Expiry" : "Low",
          badgeStyle: isExpiry ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700",
        };
      });
    }

    return products
      .filter((product) => {
        const threshold = Number(product.reorder_level ?? 20);
        return Number(product.quantity || 0) <= threshold;
      })
      .slice(0, 5)
      .map((product) => {
        const threshold = Number(product.reorder_level ?? 20);
        const isCritical = Number(product.quantity || 0) <= Math.max(1, Math.floor(threshold / 2));
        return {
          name: product.name,
          note: `${product.quantity || 0} units left`,
          badge: isCritical ? "Critical" : "Low",
          badgeStyle: isCritical ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
        };
      });
  }, [alerts, products]);

  const transactions = useMemo(() => {
    return sales.slice(0, 8).map((sale) => {
      const status = sale.status || "paid";
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
      const statusStyle =
        status === "paid"
          ? "bg-green-50 text-green-700"
          : status === "partial"
          ? "bg-amber-50 text-amber-700"
          : status === "unpaid"
          ? "bg-red-50 text-red-700"
          : "bg-gray-100 text-gray-600";

      return {
        id: `#${sale.id}`,
        customer: sale.customer_name || "Walk-in Customer",
        date: sale.sale_date ? new Date(sale.sale_date).toLocaleString() : "",
        status: statusLabel,
        total: formatCurrency(sale.total),
        statusStyle,
      };
    });
  }, [sales]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Track sales, prescriptions, and inventory health at a glance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500">{stat.title}</p>
            <p className={`text-2xl font-extrabold mt-2 ${stat.accent}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Weekly Performance</h2>
              <p className="text-xs text-gray-500">
                {chartMode === "sales"
                  ? "Sales total across the last 7 days"
                  : "Transaction volume across the last 7 days"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setChartMode("sales")}
                className={`px-3 py-1 rounded-lg font-semibold ${
                  chartMode === "sales"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setChartMode("volume")}
                className={`px-3 py-1 rounded-lg font-semibold ${
                  chartMode === "volume"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Volume
              </button>
            </div>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklySales} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005eb8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#005eb8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9aa3af" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9aa3af" }} />
                <Tooltip
                  formatter={(value) =>
                    chartMode === "sales"
                      ? [formatCurrency(Number(value) * 1000), "Sales"]
                      : [`${value} sales`, "Volume"]
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMode === "sales" ? "sales" : "volume"}
                  stroke="#005eb8"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800">Peak Traffic Hours</h3>
            <p className="text-xs text-gray-500">Optimal staffing recommendations</p>
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTraffic} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#eef0f4" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#9aa3af" }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} visits`, "Traffic"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                    }}
                  />
                  <Bar dataKey="value" fill="#90f4b7" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-800">Inventory Watchlist</h3>
            <div className="mt-4 space-y-3">
              {alertsError && !loading ? (
                <p className="text-xs text-red-600">{alertsError}</p>
              ) : watchlist.length === 0 && !loading ? (
                <p className="text-xs text-gray-500">No active alerts</p>
              ) : (
                watchlist.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.note}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.badgeStyle}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              className="mt-4 text-xs font-semibold text-blue-700"
            >
              View All Alerts
            </button>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl p-5 text-white shadow-sm">
            <h3 className="text-sm font-semibold">System Update</h3>
            <p className="text-xs text-blue-100 mt-2">
              PharmaPOS v1.1 launches tomorrow at 2:00 AM. Scheduled maintenance for
              30 minutes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Recent Transactions</h2>
            <p className="text-xs text-gray-500">Latest sales activity</p>
          </div>
          <button className="text-xs font-semibold text-gray-500">Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Patient / Customer</th>
                <th className="px-6 py-3">Sale Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 && !loading ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>
                    No recent sales found.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-blue-700">{txn.id}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">{txn.customer}</p>
                      <p className="text-xs text-gray-500">Sale record</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">{txn.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${txn.statusStyle}`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      {txn.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Revenue Trend</h2>
              <p className="text-xs text-gray-500">Last 14 days revenue (PKR)</p>
            </div>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eef0f4" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9aa3af" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9aa3af" }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value) * 1000), "Revenue"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Stock by Category</h2>
              <p className="text-xs text-gray-500">Current inventory mix</p>
            </div>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value) => [`${value} units`, "Stock"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
                  }}
                />
                <Pie
                  data={categoryStock}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categoryStock.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
            {categoryStock.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pieColors[index % pieColors.length] }}
                />
                <span className="truncate">{item.name}</span>
                <span className="ml-auto font-semibold text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;