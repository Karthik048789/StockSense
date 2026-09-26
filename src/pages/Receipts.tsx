import React, { useState } from "react";
import {
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Search,
  Building,
  Check,
  X,
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Operation, OperationItem } from "../types/inventory";
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

const Receipts: React.FC = () => {
  const { user } = useAuth();
  const {
    operations,
    products,
    locations,
    warehouses,
    createOperation,
    validateOperation,
    updateOperation,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Operation | null>(null);

  // Form state for creating a new receipt
  const [supplierName, setSupplierName] = useState("");
  const [destLocationId, setDestLocationId] = useState(
    locations.find((l) => l.type === "internal")?.id || ""
  );
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    { productId: string; demandQty: number; doneQty: number }[]
  >([{ productId: products[0]?.id || "", demandQty: 50, doneQty: 50 }]);

  const receipts = operations.filter((op) => op.type === "receipt");

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.partnerName && r.partnerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { productId: products[0]?.id || "", demandQty: 10, doneQty: 10 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error("Please enter a supplier or vendor name.");
      return;
    }

    const destLoc = locations.find((l) => l.id === destLocationId);

    const operationItems: OperationItem[] = items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        id: `item-${Date.now()}-${idx}`,
        productId: item.productId,
        productName: prod?.name || "Product",
        sku: prod?.sku || "SKU",
        uom: prod?.uom || "Units",
        demandQty: Number(item.demandQty),
        doneQty: Number(item.doneQty),
      };
    });

    const newOp = createOperation({
      type: "receipt",
      status: "ready",
      partnerName: supplierName,
      sourceLocationId: "loc-vendor",
      destLocationId,
      warehouseId: destLoc?.warehouseId,
      scheduledDate: new Date(scheduledDate).toISOString(),
      notes,
      items: operationItems,
      createdBy: user?.name || "Inventory Manager",
    });

    toast.success(`Receipt ${newOp.reference} created and marked Ready for validation!`);
    setIsCreateOpen(false);
    // Reset form
    setSupplierName("");
    setNotes("");
    setItems([{ productId: products[0]?.id || "", demandQty: 50, doneQty: 50 }]);
  };

  const handleValidate = (receiptId: string) => {
    const result = validateOperation(receiptId, user?.name || "Inventory User");
    if (result.success) {
      toast.success(result.message);
      if (selectedReceipt?.id === receiptId) {
        setSelectedReceipt(null);
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowDownLeft className="h-6 w-6 text-emerald-600" />
            Receipts (Incoming Stock)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Receive consignments from vendors. Validating automatically increments stock in destination locations.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 shadow-sm text-white"
        >
          <Plus className="h-4 w-4" />
          Create Receipt
        </Button>
      </div>

      {/* Example Walkthrough Box (Directly from PDF Page 2 Example) */}
      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
          1
        </div>
        <div className="text-xs text-emerald-950 dark:text-emerald-200">
          <p className="font-bold text-emerald-800 dark:text-emerald-300">
            Standard Flow: Vendor Shipment Receiving
          </p>
          <p className="mt-0.5">
            When raw materials or finished goods arrive from suppliers, generate a receipt, specify quantities received, and click <strong>Validate</strong>. The system records the ledger audit trail and instantly boosts location inventory.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by receipt # (e.g. WH/IN/0001) or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-xs font-medium outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready to Validate</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done (Validated)</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Supplier / Vendor</th>
                  <th className="px-4 py-3">Destination Location</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Products & Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No receipts found.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => {
                    const destLoc = locations.find((l) => l.id === r.destLocationId);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                          {r.reference}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {r.partnerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {destLoc?.name || "Main Warehouse"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(r.scheduledDate)}
                        </td>
                        <td className="px-4 py-3">
                          {r.items.map((i) => (
                            <div key={i.id} className="font-medium">
                              {i.demandQty} {i.uom} • {i.productName}
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              r.status === "done"
                                ? "success"
                                : r.status === "ready"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {r.status !== "done" && r.status !== "canceled" && (
                            <Button
                              size="sm"
                              variant="success"
                              className="h-7 text-xs px-2.5"
                              onClick={() => handleValidate(r.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Validate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setSelectedReceipt(r)}
                          >
                            Details
                          </Button>
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

      {/* Create Receipt Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
              Create Vendor Goods Receipt
            </DialogTitle>
            <DialogDescription>
              Record an incoming shipment from a supplier or vendor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReceipt} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Supplier / Vendor Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Apex Steel Works Ltd"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Destination Warehouse / Location *
                </label>
                <select
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
                >
                  {locations
                    .filter((l) => l.type === "internal")
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.rackNumber ? `Rack ${loc.rackNumber}` : "General"})
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Scheduled Delivery Date
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Products to Receive
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddItemRow}
                  className="h-7 text-xs text-blue-600 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Line
                </Button>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <select
                    value={item.productId}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].productId = e.target.value;
                      setItems(newItems);
                    }}
                    className="flex-1 h-8 bg-transparent border border-input rounded px-2 text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) [{p.uom}]
                      </option>
                    ))}
                  </select>

                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="h-8 text-xs"
                      value={item.demandQty}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].demandQty = Number(e.target.value);
                        newItems[index].doneQty = Number(e.target.value);
                        setItems(newItems);
                      }}
                    />
                  </div>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleRemoveItemRow(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Notes / Carrier Bill #
              </label>
              <Input
                placeholder="Consignment invoice or carrier delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Save & Prepare Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Details Modal */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="font-mono text-emerald-600">
                {selectedReceipt?.reference}
              </span>
              <Badge
                variant={selectedReceipt?.status === "done" ? "success" : "default"}
              >
                {selectedReceipt?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Supplier: {selectedReceipt?.partnerName}
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Scheduled Date:</span>
                  <p className="font-medium">{formatDate(selectedReceipt.scheduledDate)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Created By:</span>
                  <p className="font-medium">{selectedReceipt.createdBy}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Demand</th>
                      <th className="px-3 py-2 text-right">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedReceipt.items.map((i) => (
                      <tr key={i.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium">{i.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{i.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {i.demandQty} {i.uom}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-600">
                          {selectedReceipt.status === "done" ? i.doneQty : i.demandQty} {i.uom}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedReceipt?.status !== "done" && (
              <Button
                variant="success"
                onClick={() => selectedReceipt && handleValidate(selectedReceipt.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Validate & Increment Stock
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receipts;
