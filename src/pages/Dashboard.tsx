import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  TrendingUp,
  Boxes,
  Layers,
  Sparkles,
  Compass,
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { SmartReorderModal } from "../components/inventory/SmartReorderModal";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { formatDate } from "../lib/utils";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const {
    products,
    categories,
    warehouses,
    locations,
    operations,
    stockLevels,
    selectedWarehouseId,
    getProductStock,
    validateOperation,
  } = useInventory();

  // Dynamic Filters State
  const [filterDocType, setFilterDocType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [reorderModalOpen, setReorderModalOpen] = useState(false);

  // KPI 1: Total Products in Stock
  const totalProductsCount = products.length;
  const totalUnitsInStock = products.reduce(
    (sum, p) => sum + getProductStock(p.id),
    0
  );

  // KPI 2: Low Stock & Out of Stock Items
  const lowStockItems = useMemo(() => {
    return products.filter((p) => {
      const stock = getProductStock(p.id);
      return stock <= p.minStockAlert;
    });
  }, [products, stockLevels, selectedWarehouseId]);

  const outOfStockItems = useMemo(() => {
    return products.filter((p) => getProductStock(p.id) === 0);
  }, [products, stockLevels, selectedWarehouseId]);

  // KPI 3: Pending Receipts
  const pendingReceipts = operations.filter(
    (o) =>
      o.type === "receipt" &&
      (o.status === "ready" || o.status === "waiting" || o.status === "draft")
  );

  // KPI 4: Pending Deliveries
  const pendingDeliveries = operations.filter(
    (o) =>
      o.type === "delivery" &&
      (o.status === "ready" || o.status === "waiting" || o.status === "draft")
  );

  // KPI 5: Internal Transfers Scheduled
  const scheduledTransfers = operations.filter(
    (o) =>
      o.type === "internal" &&
      (o.status === "ready" || o.status === "waiting" || o.status === "draft")
  );

  // Filtered Operations List
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      if (filterDocType !== "all" && op.type !== filterDocType) return false;
      if (filterStatus !== "all" && op.status !== filterStatus) return false;
      if (filterWarehouse !== "all") {
        const srcLoc = locations.find((l) => l.id === op.sourceLocationId);
        const destLoc = locations.find((l) => l.id === op.destLocationId);
        const matchesWh =
          op.warehouseId === filterWarehouse ||
          srcLoc?.warehouseId === filterWarehouse ||
          destLoc?.warehouseId === filterWarehouse;
        if (!matchesWh) return false;
      }
      if (filterCategory !== "all") {
        const hasProdInCat = op.items.some((item) => {
          const prod = products.find((p) => p.id === item.productId);
          return prod?.categoryId === filterCategory;
        });
        if (!hasProdInCat) return false;
      }
      return true;
    });
  }, [
    operations,
    filterDocType,
    filterStatus,
    filterWarehouse,
    filterCategory,
    locations,
    products,
  ]);

  // Chart data: Operations by status
  const chartData = [
    {
      name: "Receipts",
      Completed: operations.filter((o) => o.type === "receipt" && o.status === "done").length,
      Pending: operations.filter((o) => o.type === "receipt" && o.status !== "done").length,
    },
    {
      name: "Deliveries",
      Completed: operations.filter((o) => o.type === "delivery" && o.status === "done").length,
      Pending: operations.filter((o) => o.type === "delivery" && o.status !== "done").length,
    },
    {
      name: "Transfers",
      Completed: operations.filter((o) => o.type === "internal" && o.status === "done").length,
      Pending: operations.filter((o) => o.type === "internal" && o.status !== "done").length,
    },
    {
      name: "Adjustments",
      Completed: operations.filter((o) => o.type === "adjustment" && o.status === "done").length,
      Pending: operations.filter((o) => o.type === "adjustment" && o.status !== "done").length,
    },
  ];

  // Category distribution data
  const categoryChartData = categories.map((cat) => {
    const count = products
      .filter((p) => p.categoryId === cat.id)
      .reduce((sum, p) => sum + getProductStock(p.id), 0);
    return {
      name: cat.name,
      value: count,
      color: cat.color || "#3b82f6",
    };
  });

  const handleQuickValidate = (opId: string) => {
    const res = validateOperation(opId, user?.name || "Inventory User");
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Inventory Operations Dashboard
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
              Real-time
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete snapshot of stock movements, active warehouse transfers, and inventory KPIs.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => navigate("/map")}
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5 shadow-sm text-white"
          >
            <Compass className="h-4 w-4" />
            2D Floor Map
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/receipts?action=new")}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-sm text-white"
          >
            <ArrowDownLeft className="h-4 w-4" />
            New Receipt
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/deliveries?action=new")}
            className="gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" />
            New Delivery
          </Button>
        </div>
      </div>

      {/* 5 Core KPI Cards Required by StockSense.pdf */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Products in Stock */}
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Total Products
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Boxes className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {totalProductsCount} <span className="text-xs font-normal text-slate-500">SKUs</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {totalUnitsInStock}
              </span>{" "}
              total units tracked
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Low Stock / Out of Stock Items + Smart Reorder Trigger */}
        <Card className="hover:shadow-md transition-shadow border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
              Low / Out of Stock
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {lowStockItems.length}
              </div>
              {lowStockItems.length > 0 && (
                <button
                  onClick={() => setReorderModalOpen(true)}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="h-3 w-3" /> Auto-Reorder
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {outOfStockItems.length}
              </span>{" "}
              critical zero stock
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Pending Receipts */}
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Pending Receipts
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {pendingReceipts.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Incoming vendor goods</p>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Deliveries */}
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Pending Deliveries
            </span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700 dark:text-sky-400">
              {pendingDeliveries.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Customer dispatches</p>
          </CardContent>
        </Card>

        {/* KPI 5: Internal Transfers Scheduled */}
        <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Internal Transfers
            </span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {scheduledTransfers.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">In-transit & rack moves</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Overview Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Operational Activity Breakdown</span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardTitle>
            <p className="text-xs text-slate-500">
              Completed vs pending documents by operation type
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Stock Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Stock by Category</CardTitle>
            <p className="text-xs text-slate-500">Inventory volume distribution</p>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {categoryChartData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {cat.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {cat.value} units
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Filters Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base font-semibold">
                Operational Documents & Live Movements
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDocType("all");
                setFilterStatus("all");
                setFilterWarehouse("all");
                setFilterCategory("all");
              }}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Reset Filters
            </Button>
          </div>

          {/* Dynamic Filter Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Document Type
              </label>
              <select
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Documents</option>
                <option value="receipt">Receipts (Incoming)</option>
                <option value="delivery">Deliveries (Outgoing)</option>
                <option value="internal">Internal Transfers</option>
                <option value="adjustment">Stock Adjustments</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="waiting">Waiting</option>
                <option value="ready">Ready</option>
                <option value="done">Done</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Warehouse / Location
              </label>
              <select
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Product Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        {/* Operations Table */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">From $\rightarrow$ To</th>
                  <th className="px-4 py-3">Partner / Reason</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No operational documents matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op) => {
                    const srcLoc = locations.find((l) => l.id === op.sourceLocationId);
                    const destLoc = locations.find((l) => l.id === op.destLocationId);

                    return (
                      <tr
                        key={op.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold font-mono text-blue-600 dark:text-blue-400">
                          {op.reference}
                        </td>
                        <td className="px-4 py-3 capitalize font-medium">
                          {op.type === "receipt" && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <ArrowDownLeft className="h-3 w-3" /> Receipt
                            </span>
                          )}
                          {op.type === "delivery" && (
                            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                              <ArrowUpRight className="h-3 w-3" /> Delivery
                            </span>
                          )}
                          {op.type === "internal" && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                              <ArrowLeftRight className="h-3 w-3" /> Transfer
                            </span>
                          )}
                          {op.type === "adjustment" && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> Adjustment
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {srcLoc?.name || "Source"}
                          </span>{" "}
                          $\rightarrow${" "}
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {destLoc?.name || "Destination"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {op.partnerName || op.notes || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {op.items.map((i) => `${i.demandQty} ${i.uom} ${i.productName}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(op.scheduledDate)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              op.status === "done"
                                ? "success"
                                : op.status === "ready"
                                ? "default"
                                : op.status === "waiting"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {op.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {op.status === "ready" ? (
                            <Button
                              size="sm"
                              variant="success"
                              className="h-7 text-xs px-2.5 py-0"
                              onClick={() => handleQuickValidate(op.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Validate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => {
                                if (op.type === "receipt") navigate(`/receipts?id=${op.id}`);
                                else if (op.type === "delivery") navigate(`/deliveries?id=${op.id}`);
                                else if (op.type === "internal") navigate(`/transfers?id=${op.id}`);
                                else navigate(`/adjustments?id=${op.id}`);
                              }}
                            >
                              View
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reorder Modal */}
      <SmartReorderModal
        open={reorderModalOpen}
        onOpenChange={setReorderModalOpen}
      />
    </div>
  );
};

export default Dashboard;
