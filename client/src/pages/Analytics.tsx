import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Inquiry, PipelineStage, ReferralSource, NonViableReason } from "@shared/schema";
import {
  stageDisplayNames,
  referralSourceDisplayNames,
  nonViableReasonDisplayNames,
  pipelineStages,
  referralSources,
  nonViableReasons,
} from "@shared/schema";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c43",
];

export default function Analytics() {
  const [, navigate] = useLocation();

  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const totalInquiries = inquiries?.length || 0;
  const admittedCount = inquiries?.filter((i) => i.stage === "admitted").length || 0;
  const nonViableCount = inquiries?.filter((i) => i.stage === "non_viable").length || 0;
  const activeCount = totalInquiries - admittedCount - nonViableCount;
  const conversionRate = totalInquiries > 0 ? ((admittedCount / totalInquiries) * 100).toFixed(1) : "0";

  const getReferralSourceData = () => {
    if (!inquiries) return [];
    const sourceCounts: Record<string, { total: number; admitted: number }> = {};
    
    inquiries.forEach((inquiry) => {
      const source = inquiry.referralSource || "unknown";
      if (!sourceCounts[source]) {
        sourceCounts[source] = { total: 0, admitted: 0 };
      }
      sourceCounts[source].total++;
      if (inquiry.stage === "admitted") {
        sourceCounts[source].admitted++;
      }
    });

    return Object.entries(sourceCounts)
      .map(([source, counts]) => ({
        name: referralSourceDisplayNames[source as ReferralSource] || source,
        total: counts.total,
        admitted: counts.admitted,
        conversionRate: counts.total > 0 ? ((counts.admitted / counts.total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.total - a.total);
  };

  const getNonViableReasonsData = () => {
    if (!inquiries) return [];
    const reasonCounts: Record<string, number> = {};
    
    inquiries
      .filter((i) => i.stage === "non_viable" && i.nonViableReason)
      .forEach((inquiry) => {
        const reason = inquiry.nonViableReason!;
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });

    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        name: nonViableReasonDisplayNames[reason as NonViableReason] || reason,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getStageDropOffData = () => {
    if (!inquiries) return [];
    const stageCounts: Record<string, number> = {};
    
    const stageOrder: PipelineStage[] = [
      "inquiry",
      "viability_check", 
      "insurance_collection",
      "vob_pending",
      "quote_client",
      "pre_assessment",
      "scheduled",
      "admitted",
    ];

    stageOrder.forEach((stage) => {
      stageCounts[stage] = inquiries.filter((i) => i.stage === stage).length;
    });

    let cumulative = totalInquiries;
    return stageOrder.map((stage) => {
      const count = stageCounts[stage];
      const result = {
        name: stageDisplayNames[stage],
        current: count,
        cumulative: cumulative,
        dropOff: cumulative > 0 ? ((cumulative - count) / cumulative * 100).toFixed(1) : "0",
      };
      cumulative = count;
      return result;
    });
  };

  const referralData = getReferralSourceData();
  const nonViableData = getNonViableReasonsData();
  const stageData = getStageDropOffData();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <Heart className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold hidden sm:block">Analytics</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card data-testid="card-total-inquiries">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inquiries
              </CardTitle>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{totalInquiries}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-admitted">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Admitted
              </CardTitle>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-green-600">{admittedCount}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-non-viable">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Non-Viable
              </CardTitle>
              <XCircle className="w-5 h-5 text-red-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-red-600">{nonViableCount}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-primary">{conversionRate}%</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card data-testid="chart-referral-source">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Inquiries by Referral Source</CardTitle>
              </div>
              <CardDescription>
                Total inquiries and conversions by source
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : referralData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No referral data available
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={referralData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value, name) => [value, name === 'total' ? 'Total' : 'Admitted']}
                    />
                    <Bar dataKey="total" fill="hsl(var(--muted-foreground))" name="Total" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="admitted" fill="hsl(var(--primary))" name="Admitted" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card data-testid="chart-non-viable-reasons">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">Non-Viable Reasons</CardTitle>
              </div>
              <CardDescription>
                Breakdown of why inquiries were marked non-viable
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : nonViableData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No non-viable inquiries yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie
                      data={nonViableData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {nonViableData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="chart-stage-distribution" className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Pipeline Stage Distribution</CardTitle>
            </div>
            <CardDescription>
              Current count of inquiries at each stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stageData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No stage data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stageData} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    tick={{ fontSize: 11 }}
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="table-referral-conversion">
          <CardHeader>
            <CardTitle className="text-lg">Conversion Rates by Referral Source</CardTitle>
            <CardDescription>
              Detailed breakdown with conversion percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : referralData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No data available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-semibold">Source</th>
                      <th className="text-center py-3 px-2 font-semibold">Total</th>
                      <th className="text-center py-3 px-2 font-semibold">Admitted</th>
                      <th className="text-right py-3 px-2 font-semibold">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralData.map((row, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-2">{row.name}</td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="secondary">{row.total}</Badge>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            {row.admitted}
                          </Badge>
                        </td>
                        <td className="text-right py-3 px-2 font-medium">
                          {row.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
