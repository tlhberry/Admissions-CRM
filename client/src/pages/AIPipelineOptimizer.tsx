import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, GitBranch, Zap } from "lucide-react";

export default function AIPipelineOptimizer() {
  const [recommendations, setRecommendations] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const optimize = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/pipeline-optimize", { method: "POST" });
      const data = await response.json();
      setRecommendations(data.recommendations || "No recommendations generated.");
    } catch (error) {
      setRecommendations("Error generating recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6" />
        <h1 className="text-2xl font-bold">AI Pipeline Optimizer</h1>
        <Badge variant="secondary" className="text-xs">claude-sonnet-4-5</Badge>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Pipeline Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze your admissions pipeline and get AI-powered recommendations to improve conversion rates and reduce bottlenecks.
          </p>
          <Button onClick={optimize} disabled={isLoading} className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            {isLoading ? "Optimizing..." : "Optimize Pipeline"}
          </Button>
        </CardContent>
      </Card>
      {recommendations && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{recommendations}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
