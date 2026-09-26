import React from "react";
import {
  User,
  ShieldCheck,
  HardHat,
  LogOut,
  Mail,
  Building,
  Key,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const Profile: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          My Profile & Role Permissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal account details, active operational role, and system access.
        </p>
      </div>

      {/* User Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {user?.name || "Inventory User"}
                </h2>
                <Badge
                  variant={role === "manager" ? "default" : "warning"}
                  className="w-fit mx-auto sm:mx-0"
                >
                  {role === "manager" ? "Inventory Manager" : "Warehouse Staff"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection (Manager vs Staff) as required by PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Role & Responsibilities (StockSense Specification)
          </CardTitle>
          <p className="text-xs text-slate-500">
            Switch your profile between the two target personas defined in the problem statement.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manager Option */}
            <div
              onClick={() => {
                switchRole("manager");
                toast.success("Switched to Inventory Manager mode");
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                role === "manager"
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Inventory Manager
                  </span>
                </div>
                {role === "manager" && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Authorized to create products, set reorder thresholds, create warehouses, oversee receipts and deliveries, and supervise total inventory.
              </p>
            </div>

            {/* Warehouse Staff Option */}
            <div
              onClick={() => {
                switchRole("staff");
                toast.success("Switched to Warehouse Staff mode");
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                role === "staff"
                  ? "border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-amber-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Warehouse Staff
                  </span>
                </div>
                {role === "staff" && (
                  <CheckCircle className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Floor operator focused on order picking, package packing, bin-to-bin internal transfers, and physical inventory cycle counting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
