import React, { useState } from "react";
import {
  History,
  Search,
  Download,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  Layers,
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { StockLedgerItem, OperationType } from "../types/inventory";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../lib/utils";
import { toast } from "sonner";

const MoveHistory: React.FC = () => {
  const { ledger } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredLedger = ledger.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "all" || item.operationType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      toast.info("No ledger items to export.");
      return;
    }

    const headers = [
      "Timestamp",
      "Reference",
      "Operation Type",
      "SKU",
      "Product Name",
      "From Location",
      "To Location",
      "Quantity",
      "UOM",
      "Responsible User",
      "Reason",
    ];

    const rows = filteredLedger.map((row) => [
      `"${row.timestamp}"`,
      `"${row.reference}"`,
      `"${row.operationType}"`,
      `"${row.sku}"`,
      `"${row.productName}"`,
      `"${row.fromLocationName}"`,
      `"${row.toLocationName}"`,
      row.quantity,
      `"${row.uom}"`,
      `"${row.user}"`,
      `"${row.reason || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `StockSense_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Stock Ledger exported successfully to CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-6 w-6 text-blue-600" />
            Stock Ledger & Movement History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable double-entry inventory ledger logging every incoming receipt, outbound delivery, transfer, and count adjustment.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="gap-1.5 shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export Ledger (CSV)
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by SKU, product name, reference #, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-xs font-medium outline-none"
            >
              <option value="all">All Movements</option>
              <option value="receipt">Receipts (Incoming)</option>
              <option value="delivery">Deliveries (Outgoing)</option>
              <option value="internal">Internal Transfers</option>
              <option value="adjustment">Stock Adjustments</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Reference #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product (SKU)</th>
                  <th className="px-4 py-3">From Location $\rightarrow$ To Location</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No stock movement ledger records found.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row) => {
                    const isPositive = row.quantity > 0 && row.operationType === "receipt";
                    const isNegative = row.quantity < 0 || row.operationType === "delivery";

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(row.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {row.reference}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {row.operationType === "receipt" && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <ArrowDownLeft className="h-3 w-3" /> Receipt
                            </span>
                          )}
                          {row.operationType === "delivery" && (
                            <span className="flex items-center gap-1 text-sky-600">
                              <ArrowUpRight className="h-3 w-3" /> Delivery
                            </span>
                          )}
                          {row.operationType === "internal" && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <ArrowLeftRight className="h-3 w-3" /> Transfer
                            </span>
                          )}
                          {row.operationType === "adjustment" && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-3 w-3" /> Adjustment
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {row.productName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">{row.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {row.fromLocationName}
                          </span>{" "}
                          $\rightarrow${" "}
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {row.toLocationName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? "text-emerald-600"
                                : isNegative
                                ? "text-red-600"
                                : "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {row.quantity > 0 && row.operationType === "receipt"
                              ? `+${row.quantity}`
                              : row.quantity}{" "}
                            {row.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {row.user}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {row.reason || "—"}
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
    </div>
  );
};

export default MoveHistory;
