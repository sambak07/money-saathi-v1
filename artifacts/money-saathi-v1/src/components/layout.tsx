import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wallet, 
  Activity, 
  Calculator, 
  Lightbulb, 
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
  BookOpen,
  TrendingUp,
  Bot,
  Globe,
  Database,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "./ui-elements";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data-entry", label: "Financial Data", icon: Wallet },
  { href: "/score", label: "Health Score", icon: Activity },
  { href: "/loans", label: "Loan Calculator", icon: Calculator },
  { href: "/advisory", label: "Advisory", icon: Lightbulb },
  { href: "/reports", label: "Reports", icon: FileText },
];

const INTELLIGENCE_ITEMS = [
  { href: "/intelligence/banks", label: "Bank Comparison", icon: Building2 },
  { href: "/intelligence/literacy", label: "Financial Literacy", icon: BookOpen },
  { href: "/intelligence/invest", label: "Investment Guide", icon: TrendingUp },
  { href: "/intelligence/ask-ai", label: "Ask Money Saathi AI", icon: Bot },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} className="w-full">
            <div
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        );
      })}

      <div className="mt-5 mb-2">
        <div className="flex items-center gap-2 px-4 mb-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Bhutan Financial Intelligence</span>
        </div>
        {INTELLIGENCE_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="w-full">
              <div
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {user?.isAdmin && (
        <div className="mt-5 mb-2">
          <div className="flex items-center gap-2 px-4 mb-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Admin</span>
          </div>
          <Link href="/admin/products" className="w-full">
            <div
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 transition-all duration-200 cursor-pointer",
                location === "/admin/products"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Database className="h-4 w-4" />
              <span className="font-medium text-sm">Financial Products</span>
            </div>
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border/50 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-lg text-primary">Money Saathi</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-card border-r border-border/50 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 object-contain" />
          <span className="font-display font-bold text-2xl text-primary">Money Saathi</span>
        </div>
        
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-4 px-4">Menu</div>
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="bg-background rounded-2xl p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-2 font-display font-bold">
              {user?.name.charAt(0)}
            </div>
            <p className="font-semibold text-sm truncate w-full">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate w-full mb-4">{user?.email}</p>
            <button 
              onClick={() => logout()}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 bg-repeat"
          style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/bhutan-pattern.png')`, backgroundSize: '400px' }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
