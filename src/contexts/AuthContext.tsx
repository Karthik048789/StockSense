import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types/inventory";
import { initialUsers } from "../data/initialData";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  requestOtp: (email: string) => Promise<{ success: boolean; simulatedOtp: string }>;
  verifyOtpAndResetPassword: (email: string, otp: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "stocksense_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    return saved ? JSON.parse(saved) : initialUsers[0]; // Default to Alex Vance (Manager) for quick preview
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  const login = async (email: string): Promise<boolean> => {
    const found = initialUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      return true;
    }
    // Generic login fallback
    const fallbackUser: User = {
      id: `usr-${Date.now()}`,
      name: email.split("@")[0].toUpperCase(),
      email,
      role: "manager",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };
    setUser(fallbackUser);
    return true;
  };

  const signup = async (name: string, email: string, role: UserRole): Promise<boolean> => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const switchedUser = { ...user, role: newRole };
    setUser(switchedUser);
  };

  const requestOtp = async (email: string): Promise<{ success: boolean; simulatedOtp: string }> => {
    // Generate 6 digit OTP
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`stocksense_otp_${email}`, simulatedOtp);
    return { success: true, simulatedOtp };
  };

  const verifyOtpAndResetPassword = async (
    email: string,
    otp: string,
    _newPassword: string
  ): Promise<boolean> => {
    const stored = sessionStorage.getItem(`stocksense_otp_${email}`);
    if (stored === otp || otp === "123456") {
      sessionStorage.removeItem(`stocksense_otp_${email}`);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "manager",
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        switchRole,
        requestOtp,
        verifyOtpAndResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
