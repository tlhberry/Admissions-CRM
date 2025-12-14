import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Bed,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { Inquiry, Company } from "@shared/schema";
import { format } from "date-fns";

export default function BedBoard() {
  const [, navigate] = useLocation();

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/company"],
    retry: false,
  });

  const { data: bedMetrics, isLoading: bedMetricsLoading, error: bedMetricsError } = useQuery<{
    totalBeds: number;
    currentlyAdmitted: number;
    bedsAvailable: number;
  }>({
    queryKey: ["/api/bed-metrics"],
    enabled: !!company,
  });

  const { data: admittedClients, isLoading: admittedLoading, error: admittedError } = useQuery<Inquiry[]>({
    queryKey: ["/api/admitted-clients"],
    enabled: !!company,
  });

  const isLoading = companyLoading || bedMetricsLoading || admittedLoading;
  const hasError = !!companyError || !!bedMetricsError || !!admittedError;

  if (companyLoading) {
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
              <h1 className="text-xl font-bold">Bed Board</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          </div>
        </main>
      </div>
    );
  }

  if (companyError || !company) {
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
              <h1 className="text-xl font-bold">Bed Board</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <Card className="overflow-visible">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-muted mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Company Not Set Up</h2>
              <p className="text-muted-foreground mb-4">
                The bed board requires a company to be configured. Please contact your administrator to set up your organization.
              </p>
              <Button onClick={() => navigate("/")} data-testid="button-go-home">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold">Bed Board</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {bedMetricsError ? (
          <Card className="mb-8 border-destructive/50">
            <CardContent className="p-4 text-center text-destructive">
              Unable to load bed metrics. Please try again later.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="overflow-visible" data-testid="card-total-beds">
              <CardContent className="p-6 text-center">
                {bedMetricsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center bg-primary/10 text-primary mb-3">
                      <Bed className="w-6 h-6" />
                    </div>
                    <p className="text-4xl font-bold">{bedMetrics?.totalBeds ?? 0}</p>
                    <p className="text-sm text-muted-foreground mt-1">Total Beds</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-visible border-green-200 dark:border-green-800" data-testid="card-currently-admitted">
              <CardContent className="p-6 text-center">
                {bedMetricsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-3">
                      <User className="w-6 h-6" />
                    </div>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {bedMetrics?.currentlyAdmitted ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Currently Admitted</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card 
              className={`overflow-visible ${(bedMetrics?.bedsAvailable ?? 0) <= 2 ? "border-amber-200 dark:border-amber-800" : ""}`}
              data-testid="card-beds-available"
            >
              <CardContent className="p-6 text-center">
                {bedMetricsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${
                      (bedMetrics?.bedsAvailable ?? 0) <= 2 
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Bed className="w-6 h-6" />
                    </div>
                    <p className={`text-4xl font-bold ${(bedMetrics?.bedsAvailable ?? 0) <= 2 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                      {bedMetrics?.bedsAvailable ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Beds Available</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="overflow-visible" data-testid="card-admitted-clients">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Currently Admitted Clients</CardTitle>
              <Badge variant="secondary">{admittedClients?.length ?? 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {admittedLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : admittedError ? (
              <p className="text-center text-destructive py-8">
                Unable to load admitted clients. Please try again later.
              </p>
            ) : admittedClients?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No clients currently admitted
              </p>
            ) : (
              <div className="space-y-2">
                {admittedClients?.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/inquiry/${client.id}`)}
                    className="w-full text-left p-4 rounded-lg border bg-card hover-elevate active-elevate-2 transition-colors"
                    data-testid={`admitted-client-${client.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {client.clientName || client.callerName || "Unknown Client"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {client.actualAdmitDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Admitted {format(new Date(client.actualAdmitDate), "MMM d, yyyy")}
                            </span>
                          )}
                          {client.levelOfCare && (
                            <Badge variant="outline" className="text-xs">
                              {client.levelOfCare}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
