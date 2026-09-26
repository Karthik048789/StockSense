import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { InventoryProvider } from "./contexts/InventoryContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Receipts from "./pages/Receipts";
import Deliveries from "./pages/Deliveries";
import Transfers from "./pages/Transfers";
import Adjustments from "./pages/Adjustments";
import MoveHistory from "./pages/MoveHistory";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import WarehouseMap from "./pages/WarehouseMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <AuthProvider>
          <InventoryProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <WarehouseMap />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/products"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Products />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/receipts"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Receipts />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/deliveries"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Deliveries />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transfers"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Transfers />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/adjustments"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Adjustments />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/move-history"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MoveHistory />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </InventoryProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
