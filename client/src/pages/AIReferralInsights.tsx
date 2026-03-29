import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Users, TrendingUp } from "lucide-react";

export default function AIReferralInsights() {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const analyzeReferrals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/referral-insights", { method: "POST" });
      const data = await response.json();
      setInsights(data.insights || "No insights generated.");
    } catch (error) {
      setInsights("Error generating referral insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6" />
        <h1 className="text-2xl font-bold">AI Referral Insights</h1>
        <Badge variant="secondary" className="text-xs">claude-sonnet-4-5</Badge>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Referral Source Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Get AI-powered analysis of your referral sources to identify top performers and growth opportunities.
          </p>
          <Button onClick={analyzeReferrals} disabled={isLoading} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            {isLoading ? "Analyzing..." : "Analyze Referrals"}
          </Button>
        </CardContent>
      </Card>
      {insights && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Referral Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{insights}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
