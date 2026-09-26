# 📦 StockSense – Modular Inventory Management System (IMS)

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**StockSense** is an enterprise-grade, modular **Inventory Management System (IMS)** designed to replace manual registers, spreadsheets, and scattered stock tracking processes with a centralized digital platform.

Inspired by the **Odoo Problem Statement**, it provides complete operational visibility and control over **products, warehouses, stock movements, receipts, deliveries, internal transfers, and physical adjustments** through a real-time, audit-compliant **Stock Ledger**.

---

## 🚀 Key Highlights & Enhancements

* **🗺️ 2D Interactive Warehouse Digital Twin (`/map`)**: Real-time spatial layout mapping **Inbound Receiving Docks**, **Inspection Bays**, **Storage Aisles (Racks A-01 to A-12, B-04)**, and **Production Assembly Lines** with live occupancy heatmaps and a live rack inspector.
* **⚡ 1-Click Smart Reorder Engine**: Automated replenishment bot that scans stock levels against safety minimums, computes needed restock quantities and estimated purchase costs, and batches draft vendor receipts with one click.
* **📊 5-KPI Real-Time Dashboard**: Instant operational snapshots with multi-dimensional dynamic filters by Document Type, Status, Warehouse/Location, and Product Category.
* **📦 Complete Odoo Operations Suite**: End-to-end workflows for **Vendor Receipts**, **Deliveries with Pick & Pack**, **Internal Transfers**, and **Physical Count Stock Adjustments**.
* **📜 Immutable Double-Entry Stock Ledger**: Audit-compliant movement history tracking every transaction with 1-click CSV export.
* **☁️ Dual-Mode Storage Architecture**: Integrated directly with **Supabase (PostgreSQL)** in the cloud, with local fallback for offline resilience.

---

## 👥 Target Users & Role-Based Access Control

StockSense supports the two primary operational personas defined in the problem specification:

| Role | Persona | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Inventory Manager** | Alex Vance | Full catalog control, warehouse & rack configuration, setting safety thresholds (`minStockAlert`), running reorder engines, and financial oversight. |
| **Warehouse Staff** | Marcus Cole | Floor operator view focused on order picking, package packing, bin-to-bin internal transfers, and physical cycle count audits. |

> 💡 **Quick Switcher**: Toggle between **Manager** and **Staff** modes in 1 click via the left sidebar or the user profile menu.

---

## 🏗️ Core Modules & Workflows

### 1. 📊 Executive Dashboard
* **Real-Time KPI Cards**:
  1. 📦 *Total Products in Stock* (Total SKUs + aggregate physical units).
  2. ⚠️ *Low Stock / Out of Stock Items* (Critical alerts with 1-click reorder triggers).
  3. 📥 *Pending Receipts* (Incoming vendor shipments).
  4. 📤 *Pending Deliveries* (Customer dispatches awaiting pick/pack/validation).
  5. 🔄 *Internal Transfers Scheduled* (Movements in transit).
* **Dynamic Multi-Filters**: Filter operations simultaneously by Document Type, Status, Warehouse, and Category.
* **Visual Analytics**: Interactive Recharts graphs showing operational workload and inventory category volume distribution.

### 2. 🗺️ 2D Warehouse Floor Digital Twin (`/map`)
* Spatial layout mapping **Inbound Dock Bay 01**, **Inspection & Staging**, **Storage Aisles (Racks A-01 to A-12, B-04)**, **Production Line (PROD-01)**, and **Outbound Dispatch**.
* **Dynamic Heatmap**:
  * 🟢 **Green**: Healthy capacity (> 50 units).
  * 🟡 **Amber**: Stock at or below safety reorder threshold.
  * 🔴 **Red**: Depleted / 0 units.
* **Live Rack Inspector**: Click any shelving rack to view physical SKUs stored, check occupancy metrics, or trigger quick transfers and audits.

### 3. 📦 Products & Catalog Management (`/products`)
* Full CRUD for products with **Name**, **SKU / Code**, **Category**, **Unit of Measure (kg, units, meters, etc.)**, and **Initial Stock**.
* **Stock Availability Per Location**: Clicking on any product's stock count opens a detailed modal showing exact quantities broken down by warehouse and rack bin.
* **Automated Reordering Rules**: Define `minStockAlert` safety thresholds and target `reorderQuantity`.

### 4. 📥 Receipts — Incoming Stock (`/receipts`)
* Record consignments arriving from suppliers and vendors.
* **Process**: Create Receipt $\rightarrow$ Add Supplier & Products $\rightarrow$ Input Received Qty $\rightarrow$ **Validate**.
* **Validation**: Automatically increments stock in the target location and writes an entry to the Stock Ledger.

```text
Create Receipt → Select Supplier → Add Products → Input Qty → Validate → Stock Automatically Increases (+Stock)
```

### 5. 📤 Delivery Orders — Outgoing Stock (`/deliveries`)
* Process customer shipments with built-in stock availability validation.
* **Warehouse Floor Workflow**:
  1. **Pick Items**: Floor workers verify physical shelf picking.
  2. **Pack Items**: Items are packaged into shipment containers.
  3. **Validate**: Decrements physical inventory (-Stock) and logs outbound dispatch to the ledger.

```text
Create Delivery → Pick Items → Pack Items → Validate → Stock Automatically Decreases (-Stock)
```

### 6. 🔄 Internal Transfers (`/transfers`)
* Relocate goods internally: *Main Store $\rightarrow$ Production Floor*, *Rack A $\rightarrow$ Rack B*, or *Warehouse 1 $\rightarrow$ Warehouse 2*.
* Overall company stock remains unchanged while location balances update in real-time.

### 7. ⚖️ Stock Adjustments (`/adjustments`)
* Physical inventory count reconciliation.
* Real-time variance calculation: $\Delta = \text{Counted} - \text{System Recorded Stock}$.
* Tag variances with reason codes (*Damaged in Handling*, *Shrinkage / Missing*, *Annual Cycle Count*, *Expired*).
* Automatically recalibrates stock and routes scrap loss to the *Virtual / Inventory Loss* location.

### 8. 📜 Move History & Stock Ledger (`/move-history`)
* Complete double-entry audit trail tracking:
  * Timestamp, Reference Document (`WH/IN/...`, `WH/OUT/...`, `WH/INT/...`, `WH/ADJ/...`).
  * Product Name, SKU, From Location $\rightarrow$ To Location, Quantity Delta (+/-), Responsible User, and Audit Notes.
* Instant search and **1-click CSV Export**.

| Operation | Stock Effect |
| :--- | :---: |
| **Receipt** | ➕ Increase (+Stock) |
| **Delivery** | ➖ Decrease (-Stock) |
| **Internal Transfer** | 🔄 Location Rebalance |
| **Stock Adjustment** | ➕ / ➖ Delta Recalibration |

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool & Bundler** | Vite 5 |
| **Styling & Design System** | Tailwind CSS + Radix UI Primitives |
| **Icons & Visuals** | Lucide React |
| **Data Visualization** | Recharts |
| **Cloud Database** | Supabase (PostgreSQL) |
| **State & Local Engine** | Dual-Mode Reactive Store + LocalStorage Fallback |
| **Routing** | React Router DOM v6 |

---

## ⚡ Quick Start Guide

### Prerequisites
* Node.js 18+ (tested on Node v20 / v24)
* npm or bun

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Karthik048789/dummy_stocksense.git
cd dummy_stocksense
npm install
```

### 2. Configure Environment (`.env`)
Create or edit `.env` in the project root:

```env
VITE_SUPABASE_PROJECT_ID="tmzezduuzookymkusxvd"
VITE_SUPABASE_URL="https://tmzezduuzookymkusxvd.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

> 💡 **Demo Ready**: The application includes fallback demo data, allowing you to run and test all features immediately even without remote credentials.

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

A complete, self-contained SQL script is provided in [`supabase/schema.sql`](supabase/schema.sql).

1. Log in to [Supabase](https://supabase.com/dashboard) and navigate to your project's **SQL Editor** (`>_`).
2. Copy and paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**.

This script automatically creates all relational tables (`products`, `warehouses`, `locations`, `stock_levels`, `operations`, `stock_ledger`), configures Row Level Security (RLS) public policies, and seeds the sample demo scenario from `StockSense.pdf`.

---

## 📘 Demonstration Flow (Matching Problem Statement)

```text
Step 1: Receive Goods from Vendor
        Receive 100 kg Steel Rods → Stock: +100 kg (Receipt WH/IN/0001)

Step 2: Move to Production Rack
        Internal Transfer: Main Store → Production Floor (Transfer WH/INT/0001)
        Total stock unchanged (100 kg), location balances updated

Step 3: Deliver Finished Goods
        Delivery Order to Customer → Stock: -10 units (Delivery WH/OUT/0001)

Step 4: Adjust Damaged Items
        3 kg damaged steel written off → Stock: -3 kg (Adjustment WH/ADJ/0001)

Result: Everything is logged in the Stock Ledger!
```

---

## 📂 Project Directory Structure

```text
StockSense/
├── public/                 # Static assets & icons
├── src/
│   ├── components/
│   │   ├── inventory/      # SmartReorderModal & replenishment engine
│   │   ├── layout/         # AppLayout, Sidebar, Role Switcher, Search
│   │   ├── ui/             # Radix & Tailwind UI primitives (Button, Card, Dialog...)
│   │   ├── warehouse/      # WarehouseDigitalTwin 2D interactive floor map
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Authentication & Manager/Staff switching
│   │   └── InventoryContext.tsx  # Double-entry ledger state machine & Supabase sync
│   ├── data/
│   │   └── initialData.ts        # Seed data matching PDF specifications
│   ├── lib/
│   │   ├── supabase.ts     # Supabase PostgreSQL client configuration
│   │   └── utils.ts        # Styling & formatting utilities
│   ├── pages/
│   │   ├── Adjustments.tsx # Physical cycle counts & variance resolution
│   │   ├── Auth.tsx        # Sign in, Sign up, and OTP password reset
│   │   ├── Dashboard.tsx   # 5-KPI executive overview & dynamic cross-filters
│   │   ├── Deliveries.tsx  # Outbound customer dispatch with Pick & Pack
│   │   ├── MoveHistory.tsx # Stock Ledger audit log with CSV export
│   │   ├── Products.tsx    # Catalog, location breakdown modal, reordering rules
│   │   ├── Profile.tsx     # User profile & role selector
│   │   ├── Receipts.tsx    # Inbound vendor shipments & automatic stock increases
│   │   ├── Settings.tsx    # Multi-warehouse topology & rack management
│   │   ├── Transfers.tsx   # Internal warehouse & rack relocations
│   │   └── WarehouseMap.tsx# 2D Digital Twin page
│   ├── types/
│   │   └── inventory.ts    # TypeScript domain models
│   ├── App.tsx             # Route definitions & providers
│   ├── index.css           # Design tokens, fonts, & custom scrollbars
│   └── main.tsx            # Application entry point
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema, RLS, and seed records
├── .env                    # Supabase environment configuration
├── package.json            # Project dependencies & scripts
├── tailwind.config.ts      # Tailwind CSS design system configuration
└── vite.config.ts          # Vite bundler configuration
```

---

## 📜 License

Developed for the **StockSense / Odoo Problem Statement**. MIT License.
