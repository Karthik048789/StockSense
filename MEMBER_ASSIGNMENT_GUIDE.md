# 📦 StockSense IMS – Member 2 – Outbound Fulfillment & Floor Operations

**Assigned Role**: Outbound Logistics & Warehouse Floor Operator Engineer  
**Distribution Package**: `Member_2_Outbound_and_Floor_Operations.zip`  
**Base Repository**: [StockSense](https://github.com/Karthik048789/dummy_stocksense)  

---

## 🎯 Your Assigned Responsibilities
As **Member 2**, you own this specific domain of the StockSense system. You have a full, working copy of the application so you can run, develop, and test your features independently.

### 📂 Your Core Files & Components
- `src/pages/Deliveries.tsx (Outbound Customer Delivery Orders: WH/OUT/...)`
- `src/pages/Transfers.tsx (Internal relocations: WH/INT/...)`
- `src/types/inventory.ts (Delivery & Transfer schemas)`

---

## 📋 Your Detailed Task Checklist
- [ ] Customer Delivery Orders (WH/OUT/...): Customer name, delivery address, scheduled date.
- [ ] Real-time stock availability verification (preventing over-dispatching past available stock).
- [ ] 2-Step Warehouse Floor Fulfillment: Step 1 Pick Items from racks -> Step 2 Pack Items into shipping boxes.
- [ ] Automatic stock decrement (-Stock) upon final delivery validation.
- [ ] Internal Stock Transfers (WH/INT/...): Relocating goods between racks (A to B) and warehouses (Main to Production).
- [ ] Ensuring overall company total stock remains conserved while specific location balances rebalance.

---

## ⚡ Quick Start & Development
Each team member can run the project independently:

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🤝 Team Coordination & Shared Core
All 4 modules connect through the shared context:
- `src/contexts/InventoryContext.tsx`: The central reactive state that coordinates products, operations, and the ledger.
- `src/types/inventory.ts`: Core data structures shared across all modules.
- `supabase/schema.sql`: PostgreSQL database schema for tables and seed data.

> **Tip**: If you need to add or modify a shared state function or data type, inform your team members so everyone stays aligned.

---

## 🎤 Viva / Project Presentation Speaking Script
When demonstrating the project to an evaluator or interviewer, use this speaking point for your part:

> *"Hello! I handled Member 2's domain: Outbound Fulfillment and Internal Transfers. I designed the system around the floor operator persona, Marcus Cole. When customer orders arrive, my delivery module guides warehouse staff through a two-step Pick & Pack process to eliminate dispatch errors. Once packed and validated, the system automatically decrements physical stock from the designated racks. Additionally, I built the Internal Transfers module, allowing seamless bin-to-bin and warehouse-to-warehouse stock relocations without affecting overall corporate asset balance."*
