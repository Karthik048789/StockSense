import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  ArrowDownLeft,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  Truck,
} from "lucide-react";
import { useInventory } from "../../contexts/InventoryContext";
import { useAuth } from "../../contexts/AuthContext";
import { Product } from "../../types/inventory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/utils";
import { useNavigate } from "react-router-dom";

interface SmartReorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SmartReorderModal: React.FC<SmartReorderModalProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    products,
    categories,
    locations,
    getProductStock,
    createOperation,
  } = useInventory();

  // Find all products that breach reorder rules (stock <= minStockAlert)
  const lowStockItems = products.filter((p) => {
    const current = getProductStock(p.id);
    return current <= p.minStockAlert;
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    lowStockItems.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedProducts = lowStockItems.filter((p) => selectedItems[p.id]);

  const totalEstimatedCost = selectedProducts.reduce((sum, p) => {
    return sum + p.reorderQuantity * p.costPrice;
  }, 0);

  const totalReplenishUnits = selectedProducts.reduce((sum, p) => {
    return sum + p.reorderQuantity;
  }, 0);

  const handleGenerateReceipts = () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one item to reorder.");
      return;
    }

    const defaultInternalLoc =
      locations.find((l) => l.type === "internal")?.id || "loc-wh1-stock";

    // Auto-generate a vendor receipt for each category/supplier group
    const newOp = createOperation({
      type: "receipt",
      status: "ready",
      partnerName: "Automated Replenishment Consignment",
      sourceLocationId: "loc-vendor",
      destLocationId: defaultInternalLoc,
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days ahead
      notes: `Automated replenishment engine: ${selectedProducts.length} low-stock SKUs replenished.`,
      createdBy: `${user?.name || "System"} (Auto-Reorder Engine)`,
      items: selectedProducts.map((p, idx) => ({
        id: `auto-item-${Date.now()}-${idx}`,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        uom: p.uom,
        demandQty: p.reorderQuantity,
        doneQty: p.reorderQuantity,
      })),
    });

    toast.success(
      `Smart Reorder Engine created Receipt ${newOp.reference} for ${totalReplenishUnits} units (${formatCurrency(totalEstimatedCost)})!`,
      {
        action: {
          label: "View Receipts",
          onClick: () => navigate("/receipts"),
        },
      }
    );

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg">Smart Reorder & Replenishment Engine</DialogTitle>
              <DialogDescription className="text-xs">
                Automated stock rule optimizer detecting low-stock SKUs and generating draft vendor receipts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {lowStockItems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              All inventory levels are healthy!
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products are currently breaching their minimum safety thresholds (`minStockAlert`).
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Summary Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-400 block">
                  Items to Restock
                </span>
                <span className="text-xl font-bold text-amber-900 dark:text-amber-200">
                  {selectedProducts.length} <span className="text-xs font-normal">of {lowStockItems.length}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <span className="text-[11px] font-semibold uppercase text-blue-700 dark:text-blue-400 block">
                  Replenish Units
                </span>
                <span className="text-xl font-bold text-blue-900 dark:text-blue-200">
                  {totalReplenishUnits}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Estimated Cost
                </span>
                <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                  {formatCurrency(totalEstimatedCost)}
                </span>
              </div>
            </div>

            {/* Replenishment Table */}
            <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === lowStockItems.length}
                        onChange={(e) => {
                          const all: Record<string, boolean> = {};
                          lowStockItems.forEach((p) => {
                            all[p.id] = e.target.checked;
                          });
                          setSelectedItems(all);
                        }}
                        className="rounded text-blue-600"
                      />
                    </th>
                    <th className="p-2.5">Product & SKU</th>
                    <th className="p-2.5 text-center">Current Stock</th>
                    <th className="p-2.5 text-center">Safety Min</th>
                    <th className="p-2.5 text-center">Target Order</th>
                    <th className="p-2.5 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStockItems.map((prod) => {
                    const current = getProductStock(prod.id);
                    const isSelected = !!selectedItems[prod.id];
                    const cost = prod.reorderQuantity * prod.costPrice;

                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer ${
                          isSelected ? "bg-blue-50/20" : "opacity-60"
                        }`}
                        onClick={() => toggleSelect(prod.id)}
                      >
                        <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(prod.id)}
                            className="rounded text-blue-600"
                          />
                        </td>
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{prod.sku}</p>
                        </td>
                        <td className="p-2.5 text-center font-bold text-red-600">
                          {current} {prod.uom}
                        </td>
                        <td className="p-2.5 text-center font-medium text-slate-500">
                          {prod.minStockAlert}
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-600">
                          +{prod.reorderQuantity} {prod.uom}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium">
                          {formatCurrency(cost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          {lowStockItems.length > 0 && (
            <Button
              type="button"
              onClick={handleGenerateReceipts}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-semibold"
            >
              <Truck className="h-4 w-4" />
              Generate Vendor Receipts ({selectedProducts.length} SKUs)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
