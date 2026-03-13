import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, Briefcase } from "lucide-react";
import { useFinanceMutations } from "@/hooks/use-finance";
import { useAuth } from "@/hooks/use-auth";
import { Card, Button, cn } from "@/components/ui-elements";

export default function Onboarding() {
  const [_, setLocation] = useLocation();
  const { createProfile } = useFinanceMutations();
  const { refreshUser } = useAuth();
  const [selectedType, setSelectedType] = useState<"individual" | "small_business" | null>(null);

  const handleComplete = async () => {
    if (!selectedType) return;
    try {
      await createProfile.mutateAsync({
        data: { profileType: selectedType, currency: "BTN" }
      } as any);
      await refreshUser();
      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 z-0 bg-repeat"
        style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/bhutan-pattern.png')`, backgroundSize: '300px' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full z-10"
      >
        <div className="text-center mb-10">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">How will you use Money Saathi?</h1>
          <p className="text-lg text-muted-foreground">Select a profile type to customize your experience and advice.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          <Card 
            className={cn(
              "cursor-pointer border-2 transition-all duration-200 hover:-translate-y-1",
              selectedType === "individual" ? "border-primary bg-primary/5 shadow-primary/20" : "border-border hover:border-primary/50"
            )}
            onClick={() => setSelectedType("individual")}
          >
            <div className="p-6 text-center">
              <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6", selectedType === "individual" ? "bg-primary text-white" : "bg-accent text-accent-foreground")}>
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personal</h3>
              <p className="text-muted-foreground text-sm">For individuals and families looking to track savings, expenses, and plan for the future.</p>
            </div>
          </Card>

          <Card 
            className={cn(
              "cursor-pointer border-2 transition-all duration-200 hover:-translate-y-1",
              selectedType === "small_business" ? "border-primary bg-primary/5 shadow-primary/20" : "border-border hover:border-primary/50"
            )}
            onClick={() => setSelectedType("small_business")}
          >
            <div className="p-6 text-center">
              <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6", selectedType === "small_business" ? "bg-primary text-white" : "bg-accent text-accent-foreground")}>
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Small Business</h3>
              <p className="text-muted-foreground text-sm">For entrepreneurs and small shops to track cash flow, business loans, and operations.</p>
            </div>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-12"
            disabled={!selectedType || createProfile.isPending}
            onClick={handleComplete}
          >
            {createProfile.isPending ? "Setting up..." : "Continue to Dashboard"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
