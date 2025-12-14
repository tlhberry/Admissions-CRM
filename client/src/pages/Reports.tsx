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
  Users,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  Trophy,
  Handshake,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Inquiry, ReferralSource, User, ActivityLog } from "@shared/schema";
import { referralSourceDisplayNames } from "@shared/schema";
import { startOfWeek, startOfMonth, startOfYear, subMonths, isAfter, parseISO } from "date-fns";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Reports() {
  const [, navigate] = useLocation();

  const { data: inquiries, isLoading: inquiriesLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
  });

  const isLoading = inquiriesLoading || usersLoading || activitiesLoading;

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(now);
  const thisYearStart = startOfYear(now);
  const threeMonthsAgo = subMonths(now, 3);

  const getAdmittedInquiries = () => {
    return inquiries?.filter((i) => i.stage === "admitted") || [];
  };

  const filterByDateRange = (admissions: Inquiry[], startDate: Date) => {
    return admissions.filter((i) => {
      if (!i.actualAdmitDate) return false;
      const admitDate = parseISO(i.actualAdmitDate);
      return isAfter(admitDate, startDate) || admitDate.toDateString() === startDate.toDateString();
    });
  };

  const admitted = getAdmittedInquiries();
  const admitsThisWeek = filterByDateRange(admitted, thisWeekStart);
  const admitsThisMonth = filterByDateRange(admitted, thisMonthStart);
  const admitsThisYear = filterByDateRange(admitted, thisYearStart);
  const admitsPast3Months = filterByDateRange(admitted, threeMonthsAgo);

  const totalInquiries = inquiries?.length || 0;
  const conversionRate = totalInquiries > 0 ? ((admitted.length / totalInquiries) * 100).toFixed(1) : "0";

  const getReferralSourcePerformance = () => {
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
        source,
        total: counts.total,
        admitted: counts.admitted,
        conversionRate: counts.total > 0 ? Number(((counts.admitted / counts.total) * 100).toFixed(1)) : 0,
      }))
      .filter((item) => item.admitted > 0)
      .sort((a, b) => b.admitted - a.admitted);
  };

  const getBDRepLeaderboard = () => {
    if (!inquiries || !users) return [];
    
    const repCounts: Record<string, number> = {};
    
    admitted.forEach((inquiry) => {
      if (inquiry.userId) {
        repCounts[inquiry.userId] = (repCounts[inquiry.userId] || 0) + 1;
      }
    });

    return Object.entries(repCounts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId);
        return {
          userId,
          name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown" : "Unknown",
          admits: count,
        };
      })
      .sort((a, b) => b.admits - a.admits);
  };

  const getBDRepActivitySummary = () => {
    if (!activities || !users) return [];
    
    const faceToFaceActivities = activities.filter((a) => a.activityType === "face_to_face");
    const repCounts: Record<string, number> = {};
    
    faceToFaceActivities.forEach((activity) => {
      repCounts[activity.userId] = (repCounts[activity.userId] || 0) + 1;
    });

    return Object.entries(repCounts)
      .map(([userId, count]) => {
        const user = users.find((u) => u.id === userId);
        return {
          userId,
          name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown" : "Unknown",
          visits: count,
        };
      })
      .sort((a, b) => b.visits - a.visits);
  };

  const referralData = getReferralSourcePerformance();
  const leaderboard = getBDRepLeaderboard();
  const activitySummary = getBDRepActivitySummary();

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
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <Heart className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold">Reports</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Admissions Reports</h2>
          <p className="text-muted-foreground">
            Track admissions performance, referral sources, and BD rep activity
          </p>
        </div>

        {/* Admission Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="card-admits-week">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-admits-week">{admitsThisWeek.length}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-admits-month">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-admits-month">{admitsThisMonth.length}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-admits-3months">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Past 3 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-admits-3months">{admitsPast3Months.length}</div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-admits-year">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                This Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-admits-year">{admitsThisYear.length}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Rate Card */}
        <Card className="mb-8" data-testid="card-conversion-rate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              Overall Conversion Rate
            </CardTitle>
            <CardDescription>
              Percentage of total inquiries that resulted in admissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-green-600 dark:text-green-400" data-testid="text-conversion-rate">
                  {conversionRate}%
                </span>
                <span className="text-muted-foreground">
                  ({admitted.length} of {totalInquiries} inquiries)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Source Performance */}
        <Card className="mb-8" data-testid="card-referral-performance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Referral Source Performance
            </CardTitle>
            <CardDescription>
              Admissions by referral source with conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : referralData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={referralData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-muted-foreground" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground" 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "admitted" ? "Admits" : "Total Inquiries"
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="total" fill={CHART_COLORS[1]} name="Total Inquiries" />
                    <Bar dataKey="admitted" fill={CHART_COLORS[0]} name="Admits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No admissions data available</p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* BD Rep Leaderboard */}
          <Card data-testid="card-bd-leaderboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                BD Rep Leaderboard
              </CardTitle>
              <CardDescription>
                Admissions by business development representative
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((rep, index) => (
                    <div
                      key={rep.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`row-bd-rep-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                          index === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                          index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{rep.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-base px-3">
                        {rep.admits} admits
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No admission data available</p>
              )}
            </CardContent>
          </Card>

          {/* BD Rep Activity Summary */}
          <Card data-testid="card-bd-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-blue-500" />
                Face-to-Face Visits
              </CardTitle>
              <CardDescription>
                BD rep in-person visit activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : activitySummary.length > 0 ? (
                <div className="space-y-3">
                  {activitySummary.map((rep, index) => (
                    <div
                      key={rep.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      data-testid={`row-activity-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{rep.name}</span>
                      </div>
                      <Badge variant="outline" className="text-base px-3">
                        {rep.visits} visits
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No activity data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
