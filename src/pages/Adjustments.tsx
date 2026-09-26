import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Search,
  Scale,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "../lib/utils";

const Adjustments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    products,
    locations,
    operations,
    getProductStock,
    executeStockAdjustment,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [selectedLocationId, setSelectedLocationId] = useState(
    locations.find((l) => l.type === "internal")?.id || ""
  );
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState<
    "damaged" | "theft" | "count_correction" | "expired" | "other"
  >("damaged");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const action = searchParams.get("action");
    const loc = searchParams.get("loc");
    if (action === "new") {
      const prod = products[0];
      const targetLoc = loc ? locations.find((l) => l.id === loc) : locations.find((l) => l.type === "internal");
      setSelectedProductId(prod?.id || "");
      setSelectedLocationId(targetLoc?.id || "");
      const sysStock = getProductStock(prod?.id || "", targetLoc?.id);
      setCountedQty(sysStock);
      setReason("count_correction");
      setNotes(`Cycle count initiated for location: ${targetLoc?.name || targetLoc?.id}`);
      setIsModalOpen(true);
    }
  }, [searchParams, products, locations]);

  const currentSystemQty = getProductStock(selectedProductId, selectedLocationId);
  const delta = countedQty - currentSystemQty;

  const handleOpenAuditModal = () => {
    const prod = products[0];
    const loc = locations.find((l) => l.type === "internal");
    setSelectedProductId(prod?.id || "");
    setSelectedLocationId(loc?.id || "");
    const sysStock = getProductStock(prod?.id || "", loc?.id);
    setCountedQty(sysStock);
    setReason("damaged");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (delta === 0) {
      toast.info("Physical count matches system stock. No variance detected.");
      setIsModalOpen(false);
      return;
    }

    executeStockAdjustment(
      selectedProductId,
      selectedLocationId,
      Number(countedQty),
      reason,
      notes || `Physical Cycle Count: ${reason}`,
      user?.name || "Inventory Manager"
    );

    toast.success(
      `Inventory adjusted for ${prod.name}. Variance of ${delta > 0 ? `+${delta}` : delta} ${prod.uom} logged to ledger!`
    );
    setIsModalOpen(false);
  };

  // Adjustments history from operations
  const adjustments = operations.filter((op) => op.type === "adjustment");
  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-amber-600" />
            Stock Adjustments & Physical Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Resolve mismatches between system recorded stock and actual physical shelf counts (damages, write-offs, cycle counts).
          </p>
        </div>

        <Button
          onClick={handleOpenAuditModal}
          className="bg-amber-600 hover:bg-amber-700 gap-1.5 shadow-sm text-white"
        >
          <Scale className="h-4 w-4" />
          Physical Cycle Count / Adjustment
        </Button>
      </div>

      {/* PDF Scenario Highlight (Step 4: Damaged Items) */}
      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
          4
        </div>
        <div className="text-xs text-amber-950 dark:text-amber-200">
          <p className="font-bold text-amber-800 dark:text-amber-300">
            Damaged Stock & Physical Shrinkage Example
          </p>
          <p className="mt-0.5">
            If 3 kg of Steel Rods are damaged or lost during handling, enter the counted quantity. The system automatically computes the difference, marks the scrap loss to Virtual Inventory Loss, and updates the Stock Ledger.
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search adjustments by reference # or reason notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Adjustments History Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">
            Adjustment Log & Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Adjustment #</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Location Audited</th>
                  <th className="px-4 py-3">Variance Applied</th>
                  <th className="px-4 py-3">Reason Code</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Audit Date</th>
                  <th className="px-4 py-3">Responsible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock adjustments on record.
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adj) => {
                    const item = adj.items[0];
                    const loc = locations.find((l) => l.id === adj.sourceLocationId);

                    return (
                      <tr
                        key={adj.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold font-mono text-amber-600 dark:text-amber-400">
                          {adj.reference}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {item?.productName} ({item?.sku})
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {loc?.name || "Main Stock"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className="text-red-600 dark:text-red-400">
                            -{item?.doneQty} {item?.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">
                          <Badge variant="warning">
                            {adj.adjustmentReason || "count_correction"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {adj.notes || "Physical count correction"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(adj.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {adj.createdBy}
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

      {/* Physical Count Adjustment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-600" />
              Physical Count & Inventory Adjustment
            </DialogTitle>
            <DialogDescription>
              Select product and warehouse rack, enter physical count, and confirm the variance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyAdjustment} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Select Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const sys = getProductStock(e.target.value, selectedLocationId);
                  setCountedQty(sys);
                }}
                className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Warehouse Location *
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  const sys = getProductStock(selectedProductId, e.target.value);
                  setCountedQty(sys);
                }}
                className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
              >
                {locations
                  .filter((l) => l.type === "internal" || l.type === "production")
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Live Delta Calculation Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">System Recorded Stock:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentSystemQty} Units
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Actual Counted Quantity *
                </label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(Number(e.target.value))}
                  className="font-bold text-base"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <span className="font-semibold text-slate-600">Inventory Variance ($\Delta$):</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    delta < 0
                      ? "text-red-600"
                      : delta > 0
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta} Units
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Reason Code
              </label>
              <select
                value={reason}
                onChange={(e) =>
                  setReason(
                    e.target.value as "damaged" | "theft" | "count_correction" | "expired" | "other"
                  )
                }
                className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
              >
                <option value="damaged">Damaged in Handling / Transit</option>
                <option value="count_correction">Physical Audit Correction</option>
                <option value="theft">Shrinkage / Missing Stock</option>
                <option value="expired">Expired / Obsolete</option>
                <option value="other">Other Variance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Audit Notes / Explanation
              </label>
              <Input
                placeholder="e.g. 3 kg steel rods damaged by forklift offload"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Confirm & Recalibrate Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Adjustments;
