import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, BarChart2 } from "lucide-react";

export default function AIInsights() {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/insights", { method: "POST" });
      const data = await response.json();
      setInsights(data.insights || "No insights generated.");
    } catch (error) {
      setInsights("Error generating insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6" />
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <Badge variant="secondary" className="text-xs">claude-sonnet-4-5</Badge>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Admissions Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate AI-powered insights from your admissions data to identify trends and opportunities.
          </p>
          <Button onClick={generateInsights} disabled={isLoading} className="w-full">
            <BarChart2 className="w-4 h-4 mr-2" />
            {isLoading ? "Analyzing..." : "Generate Insights"}
          </Button>
        </CardContent>
      </Card>
      {insights && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{insights}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
