import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  MapPin,
  Edit2,
  Trash2,
  Boxes,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";
import { Product, UnitOfMeasure } from "../types/inventory";
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
import { SmartReorderModal } from "../components/inventory/SmartReorderModal";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";

const Products: React.FC = () => {
  const { role } = useAuth();
  const {
    products,
    categories,
    locations,
    warehouses,
    getProductStock,
    getProductLocationsBreakdown,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [breakdownProduct, setBreakdownProduct] = useState<Product | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);

  const lowStockCount = products.filter((p) => {
    const stock = getProductStock(p.id);
    return stock <= p.minStockAlert;
  }).length;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: categories[0]?.id || "",
    uom: "Units" as UnitOfMeasure,
    costPrice: 0,
    sellingPrice: 0,
    minStockAlert: 10,
    reorderQuantity: 50,
    description: "",
    initialStockLocationId: locations.find((l) => l.type === "internal")?.id || "",
    initialStockQuantity: 0,
  });

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    const stock = getProductStock(p.id);
    const matchesLowStock = !lowStockOnly || stock <= p.minStockAlert;

    return matchesSearch && matchesCat && matchesLowStock;
  });

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: categories[0]?.id || "",
      uom: "Units",
      costPrice: 10,
      sellingPrice: 20,
      minStockAlert: 10,
      reorderQuantity: 50,
      description: "",
      initialStockLocationId: locations.find((l) => l.type === "internal")?.id || "",
      initialStockQuantity: 20,
    });
    setIsCreateOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error("Product name and SKU are required.");
      return;
    }

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formData.name,
        sku: formData.sku,
        categoryId: formData.categoryId,
        uom: formData.uom,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        minStockAlert: Number(formData.minStockAlert),
        reorderQuantity: Number(formData.reorderQuantity),
        description: formData.description,
      });
      toast.success(`Updated product ${formData.name}`);
      setEditingProduct(null);
    } else {
      addProduct(
        {
          name: formData.name,
          sku: formData.sku,
          categoryId: formData.categoryId,
          uom: formData.uom,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          minStockAlert: Number(formData.minStockAlert),
          reorderQuantity: Number(formData.reorderQuantity),
          description: formData.description,
        },
        formData.initialStockQuantity > 0
          ? {
              locationId: formData.initialStockLocationId,
              quantity: Number(formData.initialStockQuantity),
            }
          : undefined
      );
      toast.success(`Product ${formData.name} created successfully!`);
      setIsCreateOpen(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteProduct(id);
      toast.info(`Deleted ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Products & Inventory Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage product SKU records, stock availability across warehouse racks, and reordering rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setReorderOpen(true)}
              className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1.5 shadow-sm font-semibold"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              Auto-Reorder ({lowStockCount})
            </Button>
          )}
          {role === "manager" && (
            <Button
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Product
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by product name, SKU or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Low stock toggle */}
            <Button
              variant={lowStockOnly ? "destructive" : "outline"}
              size="sm"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className="gap-1.5 text-xs whitespace-nowrap"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Low Stock Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU / Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Available Stock</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3">Reorder Threshold</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No products found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const category = categories.find((c) => c.id === p.categoryId);
                    const stock = getProductStock(p.id);
                    const isOutOfStock = stock === 0;
                    const isLowStock = stock <= p.minStockAlert;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {p.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                          {p.sku}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            style={{
                              borderColor: `${category?.color || "#94a3b8"}40`,
                              backgroundColor: `${category?.color || "#94a3b8"}15`,
                              color: category?.color || "#475569",
                            }}
                          >
                            {category?.name || "Uncategorized"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setBreakdownProduct(p)}
                            title="Click to view stock by warehouse & rack location"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition-colors font-bold text-sm"
                          >
                            <MapPin className="h-3.5 w-3.5 text-blue-500" />
                            <span>{stock}</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              (View Locations)
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                          {p.uom}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-600 dark:text-slate-400">
                            Min: <span className="font-bold">{p.minStockAlert}</span> | Target:{" "}
                            <span className="font-bold">{p.reorderQuantity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isOutOfStock ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingProduct(p);
                                setFormData({
                                  name: p.name,
                                  sku: p.sku,
                                  categoryId: p.categoryId,
                                  uom: p.uom,
                                  costPrice: p.costPrice,
                                  sellingPrice: p.sellingPrice,
                                  minStockAlert: p.minStockAlert,
                                  reorderQuantity: p.reorderQuantity,
                                  description: p.description || "",
                                  initialStockLocationId: "",
                                  initialStockQuantity: 0,
                                });
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            {role === "manager" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(p.id, p.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
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

      {/* Stock Availability Per Location Modal (Requested in PDF page 2) */}
      <Dialog
        open={!!breakdownProduct}
        onOpenChange={(open) => !open && setBreakdownProduct(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Stock Availability Per Location
            </DialogTitle>
            <DialogDescription>
              Real-time breakdown for{" "}
              <strong className="text-slate-800 dark:text-slate-100">
                {breakdownProduct?.name} ({breakdownProduct?.sku})
              </strong>
            </DialogDescription>
          </DialogHeader>

          {breakdownProduct && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total System Quantity
                </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {getProductStock(breakdownProduct.id)} {breakdownProduct.uom}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Warehouse Location Breakdown
                </p>
                {getProductLocationsBreakdown(breakdownProduct.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No physical inventory currently recorded in any location.
                  </p>
                ) : (
                  getProductLocationsBreakdown(breakdownProduct.id).map(
                    ({ location, quantity, warehouse }) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {location.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {warehouse?.name || "Central"} • Rack:{" "}
                            {location.rackNumber || "General"}
                          </p>
                        </div>
                        <Badge variant={quantity > 0 ? "default" : "secondary"}>
                          {quantity} {breakdownProduct.uom}
                        </Badge>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBreakdownProduct(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Product Modal */}
      <Dialog
        open={isCreateOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              Fill out the product information, UOM, and reordering rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Product Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Steel Rods (High Tensile)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  SKU / Code *
                </label>
                <Input
                  required
                  placeholder="e.g. STL-ROD-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Unit of Measure (UOM)
                </label>
                <select
                  value={formData.uom}
                  onChange={(e) =>
                    setFormData({ ...formData, uom: e.target.value as UnitOfMeasure })
                  }
                  className="w-full h-9 bg-transparent border border-input rounded-md px-3 text-sm"
                >
                  <option value="Units">Units</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="m">m (Meters)</option>
                  <option value="liters">liters (Liters)</option>
                  <option value="boxes">boxes (Boxes)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Min Stock Alert (Threshold)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStockAlert}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockAlert: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Reorder Target Qty
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reorderQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderQuantity: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Cost Price ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: Number(e.target.value) })
                  }
                />
              </div>

              {/* Initial Stock (Only for new product creation) */}
              {!editingProduct && (
                <div className="col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Stock Setup (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-0.5">
                        Location
                      </label>
                      <select
                        value={formData.initialStockLocationId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialStockLocationId: e.target.value,
                          })
                        }
                        className="w-full h-8 bg-transparent border border-input rounded px-2 text-xs"
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
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-0.5">
                        Starting Units
                      </label>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-xs"
                        value={formData.initialStockQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            initialStockQuantity: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Smart Reorder Engine Modal */}
      <SmartReorderModal open={reorderOpen} onOpenChange={setReorderOpen} />
    </div>
  );
};

export default Products;
