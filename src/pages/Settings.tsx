import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  MapPin,
  Plus,
  Layers,
  RotateCcw,
  CheckCircle,
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

const Settings: React.FC = () => {
  const { role } = useAuth();
  const {
    warehouses,
    locations,
    addWarehouse,
    addLocation,
    resetToDemo,
  } = useInventory();

  const [isAddWhOpen, setIsAddWhOpen] = useState(false);
  const [isAddLocOpen, setIsAddLocOpen] = useState(false);

  // Form states
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");

  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locWarehouseId, setLocWarehouseId] = useState(warehouses[0]?.id || "");
  const [locRack, setLocRack] = useState("");

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCode.trim()) {
      toast.error("Warehouse name and code are required.");
      return;
    }
    addWarehouse(whName, whCode.toUpperCase(), whAddress);
    toast.success(`Warehouse "${whName}" created successfully!`);
    setIsAddWhOpen(false);
    setWhName("");
    setWhCode("");
    setWhAddress("");
  };

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim()) {
      toast.error("Location name and code are required.");
      return;
    }
    addLocation(locName, locCode.toUpperCase(), locWarehouseId, locRack);
    toast.success(`Location "${locName}" added!`);
    setIsAddLocOpen(false);
    setLocName("");
    setLocCode("");
    setLocRack("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            Warehouse & Location Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-warehouse topology, internal storage aisles, racks, and production zones.
          </p>
        </div>

        {role === "manager" && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddWhOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-sm text-white"
            >
              <Building2 className="h-4 w-4" />
              Add Warehouse
            </Button>
            <Button
              onClick={() => setIsAddLocOpen(true)}
              variant="outline"
              className="gap-1.5 shadow-sm"
            >
              <MapPin className="h-4 w-4" />
              Add Rack / Location
            </Button>
          </div>
        )}
      </div>

      {/* Warehouses Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Configured Warehouses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map((wh) => {
            const whLocations = locations.filter((l) => l.warehouseId === wh.id);
            return (
              <Card key={wh.id} className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{wh.name}</CardTitle>
                      <span className="font-mono text-xs text-slate-400">
                        Code: {wh.code}
                      </span>
                    </div>
                  </div>
                  {wh.isDefault && (
                    <Badge variant="default">Primary Hub</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-slate-500">{wh.address}</p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2">
                      Racks & Sub-Locations ({whLocations.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {whLocations.map((loc) => (
                        <span
                          key={loc.id}
                          className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                        >
                          {loc.name} {loc.rackNumber ? `[Rack ${loc.rackNumber}]` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* System Maintenance Card */}
      <Card className="border-red-200 dark:border-red-950/50 bg-red-50/20 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Demo System Reinitialization
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Reset all product quantities, movements, and ledger audit entries back to the original Odoo StockSense demonstration state.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Reset to default demonstration database?")) {
                resetToDemo();
                toast.success("Inventory reloaded to baseline scenario.");
              }
            }}
          >
            Reset Database to Demo
          </Button>
        </CardContent>
      </Card>

      {/* Add Warehouse Dialog */}
      <Dialog open={isAddWhOpen} onOpenChange={setIsAddWhOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Warehouse Facility</DialogTitle>
            <DialogDescription>
              Register a new physical distribution center or manufacturing plant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWarehouse} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Warehouse Name *
              </label>
              <Input
                required
                placeholder="e.g. North Regional Logistics Depot"
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Short Code (Unique) *
              </label>
              <Input
                required
                placeholder="e.g. WH-NORTH"
                value={whCode}
                onChange={(e) => setWhCode(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Address & Physical Location
              </label>
              <Input
                placeholder="Street address, city, sector"
                value={whAddress}
                onChange={(e) => setWhAddress(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddWhOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Warehouse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Location / Rack Dialog */}
      <Dialog open={isAddLocOpen} onOpenChange={setIsAddLocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Rack / Sub-Location</DialogTitle>
            <DialogDescription>
              Define internal storage aisles, shelving racks, or staging bins.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLocation} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Parent Warehouse *
              </label>
              <select
                value={locWarehouseId}
                onChange={(e) => setLocWarehouseId(e.target.value)}
                className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-xs"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Location Name *
              </label>
              <Input
                required
                placeholder="e.g. Zone B / High Density Rack"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Location Code *
              </label>
              <Input
                required
                placeholder="e.g. WH1/ZONE-B"
                value={locCode}
                onChange={(e) => setLocCode(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Rack / Shelf Identifier
              </label>
              <Input
                placeholder="e.g. RACK-B04"
                value={locRack}
                onChange={(e) => setLocRack(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddLocOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Sub-Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
