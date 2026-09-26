import React, { useState } from "react";
import {
  Layers,
  MapPin,
  ArrowRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowLeftRight,
  TrendingUp,
  Maximize2,
  Eye,
  Building2,
  Truck,
  Flame,
} from "lucide-react";
import { useInventory } from "../../contexts/InventoryContext";
import { Location, Product } from "../../types/inventory";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface WarehouseDigitalTwinProps {
  warehouseId?: string;
}

export const WarehouseDigitalTwin: React.FC<WarehouseDigitalTwinProps> = ({
  warehouseId,
}) => {
  const navigate = useNavigate();
  const {
    warehouses,
    locations,
    products,
    stockLevels,
  } = useInventory();

  const [activeWhId, setActiveWhId] = useState<string>(
    warehouseId || warehouses[0]?.id || "wh-1"
  );
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "low" | "full">("all");

  const activeWarehouse =
    warehouses.find((w) => w.id === activeWhId) || warehouses[0];

  const whLocations = locations.filter(
    (l) => l.warehouseId === activeWhId && l.type !== "vendor" && l.type !== "customer"
  );

  // Compute stock per location
  const getLocationStockItems = (locId: string) => {
    return stockLevels
      .filter((s) => s.locationId === locId && s.quantity > 0)
      .map((s) => {
        const prod = products.find((p) => p.id === s.productId);
        return {
          product: prod,
          quantity: s.quantity,
          isLow: prod ? s.quantity <= prod.minStockAlert : false,
        };
      });
  };

  const getLocationTotalUnits = (locId: string) => {
    return stockLevels
      .filter((s) => s.locationId === locId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Warehouse Selector & Heatmap Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Warehouse:
          </span>
          <select
            value={activeWhId}
            onChange={(e) => {
              setActiveWhId(e.target.value);
              setSelectedLocation(null);
            }}
            className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
          >
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-600 dark:text-slate-400">Optimal Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-slate-600 dark:text-slate-400">Low Stock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-slate-600 dark:text-slate-400">Depleted / 0</span>
          </div>
        </div>
      </div>

      {/* Main Floor Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Floor Canvas */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden text-slate-100">
          {/* Blueprint Grid Lines Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#3b82f6 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 12px 12px",
            }}
          />

          <div className="relative z-10 space-y-5">
            {/* Top Row: Inbound Receiving Dock & QA Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inbound Bay */}
              <div className="p-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Inbound Dock Bay 01
                    </span>
                    <p className="text-xs text-slate-400">Goods Receiving & Unloading</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">
                  Active Gate
                </Badge>
              </div>

              {/* Quality & Quarantine */}
              <div className="p-3 rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      Inspection & Staging
                    </span>
                    <p className="text-xs text-slate-400">Safety & Barcode Triage</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-[10px]">
                  Ready
                </Badge>
              </div>
            </div>

            {/* Middle Section: Warehouse Aisles & Physical Racks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
                <span>STORAGE MATRIX & SHELVING AISLES</span>
                <span className="font-mono text-[10px] text-blue-400">Click rack to inspect</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {whLocations.map((loc) => {
                  const items = getLocationStockItems(loc.id);
                  const totalUnits = getLocationTotalUnits(loc.id);
                  const isSelected = selectedLocation?.id === loc.id;
                  const hasZeroStock = totalUnits === 0;
                  const hasLowStock = items.some((i) => i.isLow);

                  // Heatmap color logic
                  const statusColor = hasZeroStock
                    ? "border-red-500/40 bg-red-500/10 text-red-400 hover:border-red-500"
                    : hasLowStock
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:border-amber-500"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500";

                  const pulseDot = hasZeroStock
                    ? "bg-red-500"
                    : hasLowStock
                    ? "bg-amber-400"
                    : "bg-emerald-400";

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 relative ${statusColor} ${
                        isSelected
                          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-[1.02]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs tracking-tight truncate max-w-[130px]">
                          {loc.name}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${pulseDot} shrink-0 animate-pulse`} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-[10px]">
                          {loc.rackNumber ? `Rack ${loc.rackNumber}` : "Zone"}
                        </span>
                        <span className="font-bold text-slate-100">
                          {totalUnits} Units
                        </span>
                      </div>

                      <div className="mt-2 text-[10px] text-slate-400 line-clamp-1">
                        {items.length === 0
                          ? "Empty Shelving"
                          : `${items.length} Product SKU(s)`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Production Floor & Outbound Dispatch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Production Area */}
              <div className="p-3 rounded-xl border border-dashed border-purple-500/40 bg-purple-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                      Production & Assembly Line
                    </span>
                    <p className="text-xs text-slate-400">Work in Progress (WIP)</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px]">
                  Online
                </Badge>
              </div>

              {/* Outbound Dispatch Dock */}
              <div className="p-3 rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      Outbound Dispatch Dock
                    </span>
                    <p className="text-xs text-slate-400">Customer Logistics & Staging</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-[10px]">
                  Carrier Ready
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Live Rack Inspector Sidebar */}
        <div className="lg:col-span-4">
          <Card className="h-full border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Live Rack Inspector
                </CardTitle>
                {selectedLocation && (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {selectedLocation.code}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {!selectedLocation ? (
                <div className="py-16 text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No location selected
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Click any shelving rack or dock on the 2D layout to inspect physical inventory.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Location Header */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeWarehouse.name} •{" "}
                      {selectedLocation.rackNumber
                        ? `Rack Identifier: ${selectedLocation.rackNumber}`
                        : "General Storage Zone"}
                    </p>
                  </div>

                  {/* Stock Metrics */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Current Occupancy:</span>
                    <span className="font-mono font-bold text-base text-blue-600">
                      {getLocationTotalUnits(selectedLocation.id)} Units
                    </span>
                  </div>

                  {/* Items Stored */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Stored Products ({getLocationStockItems(selectedLocation.id).length})
                    </span>

                    {getLocationStockItems(selectedLocation.id).length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        This rack is currently empty.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {getLocationStockItems(selectedLocation.id).map(
                          ({ product, quantity, isLow }, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {product?.name || "Product"}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {product?.sku}
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`text-xs font-bold ${
                                    isLow ? "text-amber-600" : "text-slate-900 dark:text-slate-100"
                                  }`}
                                >
                                  {quantity} {product?.uom}
                                </span>
                                {isLow && (
                                  <span className="block text-[9px] text-amber-500 font-semibold">
                                    Low Stock Alert
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Rack Actions */}
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1.5 justify-start"
                      onClick={() => navigate(`/transfers?action=new&srcLoc=${selectedLocation.id}`)}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5 text-purple-600" />
                      Initiate Move from this Rack
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs gap-1.5 justify-start"
                      onClick={() => navigate(`/adjustments?action=new&loc=${selectedLocation.id}`)}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
                      Physical Cycle Count on Rack
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
