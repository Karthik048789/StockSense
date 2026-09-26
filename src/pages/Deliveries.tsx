import React, { useState } from "react";
import {
  ArrowUpRight,
  Plus,
  CheckCircle2,
  PackageCheck,
  Search,
  Check,
  AlertCircle,
  Truck,
  Box,
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

const Deliveries: React.FC = () => {
  const { user } = useAuth();
  const {
    operations,
    products,
    locations,
    getProductStock,
    createOperation,
    validateOperation,
    togglePickPack,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePickingDelivery, setActivePickingDelivery] = useState<Operation | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState(
    locations.find((l) => l.type === "internal")?.id || ""
  );
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    { productId: string; demandQty: number }[]
  >([{ productId: products[1]?.id || products[0]?.id || "", demandQty: 10 }]);

  const deliveries = operations.filter((op) => op.type === "delivery");

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.partnerName && d.partnerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter a customer name.");
      return;
    }

    const srcLoc = locations.find((l) => l.id === sourceLocationId);

    // Validate availability
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      const available = getProductStock(item.productId, sourceLocationId);
      if (available < item.demandQty) {
        toast.error(
          `Insufficient stock for ${prod?.name}. Available in ${srcLoc?.name}: ${available}, Requested: ${item.demandQty}`
        );
        return;
      }
    }

    const operationItems: OperationItem[] = items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        id: `item-del-${Date.now()}-${idx}`,
        productId: item.productId,
        productName: prod?.name || "Product",
        sku: prod?.sku || "SKU",
        uom: prod?.uom || "Units",
        demandQty: Number(item.demandQty),
        doneQty: Number(item.demandQty),
        isPicked: false,
        isPacked: false,
      };
    });

    const newOp = createOperation({
      type: "delivery",
      status: "ready",
      partnerName: customerName,
      sourceLocationId,
      destLocationId: "loc-customer",
      warehouseId: srcLoc?.warehouseId,
      scheduledDate: new Date(scheduledDate).toISOString(),
      notes,
      items: operationItems,
      createdBy: user?.name || "Warehouse Staff",
    });

    toast.success(`Delivery Order ${newOp.reference} generated and ready for picking!`);
    setIsCreateOpen(false);
    setCustomerName("");
    setNotes("");
  };

  const handleValidate = (deliveryId: string) => {
    const result = validateOperation(deliveryId, user?.name || "Warehouse Staff");
    if (result.success) {
      toast.success(result.message);
      if (activePickingDelivery?.id === deliveryId) {
        setActivePickingDelivery(null);
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
            <ArrowUpRight className="h-6 w-6 text-sky-600" />
            Delivery Orders (Outgoing Stock)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch items for customer orders. Step through Pick & Pack operations before validating stock deductions.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 gap-1.5 shadow-sm text-white"
        >
          <Plus className="h-4 w-4" />
          Create Delivery Order
        </Button>
      </div>

      {/* PDF Walkthrough Box (Step 3: Sales Order Delivery) */}
      <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
          2
        </div>
        <div className="text-xs text-sky-950 dark:text-sky-200">
          <p className="font-bold text-sky-800 dark:text-sky-300">
            Outbound Flow: Pick $\rightarrow$ Pack $\rightarrow$ Validate
          </p>
          <p className="mt-0.5">
            Click <strong>Pick & Pack Items</strong> on any ready order to verify physical shelving items and package contents. Once confirmed, <strong>Validate</strong> dispatches the goods and decrements physical inventory with an audit log.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by order # (e.g. WH/OUT/0001) or customer name..."
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
              <option value="ready">Ready to Ship</option>
              <option value="waiting">Waiting for Stock</option>
              <option value="done">Delivered (Done)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Delivery #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Source Location</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Items & Picking Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No delivery orders found.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((d) => {
                    const srcLoc = locations.find((l) => l.id === d.sourceLocationId);
                    const allPicked = d.items.every((i) => i.isPicked);
                    const allPacked = d.items.every((i) => i.isPacked);

                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold font-mono text-sky-600 dark:text-sky-400">
                          {d.reference}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {d.partnerName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {srcLoc?.name || "Main Warehouse"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(d.scheduledDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {d.items.map((i) => (
                              <div key={i.id} className="flex items-center gap-2">
                                <span className="font-medium">
                                  {i.demandQty} {i.uom} • {i.productName}
                                </span>
                                {d.status !== "done" && (
                                  <span className="text-[10px] text-slate-400">
                                    [{i.isPicked ? "✓ Picked" : "⏳ Pending"} |{" "}
                                    {i.isPacked ? "✓ Packed" : "⏳ Pending"}]
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              d.status === "done"
                                ? "success"
                                : d.status === "ready"
                                ? "info"
                                : "secondary"
                            }
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          {d.status !== "done" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2.5 text-sky-600 hover:text-sky-700"
                                onClick={() => setActivePickingDelivery(d)}
                              >
                                <PackageCheck className="h-3 w-3 mr-1" />
                                Pick & Pack
                              </Button>
                              <Button
                                size="sm"
                                variant="success"
                                className="h-7 text-xs px-2.5"
                                onClick={() => handleValidate(d.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Validate
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setActivePickingDelivery(d)}
                            >
                              Dispatch Details
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

      {/* Pick & Pack Operational Dialog (Step 1 & Step 2 from PDF) */}
      <Dialog
        open={!!activePickingDelivery}
        onOpenChange={(open) => !open && setActivePickingDelivery(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="font-mono text-sky-600">
                {activePickingDelivery?.reference}
              </span>
              <Badge
                variant={
                  activePickingDelivery?.status === "done" ? "success" : "info"
                }
              >
                {activePickingDelivery?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Customer: <strong>{activePickingDelivery?.partnerName}</strong>
            </DialogDescription>
          </DialogHeader>

          {activePickingDelivery && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-500">
                Warehouse staff must pick items from shelving racks and pack into shipment containers before final validation.
              </p>

              <div className="border rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {activePickingDelivery.items.map((item) => (
                  <div key={item.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{item.productName}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          SKU: {item.sku} • Quantity: {item.demandQty} {item.uom}
                        </p>
                      </div>
                      <Badge variant="outline">Demand: {item.demandQty}</Badge>
                    </div>

                    {activePickingDelivery.status !== "done" && (
                      <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
                          <input
                            type="checkbox"
                            checked={!!item.isPicked}
                            onChange={(e) =>
                              togglePickPack(
                                activePickingDelivery.id,
                                item.id,
                                "pick",
                                e.target.checked
                              )
                            }
                            className="rounded text-sky-600"
                          />
                          <span className={item.isPicked ? "font-bold text-sky-600" : ""}>
                            1. Item Picked from Rack
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">
                          <input
                            type="checkbox"
                            checked={!!item.isPacked}
                            onChange={(e) =>
                              togglePickPack(
                                activePickingDelivery.id,
                                item.id,
                                "pack",
                                e.target.checked
                              )
                            }
                            className="rounded text-sky-600"
                          />
                          <span className={item.isPacked ? "font-bold text-sky-600" : ""}>
                            2. Item Packed for Shipment
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {activePickingDelivery?.status !== "done" ? (
              <Button
                variant="success"
                onClick={() =>
                  activePickingDelivery && handleValidate(activePickingDelivery.id)
                }
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Validate & Dispatch Outbound Stock
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setActivePickingDelivery(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Delivery Order Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-sky-600" />
              Create Delivery Order
            </DialogTitle>
            <DialogDescription>
              Prepare an outgoing order for customer dispatch.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDelivery} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Customer Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Skyline Logistics Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Source Warehouse / Location *
                </label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
                >
                  {locations
                    .filter((l) => l.type === "internal")
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Scheduled Dispatch Date
                </label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2 border-t pt-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Products to Deliver
              </span>
              {items.map((item, idx) => {
                const available = getProductStock(item.productId, sourceLocationId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].productId = e.target.value;
                        setItems(copy);
                      }}
                      className="flex-1 h-8 bg-transparent border border-input rounded px-2 text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
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
                          const copy = [...items];
                          copy[idx].demandQty = Number(e.target.value);
                          setItems(copy);
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                      In Stock: <span className="font-bold">{available}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Order Notes
              </label>
              <Input
                placeholder="Shipping instructions, invoice number..."
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
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white">
                Create Order & Begin Picking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deliveries;
