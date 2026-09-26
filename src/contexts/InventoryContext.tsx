import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Product,
  ProductCategory,
  Warehouse,
  Location,
  StockLevel,
  Operation,
  StockLedgerItem,
  OperationType,
  OperationStatus,
  OperationItem,
} from "../types/inventory";
import {
  initialProducts,
  initialCategories,
  initialWarehouses,
  initialLocations,
  initialStockLevels,
  initialOperations,
  initialLedger,
} from "../data/initialData";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { toast } from "sonner";

interface InventoryContextType {
  products: Product[];
  categories: ProductCategory[];
  warehouses: Warehouse[];
  locations: Location[];
  stockLevels: StockLevel[];
  operations: Operation[];
  ledger: StockLedgerItem[];
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  isCloudSynced: boolean;

  // Product Actions
  addProduct: (
    product: Omit<Product, "id" | "createdAt">,
    initialStock?: { locationId: string; quantity: number }
  ) => Promise<Product>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductStock: (productId: string, locationId?: string) => number;
  getProductLocationsBreakdown: (productId: string) => {
    location: Location;
    quantity: number;
    warehouse?: Warehouse;
  }[];

  // Category & Warehouse Actions
  addCategory: (name: string, description?: string, color?: string) => Promise<void>;
  addWarehouse: (name: string, code: string, address: string) => Promise<void>;
  addLocation: (name: string, code: string, warehouseId: string, rack?: string) => Promise<void>;

  // Operation Actions
  createOperation: (
    op: Omit<Operation, "id" | "reference" | "createdAt">
  ) => Operation;
  updateOperation: (op: Operation) => void;
  deleteOperation: (id: string) => void;
  validateOperation: (operationId: string, currentUser?: string) => { success: boolean; message: string };
  togglePickPack: (
    operationId: string,
    itemId: string,
    action: "pick" | "pack",
    value: boolean
  ) => void;

  // Adjustments specific
  executeStockAdjustment: (
    productId: string,
    locationId: string,
    countedQty: number,
    reason: "damaged" | "theft" | "count_correction" | "expired" | "other",
    notes: string,
    user: string
  ) => void;

  // Helpers
  resetToDemo: () => void;
  syncFromSupabase: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "stocksense_products",
  CATEGORIES: "stocksense_categories",
  WAREHOUSES: "stocksense_warehouses",
  LOCATIONS: "stocksense_locations",
  STOCK: "stocksense_stock_levels",
  OPERATIONS: "stocksense_operations",
  LEDGER: "stocksense_ledger",
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [locations, setLocations] = useState<Location[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    return saved ? JSON.parse(saved) : initialLocations;
  });

  const [stockLevels, setStockLevels] = useState<StockLevel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK);
    return saved ? JSON.parse(saved) : initialStockLevels;
  });

  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OPERATIONS);
    return saved ? JSON.parse(saved) : initialOperations;
  });

  const [ledger, setLedger] = useState<StockLedgerItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEDGER);
    return saved ? JSON.parse(saved) : initialLedger;
  });

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");

  // Sync state to localStorage cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stockLevels));
  }, [stockLevels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
  }, [ledger]);

  // Fetch initial data from Supabase if configured
  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [
        prodsRes,
        catsRes,
        whsRes,
        locsRes,
        stocksRes,
        opsRes,
        ledsRes,
      ] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("warehouses").select("*"),
        supabase.from("locations").select("*"),
        supabase.from("stock_levels").select("*"),
        supabase.from("operations").select("*").order("created_at", { ascending: false }),
        supabase.from("stock_ledger").select("*").order("timestamp", { ascending: false }),
      ]);

      if (prodsRes.data && prodsRes.data.length > 0) {
        setProducts(
          prodsRes.data.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            categoryId: p.category_id,
            uom: p.uom,
            costPrice: Number(p.cost_price),
            sellingPrice: Number(p.selling_price),
            minStockAlert: Number(p.min_stock_alert),
            reorderQuantity: Number(p.reorder_quantity),
            description: p.description,
            createdAt: p.created_at,
          }))
        );
      }

      if (catsRes.data && catsRes.data.length > 0) {
        setCategories(
          catsRes.data.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            color: c.color,
          }))
        );
      }

      if (whsRes.data && whsRes.data.length > 0) {
        setWarehouses(
          whsRes.data.map((w) => ({
            id: w.id,
            name: w.name,
            code: w.code,
            address: w.address,
            isDefault: w.is_default,
          }))
        );
      }

      if (locsRes.data && locsRes.data.length > 0) {
        setLocations(
          locsRes.data.map((l) => ({
            id: l.id,
            warehouseId: l.warehouse_id,
            name: l.name,
            code: l.code,
            type: l.type,
            rackNumber: l.rack_number,
          }))
        );
      }

      if (stocksRes.data && stocksRes.data.length > 0) {
        setStockLevels(
          stocksRes.data.map((s) => ({
            id: s.id,
            productId: s.product_id,
            locationId: s.location_id,
            warehouseId: s.warehouse_id,
            quantity: Number(s.quantity),
          }))
        );
      }

      if (opsRes.data && opsRes.data.length > 0) {
        setOperations(
          opsRes.data.map((o) => ({
            id: o.id,
            reference: o.reference,
            type: o.type,
            status: o.status,
            partnerName: o.partner_name,
            sourceLocationId: o.source_location_id,
            destLocationId: o.dest_location_id,
            warehouseId: o.warehouse_id,
            scheduledDate: o.scheduled_date,
            completedDate: o.completed_date,
            notes: o.notes,
            items: o.items || [],
            createdBy: o.created_by,
            createdAt: o.created_at,
            adjustmentReason: o.adjustment_reason,
          }))
        );
      }

      if (ledsRes.data && ledsRes.data.length > 0) {
        setLedger(
          ledsRes.data.map((l) => ({
            id: l.id,
            timestamp: l.timestamp,
            reference: l.reference,
            operationType: l.operation_type,
            productId: l.product_id,
            productName: l.product_name,
            sku: l.sku,
            fromLocationId: l.from_location_id,
            fromLocationName: l.from_location_name,
            toLocationId: l.to_location_id,
            toLocationName: l.to_location_name,
            quantity: Number(l.quantity),
            uom: l.uom,
            user: l.user,
            reason: l.reason,
          }))
        );
      }

      setIsCloudSynced(true);
    } catch (err) {
      console.warn("Could not sync from Supabase, using local state cache:", err);
    }
  }, []);

  useEffect(() => {
    syncFromSupabase();
  }, [syncFromSupabase]);

  // Stock helpers
  const getProductStock = (productId: string, locationId?: string): number => {
    if (locationId) {
      const match = stockLevels.find(
        (s) => s.productId === productId && s.locationId === locationId
      );
      return match ? match.quantity : 0;
    }
    if (selectedWarehouseId !== "all") {
      return stockLevels
        .filter(
          (s) => s.productId === productId && s.warehouseId === selectedWarehouseId
        )
        .reduce((sum, item) => sum + item.quantity, 0);
    }
    return stockLevels
      .filter((s) => s.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getProductLocationsBreakdown = (productId: string) => {
    const relevantLevels = stockLevels.filter((s) => s.productId === productId);
    return relevantLevels.map((lvl) => {
      const loc = locations.find((l) => l.id === lvl.locationId) || {
        id: lvl.locationId,
        name: "Unknown Location",
        code: "UNK",
        type: "internal" as const,
      };
      const wh = warehouses.find((w) => w.id === (loc.warehouseId || lvl.warehouseId));
      return {
        location: loc,
        quantity: lvl.quantity,
        warehouse: wh,
      };
    });
  };

  // Product CRUD
  const addProduct = async (
    newProdData: Omit<Product, "id" | "createdAt">,
    initialStock?: { locationId: string; quantity: number }
  ): Promise<Product> => {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...newProdData,
      id,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [product, ...prev]);

    if (initialStock && initialStock.quantity > 0) {
      const loc = locations.find((l) => l.id === initialStock.locationId);
      const whId = loc?.warehouseId || warehouses[0]?.id;

      setStockLevels((prev) => [
        ...prev,
        {
          id: `sl-${Date.now()}`,
          productId: id,
          locationId: initialStock.locationId,
          warehouseId: whId,
          quantity: initialStock.quantity,
        },
      ]);

      const ledgerEntry: StockLedgerItem = {
        id: `led-${Date.now()}`,
        timestamp: new Date().toISOString(),
        reference: "INV/INIT/" + product.sku,
        operationType: "receipt",
        productId: id,
        productName: product.name,
        sku: product.sku,
        fromLocationId: "loc-vendor",
        fromLocationName: "Initial Inventory Setup",
        toLocationId: initialStock.locationId,
        toLocationName: loc?.name || "Target Location",
        quantity: initialStock.quantity,
        uom: product.uom,
        user: "System Admin",
        reason: "Initial Stock Count Setup",
      };
      setLedger((prev) => [ledgerEntry, ...prev]);

      // Write to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("stock_levels").insert({
            id: `sl-${Date.now()}`,
            product_id: id,
            location_id: initialStock.locationId,
            warehouse_id: whId,
            quantity: initialStock.quantity,
          });
          await supabase.from("stock_ledger").insert({
            id: ledgerEntry.id,
            timestamp: ledgerEntry.timestamp,
            reference: ledgerEntry.reference,
            operation_type: ledgerEntry.operationType,
            product_id: id,
            product_name: product.name,
            sku: product.sku,
            from_location_id: "loc-vendor",
            from_location_name: "Initial Inventory Setup",
            to_location_id: initialStock.locationId,
            to_location_name: loc?.name || "Target Location",
            quantity: initialStock.quantity,
            uom: product.uom,
            user: "System Admin",
            reason: "Initial Stock Count Setup",
          });
        } catch (e) {
          console.warn("Supabase initial stock write failed:", e);
        }
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("products").insert({
          id,
          name: product.name,
          sku: product.sku,
          category_id: product.categoryId,
          uom: product.uom,
          cost_price: product.costPrice,
          selling_price: product.sellingPrice,
          min_stock_alert: product.minStockAlert,
          reorder_quantity: product.reorderQuantity,
          description: product.description,
        });
      } catch (e) {
        console.warn("Supabase product insert failed:", e);
      }
    }

    return product;
  };

  const updateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from("products")
          .update({
            name: updated.name,
            sku: updated.sku,
            category_id: updated.categoryId,
            uom: updated.uom,
            cost_price: updated.costPrice,
            selling_price: updated.sellingPrice,
            min_stock_alert: updated.minStockAlert,
            reorder_quantity: updated.reorderQuantity,
            description: updated.description,
          })
          .eq("id", updated.id);
      } catch (e) {
        console.warn("Supabase product update failed:", e);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setStockLevels((prev) => prev.filter((s) => s.productId !== id));
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (e) {
        console.warn("Supabase product delete failed:", e);
      }
    }
  };

  const addCategory = async (name: string, description?: string, color?: string) => {
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      color: color || "#3b82f6",
    };
    setCategories((prev) => [...prev, newCat]);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("categories").insert(newCat);
      } catch (e) {
        console.warn("Supabase category insert failed:", e);
      }
    }
  };

  const addWarehouse = async (name: string, code: string, address: string) => {
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      name,
      code,
      address,
    };
    setWarehouses((prev) => [...prev, newWh]);

    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      warehouseId: newWh.id,
      name: `${name} / Stock`,
      code: `${code}/STOCK`,
      type: "internal",
    };
    setLocations((prev) => [...prev, newLoc]);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("warehouses").insert({
          id: newWh.id,
          name: newWh.name,
          code: newWh.code,
          address: newWh.address,
        });
        await supabase.from("locations").insert({
          id: newLoc.id,
          warehouse_id: newWh.id,
          name: newLoc.name,
          code: newLoc.code,
          type: "internal",
        });
      } catch (e) {
        console.warn("Supabase warehouse insert failed:", e);
      }
    }
  };

  const addLocation = async (
    name: string,
    code: string,
    warehouseId: string,
    rack?: string
  ) => {
    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      warehouseId,
      name,
      code,
      type: "internal",
      rackNumber: rack,
    };
    setLocations((prev) => [...prev, newLoc]);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("locations").insert({
          id: newLoc.id,
          warehouse_id: warehouseId,
          name,
          code,
          type: "internal",
          rack_number: rack,
        });
      } catch (e) {
        console.warn("Supabase location insert failed:", e);
      }
    }
  };

  const generateReference = (type: OperationType): string => {
    const prefixMap: Record<OperationType, string> = {
      receipt: "WH/IN/",
      delivery: "WH/OUT/",
      internal: "WH/INT/",
      adjustment: "WH/ADJ/",
    };
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefixMap[type]}${randomDigits}`;
  };

  const createOperation = (
    opData: Omit<Operation, "id" | "reference" | "createdAt">
  ): Operation => {
    const id = `op-${Date.now()}`;
    const reference = generateReference(opData.type);
    const newOp: Operation = {
      ...opData,
      id,
      reference,
      createdAt: new Date().toISOString(),
    };
    setOperations((prev) => [newOp, ...prev]);

    if (isSupabaseConfigured()) {
      supabase
        .from("operations")
        .insert({
          id: newOp.id,
          reference: newOp.reference,
          type: newOp.type,
          status: newOp.status,
          partner_name: newOp.partnerName,
          source_location_id: newOp.sourceLocationId,
          dest_location_id: newOp.destLocationId,
          warehouse_id: newOp.warehouseId,
          scheduled_date: newOp.scheduledDate,
          notes: newOp.notes,
          items: newOp.items,
          created_by: newOp.createdBy,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase createOperation error:", error);
        });
    }

    return newOp;
  };

  const updateOperation = (updated: Operation) => {
    setOperations((prev) => prev.map((op) => (op.id === updated.id ? updated : op)));
  };

  const deleteOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  };

  const togglePickPack = (
    operationId: string,
    itemId: string,
    action: "pick" | "pack",
    value: boolean
  ) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id !== operationId) return op;
        return {
          ...op,
          items: op.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              [action === "pick" ? "isPicked" : "isPacked"]: value,
            };
          }),
        };
      })
    );
  };

  const validateOperation = (
    operationId: string,
    currentUser: string = "Inventory Manager"
  ): { success: boolean; message: string } => {
    const op = operations.find((o) => o.id === operationId);
    if (!op) return { success: false, message: "Operation not found." };
    if (op.status === "done") return { success: false, message: "Operation is already completed." };
    if (op.status === "canceled") return { success: false, message: "Canceled operations cannot be validated." };

    const srcLoc = locations.find((l) => l.id === op.sourceLocationId);
    const destLoc = locations.find((l) => l.id === op.destLocationId);

    if (op.type === "delivery") {
      for (const item of op.items) {
        const qtyToDeliver = item.doneQty > 0 ? item.doneQty : item.demandQty;
        const currentInSource = getProductStock(item.productId, op.sourceLocationId);
        if (currentInSource < qtyToDeliver) {
          return {
            success: false,
            message: `Insufficient stock for "${item.productName}" in ${srcLoc?.name || "source"}. Available: ${currentInSource}, Requested: ${qtyToDeliver}.`,
          };
        }
      }
    }

    const newLedgerEntries: StockLedgerItem[] = [];
    const updatedStockLevels = [...stockLevels];

    for (const item of op.items) {
      const qty = item.doneQty > 0 ? item.doneQty : item.demandQty;

      if (op.type === "receipt") {
        const destWh = destLoc?.warehouseId || op.warehouseId || warehouses[0]?.id;
        const targetIndex = updatedStockLevels.findIndex(
          (s) => s.productId === item.productId && s.locationId === op.destLocationId
        );
        if (targetIndex >= 0) {
          updatedStockLevels[targetIndex].quantity += qty;
        } else {
          updatedStockLevels.push({
            id: `sl-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            locationId: op.destLocationId,
            warehouseId: destWh,
            quantity: qty,
          });
        }

        newLedgerEntries.push({
          id: `led-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          reference: op.reference,
          operationType: "receipt",
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          fromLocationId: op.sourceLocationId,
          fromLocationName: srcLoc?.name || "Vendor",
          toLocationId: op.destLocationId,
          toLocationName: destLoc?.name || "Stock Location",
          quantity: qty,
          uom: item.uom,
          user: currentUser,
          reason: op.notes || `Incoming Vendor Receipt from ${op.partnerName || "Supplier"}`,
        });
      } else if (op.type === "delivery") {
        const srcIndex = updatedStockLevels.findIndex(
          (s) => s.productId === item.productId && s.locationId === op.sourceLocationId
        );
        if (srcIndex >= 0) {
          updatedStockLevels[srcIndex].quantity -= qty;
        }

        newLedgerEntries.push({
          id: `led-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          reference: op.reference,
          operationType: "delivery",
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          fromLocationId: op.sourceLocationId,
          fromLocationName: srcLoc?.name || "Stock Location",
          toLocationId: op.destLocationId,
          toLocationName: destLoc?.name || "Customer",
          quantity: -qty,
          uom: item.uom,
          user: currentUser,
          reason: op.notes || `Delivery Dispatch to ${op.partnerName || "Customer"}`,
        });
      } else if (op.type === "internal") {
        const srcIndex = updatedStockLevels.findIndex(
          (s) => s.productId === item.productId && s.locationId === op.sourceLocationId
        );
        if (srcIndex >= 0) {
          updatedStockLevels[srcIndex].quantity -= qty;
        }

        const destWh = destLoc?.warehouseId || op.warehouseId || warehouses[0]?.id;
        const destIndex = updatedStockLevels.findIndex(
          (s) => s.productId === item.productId && s.locationId === op.destLocationId
        );
        if (destIndex >= 0) {
          updatedStockLevels[destIndex].quantity += qty;
        } else {
          updatedStockLevels.push({
            id: `sl-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            locationId: op.destLocationId,
            warehouseId: destWh,
            quantity: qty,
          });
        }

        newLedgerEntries.push({
          id: `led-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          reference: op.reference,
          operationType: "internal",
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          fromLocationId: op.sourceLocationId,
          fromLocationName: srcLoc?.name || "Source Rack",
          toLocationId: op.destLocationId,
          toLocationName: destLoc?.name || "Destination Rack",
          quantity: qty,
          uom: item.uom,
          user: currentUser,
          reason: op.notes || `Internal Stock Relocation`,
        });
      }
    }

    setStockLevels(updatedStockLevels);
    setLedger((prev) => [...newLedgerEntries, ...prev]);

    setOperations((prev) =>
      prev.map((o) => {
        if (o.id !== operationId) return o;
        return {
          ...o,
          status: "done",
          completedDate: new Date().toISOString(),
          items: o.items.map((i) => ({
            ...i,
            doneQty: i.doneQty > 0 ? i.doneQty : i.demandQty,
            isPicked: true,
            isPacked: true,
          })),
        };
      })
    );

    // Sync to Supabase in background
    if (isSupabaseConfigured()) {
      supabase
        .from("operations")
        .update({
          status: "done",
          completed_date: new Date().toISOString(),
        })
        .eq("id", operationId)
        .then(() => {});

      newLedgerEntries.forEach((l) => {
        supabase
          .from("stock_ledger")
          .insert({
            id: l.id,
            timestamp: l.timestamp,
            reference: l.reference,
            operation_type: l.operationType,
            product_id: l.productId,
            product_name: l.productName,
            sku: l.sku,
            from_location_id: l.fromLocationId,
            from_location_name: l.fromLocationName,
            to_location_id: l.toLocationId,
            to_location_name: l.toLocationName,
            quantity: l.quantity,
            uom: l.uom,
            user: l.user,
            reason: l.reason,
          })
          .then(() => {});
      });
    }

    return { success: true, message: `Operation ${op.reference} successfully validated and inventory updated.` };
  };

  const executeStockAdjustment = (
    productId: string,
    locationId: string,
    countedQty: number,
    reason: "damaged" | "theft" | "count_correction" | "expired" | "other",
    notes: string,
    user: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const loc = locations.find((l) => l.id === locationId);
    const lossLoc = locations.find((l) => l.type === "inventory_loss") || {
      id: "loc-loss",
      name: "Virtual / Inventory Loss",
    };

    const currentQty = getProductStock(productId, locationId);
    const diff = countedQty - currentQty;

    if (diff === 0) return;

    const reference = generateReference("adjustment");

    setStockLevels((prev) => {
      const idx = prev.findIndex(
        (s) => s.productId === productId && s.locationId === locationId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity = countedQty;
        return copy;
      } else {
        return [
          ...prev,
          {
            id: `sl-${Date.now()}`,
            productId,
            locationId,
            warehouseId: loc?.warehouseId,
            quantity: countedQty,
          },
        ];
      }
    });

    const ledgerItem: StockLedgerItem = {
      id: `led-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reference,
      operationType: "adjustment",
      productId,
      productName: prod.name,
      sku: prod.sku,
      fromLocationId: diff < 0 ? locationId : lossLoc.id,
      fromLocationName: diff < 0 ? (loc?.name || "Stock Location") : lossLoc.name,
      toLocationId: diff < 0 ? lossLoc.id : locationId,
      toLocationName: diff < 0 ? lossLoc.name : (loc?.name || "Stock Location"),
      quantity: diff,
      uom: prod.uom,
      user,
      reason: notes || `Physical Count Adjustment (${reason})`,
    };
    setLedger((prev) => [ledgerItem, ...prev]);

    const opItem: OperationItem = {
      id: `item-${Date.now()}`,
      productId,
      productName: prod.name,
      sku: prod.sku,
      uom: prod.uom,
      demandQty: Math.abs(diff),
      doneQty: Math.abs(diff),
    };

    const newOp: Operation = {
      id: `op-${Date.now()}`,
      reference,
      type: "adjustment",
      status: "done",
      partnerName: "Inventory Audit",
      sourceLocationId: diff < 0 ? locationId : lossLoc.id,
      destLocationId: diff < 0 ? lossLoc.id : locationId,
      warehouseId: loc?.warehouseId,
      scheduledDate: new Date().toISOString(),
      completedDate: new Date().toISOString(),
      notes,
      adjustmentReason: reason,
      items: [opItem],
      createdBy: user,
      createdAt: new Date().toISOString(),
    };
    setOperations((prev) => [newOp, ...prev]);

    if (isSupabaseConfigured()) {
      supabase.from("stock_ledger").insert({
        id: ledgerItem.id,
        timestamp: ledgerItem.timestamp,
        reference: ledgerItem.reference,
        operation_type: "adjustment",
        product_id: productId,
        product_name: prod.name,
        sku: prod.sku,
        from_location_id: ledgerItem.fromLocationId,
        from_location_name: ledgerItem.fromLocationName,
        to_location_id: ledgerItem.toLocationId,
        to_location_name: ledgerItem.toLocationName,
        quantity: diff,
        uom: prod.uom,
        user,
        reason: ledgerItem.reason,
      }).then(() => {});
    }
  };

  const resetToDemo = () => {
    localStorage.clear();
    setProducts(initialProducts);
    setCategories(initialCategories);
    setWarehouses(initialWarehouses);
    setLocations(initialLocations);
    setStockLevels(initialStockLevels);
    setOperations(initialOperations);
    setLedger(initialLedger);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        warehouses,
        locations,
        stockLevels,
        operations,
        ledger,
        selectedWarehouseId,
        setSelectedWarehouseId,
        isCloudSynced,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductStock,
        getProductLocationsBreakdown,
        addCategory,
        addWarehouse,
        addLocation,
        createOperation,
        updateOperation,
        deleteOperation,
        validateOperation,
        togglePickPack,
        executeStockAdjustment,
        resetToDemo,
        syncFromSupabase,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
