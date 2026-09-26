export type UserRole = "manager" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  warehouseAccess?: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  isDefault?: boolean;
}

export type LocationType = "internal" | "vendor" | "customer" | "inventory_loss" | "production";

export interface Location {
  id: string;
  warehouseId?: string;
  name: string;
  code: string;
  type: LocationType;
  rackNumber?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export type UnitOfMeasure = "Units" | "kg" | "m" | "liters" | "boxes" | "pairs";

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  uom: UnitOfMeasure;
  costPrice: number;
  sellingPrice: number;
  minStockAlert: number;
  reorderQuantity: number;
  description?: string;
  createdAt: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  warehouseId?: string;
  quantity: number;
}

export type OperationType = "receipt" | "delivery" | "internal" | "adjustment";
export type OperationStatus = "draft" | "waiting" | "ready" | "done" | "canceled";

export interface OperationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  uom: UnitOfMeasure;
  demandQty: number;
  doneQty: number;
  isPicked?: boolean;
  isPacked?: boolean;
}

export interface Operation {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  partnerName?: string; // Vendor or Customer
  sourceLocationId: string;
  destLocationId: string;
  warehouseId?: string;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  items: OperationItem[];
  createdBy: string;
  createdAt: string;
  adjustmentReason?: "damaged" | "theft" | "count_correction" | "expired" | "other";
}

export interface StockLedgerItem {
  id: string;
  timestamp: string;
  reference: string;
  operationType: OperationType;
  productId: string;
  productName: string;
  sku: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  quantity: number;
  uom: UnitOfMeasure;
  user: string;
  reason?: string;
}
