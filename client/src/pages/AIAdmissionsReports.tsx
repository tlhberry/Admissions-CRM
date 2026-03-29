import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, FileText, TrendingUp } from "lucide-react";

interface Inquiry {
  id: number;
  clientName?: string;
  callerName?: string;
  stage?: string;
}

export default function AIAdmissionsReports() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [report, setReport] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: admitted = [] } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
    select: (data) => data.filter((i) => i.stage === "admitted"),
  });

  const generateReport = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/admissions-report/${selectedId}`, {
        method: "POST",
      });
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
        <h1 className="text-2xl font-bold">AI Admissions Reports</h1>
        <Badge variant="secondary" className="text-xs">claude-sonnet-4-5</Badge>
      </div>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an admitted patient..." />
            </SelectTrigger>
            <SelectContent>
              {admitted.map((inquiry) => (
                <SelectItem key={inquiry.id} value={String(inquiry.id)}>
                  {inquiry.clientName || inquiry.callerName || `Inquiry #${inquiry.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={generateReport}
            disabled={!selectedId || isLoading}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isLoading ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>
      {report && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Generated Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{report}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
