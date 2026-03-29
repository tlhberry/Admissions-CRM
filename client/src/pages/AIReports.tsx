import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, FileBarChart, Download } from "lucide-react";

export default function AIReports() {
  const [report, setReport] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/reports", { method: "POST" });
      const data = await response.json();
      setReport(data.report || "No report generated.");
    } catch (error) {
      setReport("Error generating report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6" />
        <h1 className="text-2xl font-bold">AI Reports</h1>
        <Badge variant="secondary" className="text-xs">claude-sonnet-4-5</Badge>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="w-4 h-4" />
            Automated Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate comprehensive AI-powered reports from your admissions data. Claude AI generates and runs analysis safely and accurately.
          </p>
          <Button onClick={generateReport} disabled={isLoading} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
      {report && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Generated Report</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{report}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
