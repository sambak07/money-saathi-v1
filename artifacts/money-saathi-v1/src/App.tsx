import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useRef } from "react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import DataEntry from "@/pages/data-entry";
import Score from "@/pages/score";
import Loans from "@/pages/loans";
import Advisory from "@/pages/advisory";
import Reports from "@/pages/reports";
import BankComparison from "@/pages/bhutan-intelligence/bank-comparison";
import FinancialLiteracy from "@/pages/bhutan-intelligence/financial-literacy";
import InvestmentGuide from "@/pages/bhutan-intelligence/investment-guide";
import AskAI from "@/pages/bhutan-intelligence/ask-ai";
import AdminFinancialProducts from "@/pages/admin/financial-products";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;
  if (!user.hasProfile && window.location.pathname !== import.meta.env.BASE_URL + "onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      <Route path="/onboarding">
        {!user ? <Redirect to="/login" /> : user.hasProfile ? <Redirect to="/dashboard" /> : <Onboarding />}
      </Route>

      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/data-entry">
        <ProtectedRoute component={DataEntry} />
      </Route>
      <Route path="/score">
        <ProtectedRoute component={Score} />
      </Route>
      <Route path="/loans">
        <ProtectedRoute component={Loans} />
      </Route>
      <Route path="/advisory">
        <ProtectedRoute component={Advisory} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/intelligence/banks">
        <ProtectedRoute component={BankComparison} />
      </Route>
      <Route path="/intelligence/literacy">
        <ProtectedRoute component={FinancialLiteracy} />
      </Route>
      <Route path="/intelligence/invest">
        <ProtectedRoute component={InvestmentGuide} />
      </Route>
      <Route path="/intelligence/ask-ai">
        <ProtectedRoute component={AskAI} />
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute component={AdminFinancialProducts} />
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const qcRef = useRef(new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={qcRef.current}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
