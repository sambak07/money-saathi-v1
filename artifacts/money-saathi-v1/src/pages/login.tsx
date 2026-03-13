import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Card, Button, Input, Label } from "@/components/ui-elements";

export default function Login() {
  const [_, setLocation] = useLocation();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        setLocation("/dashboard");
      } else {
        await register(formData);
        setLocation("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary items-center justify-center">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Abstract Background" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className="relative z-10 p-12 max-w-lg text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-16 h-16 mb-8 brightness-0 invert" />
            <h1 className="text-5xl font-display font-bold leading-tight mb-6">
              Your trusted partner in financial health.
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Money Saathi provides tailored insights, tracking, and advice to help you build a secure future in Bhutan.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-display font-bold text-2xl text-primary">Money Saathi</span>
          </div>

          <Card className="p-8 sm:p-10 border-none shadow-2xl shadow-primary/10">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isLogin ? "Enter your credentials to access your dashboard." : "Start your journey to better financial health."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Sonam Dorji" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="sonam@example.bt" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn || isRegistering}>
                {isLogin 
                  ? (isLoggingIn ? "Signing in..." : "Sign In") 
                  : (isRegistering ? "Creating account..." : "Create Account")}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-primary font-medium hover:underline text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
