import { useGetAdvisory } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, Badge } from "@/components/ui-elements";
import { ShieldAlert, TrendingUp, PiggyBank, Target, Lightbulb } from "lucide-react";

export default function Advisory() {
  const { data, isLoading } = useGetAdvisory();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const getIcon = (category: string) => {
    switch(category) {
      case 'savings': return <PiggyBank className="w-6 h-6" />;
      case 'debt': return <TrendingUp className="w-6 h-6" />;
      case 'emergency_fund': return <ShieldAlert className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Financial Advisory</h1>
        <p className="text-muted-foreground mt-1">Actionable insights based on your financial data.</p>
      </div>

      <div className="flex flex-col gap-6">
        {data?.topRecommendation && (
          <Card className="p-8 bg-gradient-to-r from-primary to-[#2e7a56] text-white border-none shadow-xl shadow-primary/20">
            <div className="flex items-center gap-2 mb-4 text-white/80 text-sm font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" /> Top Priority Action
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">{data.topRecommendation.title}</h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-4xl mb-6">
              {data.topRecommendation.description}
            </p>
            {(data.topRecommendation.currentValue !== undefined && data.topRecommendation.targetValue !== undefined) && (
              <div className="flex items-center gap-4 bg-black/20 w-fit px-4 py-3 rounded-xl backdrop-blur-sm">
                <div>
                  <div className="text-xs text-white/70">Current</div>
                  <div className="font-bold">Nu. {data.topRecommendation.currentValue?.toLocaleString()}</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div>
                  <div className="text-xs text-white/70">Target</div>
                  <div className="font-bold">Nu. {data.topRecommendation.targetValue?.toLocaleString()}</div>
                </div>
              </div>
            )}
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {data?.recommendations.map((rec, idx) => (
            <Card key={idx} className="p-6 flex flex-col hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-accent/50 text-primary rounded-xl">
                  {getIcon(rec.category)}
                </div>
                <Badge variant={getPriorityColor(rec.priority) as any} className="uppercase text-[10px]">
                  {rec.priority} Priority
                </Badge>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{rec.title}</h3>
              <p className="text-muted-foreground flex-1 mb-6 leading-relaxed">
                {rec.description}
              </p>
              
              {(rec.currentValue !== undefined && rec.targetValue !== undefined) && (
                <div className="mt-auto pt-4 border-t border-border/50">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{Math.round((rec.currentValue! / rec.targetValue!) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${Math.min((rec.currentValue! / rec.targetValue!) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
