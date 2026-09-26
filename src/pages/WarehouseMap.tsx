import React, { useState } from "react";
import {
  Compass,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { WarehouseDigitalTwin } from "../components/warehouse/WarehouseDigitalTwin";
import { SmartReorderModal } from "../components/inventory/SmartReorderModal";
import { Button } from "../components/ui/button";

const WarehouseMap: React.FC = () => {
  const [reorderOpen, setReorderOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Compass className="h-6 w-6 text-blue-600" />
            Warehouse Digital Twin (2D Floor Map)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time interactive spatial layout, rack occupancy heatmaps, and dock staging areas.
          </p>
        </div>

        <Button
          onClick={() => setReorderOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm font-semibold text-xs"
        >
          <Sparkles className="h-4 w-4" />
          Run Smart Reorder Engine
        </Button>
      </div>

      {/* Interactive 2D Digital Twin Component */}
      <WarehouseDigitalTwin />

      {/* Smart Reorder Engine Modal */}
      <SmartReorderModal open={reorderOpen} onOpenChange={setReorderOpen} />
    </div>
  );
};

export default WarehouseMap;
