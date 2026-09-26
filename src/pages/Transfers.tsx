import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  Search,
  Building2,
  Layers,
  ArrowRight,
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

const Transfers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    operations,
    products,
    locations,
    getProductStock,
    createOperation,
    validateOperation,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const internalLocations = locations.filter(
    (l) => l.type === "internal" || l.type === "production"
  );

  const [sourceLocId, setSourceLocId] = useState(internalLocations[0]?.id || "");
  const [destLocId, setDestLocId] = useState(internalLocations[1]?.id || "");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState(20);
  const [transferNotes, setTransferNotes] = useState("");

  useEffect(() => {
    const action = searchParams.get("action");
    const srcLoc = searchParams.get("srcLoc");
    if (action === "new") {
      setIsCreateOpen(true);
      if (srcLoc) {
        setSourceLocId(srcLoc);
      }
    }
  }, [searchParams]);

  const transfers = operations.filter((op) => op.type === "internal");

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch = t.reference
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableInSource = getProductStock(productId, sourceLocId);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceLocId === destLocId) {
      toast.error("Source and destination locations cannot be the same.");
      return;
    }

    if (quantity <= 0) {
      toast.error("Transfer quantity must be greater than zero.");
      return;
    }

    if (availableInSource < quantity) {
      toast.error(
        `Insufficient stock at source location. Available: ${availableInSource}, Requested: ${quantity}`
      );
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const src = locations.find((l) => l.id === sourceLocId);
    const dest = locations.find((l) => l.id === destLocId);

    const item: OperationItem = {
      id: `item-tr-${Date.now()}`,
      productId,
      productName: prod?.name || "Product",
      sku: prod?.sku || "SKU",
      uom: prod?.uom || "Units",
      demandQty: Number(quantity),
      doneQty: Number(quantity),
    };

    const newOp = createOperation({
      type: "internal",
      status: "ready",
      partnerName: `${src?.name} → ${dest?.name}`,
      sourceLocationId: sourceLocId,
      destLocationId: destLocId,
      scheduledDate: new Date().toISOString(),
      notes: transferNotes || `Internal stock relocation`,
      items: [item],
      createdBy: user?.name || "Warehouse Staff",
    });

    toast.success(`Transfer ${newOp.reference} created. Ready to execute!`);
    setIsCreateOpen(false);
  };

  const handleValidate = (id: string) => {
    const res = validateOperation(id, user?.name || "Warehouse Staff");
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-purple-600" />
            Internal Transfers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Move stock between warehouses, racks, or staging production areas. Total company balance remains intact.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 gap-1.5 shadow-sm text-white"
        >
          <Plus className="h-4 w-4" />
          Schedule Transfer
        </Button>
      </div>

      {/* PDF Scenario Highlight */}
      <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 text-sm font-bold">
          3
        </div>
        <div className="text-xs text-purple-950 dark:text-purple-200">
          <p className="font-bold text-purple-800 dark:text-purple-300">
            Internal Staging: Main Store $\rightarrow$ Production Floor / Rack A $\rightarrow$ Rack B
          </p>
          <p className="mt-0.5">
            Internal movements reallocate product quantities to specific physical bins or assembly lines without altering overall company inventory valuation.
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
              placeholder="Search by transfer reference (e.g. WH/INT/0001)..."
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
              <option value="ready">Ready to Move</option>
              <option value="done">Completed (Done)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Transfer #</th>
                  <th className="px-4 py-3">Source Location</th>
                  <th className="px-4 py-3">Destination Location</th>
                  <th className="px-4 py-3">Product & Quantity</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No internal transfers found.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((t) => {
                    const src = locations.find((l) => l.id === t.sourceLocationId);
                    const dest = locations.find((l) => l.id === t.destLocationId);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold font-mono text-purple-600 dark:text-purple-400">
                          {t.reference}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {src?.name}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                          {dest?.name}
                        </td>
                        <td className="px-4 py-3">
                          {t.items.map((i) => (
                            <span key={i.id} className="font-semibold text-purple-700 dark:text-purple-400">
                              {i.demandQty} {i.uom} • {i.productName}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(t.scheduledDate)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={t.status === "done" ? "success" : "purple"}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {t.status !== "done" ? (
                            <Button
                              size="sm"
                              variant="success"
                              className="h-7 text-xs px-2.5"
                              onClick={() => handleValidate(t.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Execute Move
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              Transferred ✓
                            </span>
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

      {/* Create Internal Transfer Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-purple-600" />
              Schedule Internal Stock Transfer
            </DialogTitle>
            <DialogDescription>
              Relocate inventory items from one storage rack or warehouse to another.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransfer} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Source Location *
                </label>
                <select
                  value={sourceLocId}
                  onChange={(e) => setSourceLocId(e.target.value)}
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
                >
                  {internalLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Destination Location *
                </label>
                <select
                  value={destLocId}
                  onChange={(e) => setDestLocId(e.target.value)}
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
                >
                  {internalLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Product to Move *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
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
                  Quantity to Relocate
                </label>
                <Input
                  type="number"
                  min="1"
                  max={availableInSource}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-slate-500">
                  Currently Available in Source:
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {availableInSource} Units
                </span>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Transfer Purpose / Notes
                </label>
                <Input
                  placeholder="e.g. Move to production rack for frame welding"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                Create & Stage Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transfers;
