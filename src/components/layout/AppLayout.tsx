import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Settings,
  User,
  LogOut,
  Building2,
  AlertTriangle,
  Search,
  RotateCcw,
  ShieldCheck,
  HardHat,
  Menu,
  X,
  ChevronRight,
  Layers,
  Compass,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useInventory } from "../../contexts/InventoryContext";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { SmartReorderModal } from "../inventory/SmartReorderModal";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, switchRole, logout } = useAuth();
  const {
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    operations,
    products,
    getProductStock,
    resetToDemo,
  } = useInventory();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate live badge counts
  const pendingReceipts = operations.filter(
    (o) => o.type === "receipt" && (o.status === "ready" || o.status === "waiting")
  ).length;

  const pendingDeliveries = operations.filter(
    (o) => o.type === "delivery" && (o.status === "ready" || o.status === "waiting")
  ).length;

  const pendingTransfers = operations.filter(
    (o) => o.type === "internal" && (o.status === "ready" || o.status === "waiting")
  ).length;

  const lowStockCount = products.filter((p) => {
    const stock = getProductStock(p.id);
    return stock <= p.minStockAlert;
  }).length;

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Floor Map (2D)",
      path: "/map",
      icon: Compass,
      badge: "Digital Twin",
      badgeVariant: "info" as const,
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : null,
      badgeVariant: "destructive" as const,
    },
    {
      section: "OPERATIONS",
    },
    {
      name: "Receipts (Incoming)",
      path: "/receipts",
      icon: ArrowDownLeft,
      badge: pendingReceipts > 0 ? pendingReceipts : null,
      badgeVariant: "default" as const,
    },
    {
      name: "Delivery Orders",
      path: "/deliveries",
      icon: ArrowUpRight,
      badge: pendingDeliveries > 0 ? pendingDeliveries : null,
      badgeVariant: "info" as const,
    },
    {
      name: "Internal Transfers",
      path: "/transfers",
      icon: ArrowLeftRight,
      badge: pendingTransfers > 0 ? pendingTransfers : null,
      badgeVariant: "purple" as const,
    },
    {
      name: "Stock Adjustments",
      path: "/adjustments",
      icon: SlidersHorizontal,
      badge: null,
    },
    {
      section: "SYSTEM & AUDIT",
    },
    {
      name: "Move History (Ledger)",
      path: "/move-history",
      icon: History,
      badge: null,
    },
    {
      name: "Settings & Warehouses",
      path: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  const filteredSearchProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSearchOperations = operations.filter(
    (o) =>
      o.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRoleToggle = () => {
    const newRole = role === "manager" ? "staff" : "manager";
    switchRole(newRole);
    toast.info(`Switched role to: ${newRole === "manager" ? "Inventory Manager" : "Warehouse Staff"}`);
  };

  const handleResetData = () => {
    if (confirm("Reset all inventory, operations, and ledger to sample demo data?")) {
      resetToDemo();
      toast.success("Inventory state reset to default demo scenario!");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                StockSense
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  IMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Modular Inventory</p>
            </div>
          </Link>
        </div>

        {/* Role Switcher Pill */}
        <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {role === "manager" ? (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <HardHat className="h-4 w-4 text-amber-400" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {role === "manager" ? "Manager Mode" : "Staff Mode"}
              </span>
            </div>
            <button
              onClick={handleRoleToggle}
              title="Click to toggle between Manager & Staff roles"
              className="text-[11px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              Switch Role
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={`sec-${idx}`}
                  className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeVariant === "destructive"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : item.badgeVariant === "info"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        : item.badgeVariant === "purple"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Menu (Left Sidebar according to PDF spec) */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Inventory User"}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{role} Account</p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-700/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Warehouse Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500 hidden sm:block" />
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none"
              >
                <option value="all">🏢 All Warehouses (Global)</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    📍 {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick SKU Search Button */}
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SKU & Document Search...</span>
              <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 bg-white dark:bg-slate-900 border rounded text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* 1-Click Smart Reorder Button */}
            {lowStockCount > 0 && (
              <Button
                size="sm"
                onClick={() => setReorderModalOpen(true)}
                className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1.5 shadow-sm font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Auto-Reorder</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                  {lowStockCount}
                </span>
              </Button>
            )}

            {/* Reset Demo Data */}
            <button
              onClick={handleResetData}
              title="Reset sample scenario data"
              className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Profile Avatar Quicklink */}
            <Link
              to="/profile"
              className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm"
              title="My Profile"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Smart Reorder Engine Modal */}
      <SmartReorderModal
        open={reorderModalOpen}
        onOpenChange={setReorderModalOpen}
      />

      {/* Mobile Sidebar Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-slate-900 text-white p-4 h-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                <span className="font-bold">StockSense IMS</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-1">
              {navItems.map((item, idx) => {
                if (item.section) {
                  return (
                    <div
                      key={`m-sec-${idx}`}
                      className="pt-3 pb-1 px-2 text-[10px] font-bold uppercase text-slate-500"
                    >
                      {item.section}
                    </div>
                  );
                }
                const Icon = item.icon!;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={`m-${item.path}`}
                    to={item.path!}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      isActive ? "bg-blue-600 text-white font-semibold" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                className="w-full text-slate-200 border-slate-700 hover:bg-slate-800 justify-start"
                onClick={handleRoleToggle}
              >
                Switch to {role === "manager" ? "Staff Mode" : "Manager Mode"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global SKU & Document Search Modal */}
      <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Instant Search</DialogTitle>
            <DialogDescription>
              Find products by SKU, barcode, name, or lookup documents by reference number.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search SKU (e.g. STL-ROD-01), document (WH/IN/0001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {searchQuery.trim() === "" ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Type an SKU or reference to find real-time stock and documents.
              </p>
            ) : (
              <>
                {filteredSearchProducts.length > 0 && (
                  <div className="py-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Products</span>
                    {filteredSearchProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          navigate(`/products?sku=${p.sku}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer mt-1"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-500 font-mono">SKU: {p.sku}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-blue-600">
                            {getProductStock(p.id)} {p.uom}
                          </span>
                          <p className="text-[10px] text-slate-400">Total Stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredSearchOperations.length > 0 && (
                  <div className="py-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Documents</span>
                    {filteredSearchOperations.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => {
                          setGlobalSearchOpen(false);
                          if (op.type === "receipt") navigate(`/receipts?ref=${op.reference}`);
                          else if (op.type === "delivery") navigate(`/deliveries?ref=${op.reference}`);
                          else if (op.type === "internal") navigate(`/transfers?ref=${op.reference}`);
                          else navigate(`/adjustments?ref=${op.reference}`);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer mt-1"
                      >
                        <div>
                          <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-100">
                            {op.reference}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{op.type} • {op.partnerName || "Internal"}</p>
                        </div>
                        <Badge
                          variant={
                            op.status === "done"
                              ? "success"
                              : op.status === "ready"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {op.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {filteredSearchProducts.length === 0 && filteredSearchOperations.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No products or documents matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppLayout;
