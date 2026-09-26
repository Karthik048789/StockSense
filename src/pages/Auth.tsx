import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  HardHat,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types/inventory";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup, requestOtp, verifyOtpAndResetPassword } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // Form states
  const [email, setEmail] = useState("manager@stocksense.io");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("manager");

  // OTP flow states
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    const success = await login(email, password);
    if (success) {
      toast.success("Welcome back to StockSense IMS!");
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const success = await signup(name, email, signupRole);
    if (success) {
      toast.success("Account created! Redirecting to Dashboard...");
      navigate("/");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }
    const res = await requestOtp(email);
    if (res.success) {
      setSimulatedOtpNotice(res.simulatedOtp);
      setOtpStep("verify");
      toast.success(`OTP generated and sent: ${res.simulatedOtp}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredOtp || !newPassword) {
      toast.error("Please enter the received OTP and your new password.");
      return;
    }
    const ok = await verifyOtpAndResetPassword(email, enteredOtp, newPassword);
    if (ok) {
      toast.success("Password reset successfully! Logging you in...");
      await login(email);
      navigate("/");
    } else {
      toast.error("Invalid OTP code. Try 123456 or the code shown above.");
    }
  };

  const handleQuickLoginAs = async (asRole: "manager" | "staff") => {
    const targetEmail =
      asRole === "manager" ? "manager@stocksense.io" : "staff@stocksense.io";
    setEmail(targetEmail);
    setPassword("password123");
    await login(targetEmail);
    toast.success(`Logged in as ${asRole === "manager" ? "Alex Vance (Manager)" : "Marcus Cole (Staff)"}`);
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Layers className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockSense IMS</h1>
          <p className="text-xs text-slate-400">
            Modular Real-Time Inventory Management System
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            {/* Mode Selector Tabs */}
            <div className="flex rounded-lg bg-slate-800/70 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === "login"
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === "signup"
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setOtpStep("request");
                  setSimulatedOtpNotice(null);
                }}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  mode === "forgot"
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                OTP Reset
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* 1. Login Mode */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="user@stocksense.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Forgot password (OTP)?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 font-semibold"
                >
                  Enter Inventory Dashboard
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>

                {/* 1-Click Demo Login Shortcuts */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    ⚡ Instant Demo Access (Pre-configured Roles):
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickLoginAs("manager")}
                      className="border-slate-700 text-xs hover:bg-slate-800 text-slate-200"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                      Login as Manager
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickLoginAs("staff")}
                      className="border-slate-700 text-xs hover:bg-slate-800 text-slate-200"
                    >
                      <HardHat className="h-3.5 w-3.5 mr-1 text-amber-400" />
                      Login as Staff
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* 2. Signup Mode */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Jordan Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      placeholder="jordan@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Assign Operational Role *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      onClick={() => setSignupRole("manager")}
                      className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                        signupRole === "manager"
                          ? "border-blue-500 bg-blue-500/20 text-white font-semibold"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-emerald-400" />
                      <span className="text-xs">Inventory Manager</span>
                    </div>

                    <div
                      onClick={() => setSignupRole("staff")}
                      className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                        signupRole === "staff"
                          ? "border-amber-500 bg-amber-500/20 text-white font-semibold"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <HardHat className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                      <span className="text-xs">Warehouse Staff</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 font-semibold"
                >
                  Create Account & Launch
                </Button>
              </form>
            )}

            {/* 3. OTP-based Password Reset (PDF Requirement) */}
            {mode === "forgot" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-xs text-blue-200">
                  <p className="font-semibold text-blue-300">
                    OTP-based Password Reset
                  </p>
                  <p className="mt-0.5 text-blue-300/80">
                    StockSense will verify your identity with a secure 6-digit one-time passcode.
                  </p>
                </div>

                {otpStep === "request" ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Registered Email
                      </label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-800/60 border-slate-700 text-white"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500">
                      Send 6-Digit Verification OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    {simulatedOtpNotice && (
                      <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center">
                        Simulated SMS/Email OTP:{" "}
                        <strong className="font-mono text-sm tracking-widest text-emerald-200">
                          {simulatedOtpNotice}
                        </strong>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Enter 6-Digit OTP Code
                      </label>
                      <Input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="e.g. 123456"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="font-mono tracking-widest text-center text-lg bg-slate-800/60 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">
                        New Password
                      </label>
                      <Input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-slate-800/60 border-slate-700 text-white"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500">
                      Verify & Reset Password
                    </Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
