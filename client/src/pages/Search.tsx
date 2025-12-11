import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Heart,
  Search as SearchIcon,
  Filter,
  X,
  ChevronRight,
  Phone,
  FileText,
  Clock,
  DollarSign,
  ClipboardCheck,
  Calendar,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { Inquiry, PipelineStage, ReferralSource } from "@shared/schema";
import {
  stageDisplayNames,
  referralSourceDisplayNames,
  pipelineStages,
  referralSources,
} from "@shared/schema";
import { format } from "date-fns";

const stageIcons: Record<PipelineStage, typeof Phone> = {
  inquiry: Phone,
  viability_check: ClipboardCheck,
  insurance_collection: FileText,
  vob_pending: Clock,
  quote_client: DollarSign,
  pre_assessment: ClipboardCheck,
  scheduled: Calendar,
  admitted: UserCheck,
  non_viable: XCircle,
};

const stageColors: Record<PipelineStage, string> = {
  inquiry: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  viability_check: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
  insurance_collection: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  vob_pending: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  quote_client: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  pre_assessment: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  scheduled: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  admitted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  non_viable: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

interface SearchFilters {
  search: string;
  stage: string;
  referralSource: string;
  insuranceProvider: string;
  startDate: string;
  endDate: string;
}

export default function Search() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    stage: "",
    referralSource: "",
    insuranceProvider: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.stage && filters.stage !== "all") params.append("stage", filters.stage);
    if (filters.referralSource && filters.referralSource !== "all") params.append("referralSource", filters.referralSource);
    if (filters.insuranceProvider) params.append("insuranceProvider", filters.insuranceProvider);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    const queryString = params.toString();
    return `/api/inquiries/search${queryString ? `?${queryString}` : ""}`;
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "" && v !== "all");

  const { data: inquiries, isLoading, refetch } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries/search", filters],
    queryFn: async () => {
      const url = buildSearchUrl();
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to search inquiries");
      }
      return response.json();
    },
    enabled: hasActiveFilters,
  });

  const handleSearch = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      stage: "",
      referralSource: "",
      insuranceProvider: "",
      startDate: "",
      endDate: "",
    });
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

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
              <h1 className="text-xl font-bold hidden sm:block">Search Inquiries</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <SearchIcon className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, phone, email, or insurance..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  data-testid="input-search"
                  className="text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={!hasActiveFilters}
                  data-testid="button-search"
                  className="gap-2"
                >
                  <SearchIcon className="w-4 h-4" />
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="border-t pt-4 mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stage">Pipeline Stage</Label>
                  <Select
                    value={filters.stage}
                    onValueChange={(value) => updateFilter("stage", value)}
                  >
                    <SelectTrigger id="stage" data-testid="select-stage">
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All stages</SelectItem>
                      {pipelineStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stageDisplayNames[stage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralSource">Referral Source</Label>
                  <Select
                    value={filters.referralSource}
                    onValueChange={(value) => updateFilter("referralSource", value)}
                  >
                    <SelectTrigger id="referralSource" data-testid="select-referral-source">
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      {referralSources.map((source) => (
                        <SelectItem key={source} value={source}>
                          {referralSourceDisplayNames[source]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                  <Input
                    id="insuranceProvider"
                    placeholder="e.g., Blue Cross"
                    value={filters.insuranceProvider}
                    onChange={(e) => updateFilter("insuranceProvider", e.target.value)}
                    data-testid="input-insurance-provider"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">From Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => updateFilter("startDate", e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">To Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => updateFilter("endDate", e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!hasActiveFilters ? (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Search for Inquiries</h2>
            <p className="text-muted-foreground">
              Enter search terms or use filters to find inquiries
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : inquiries?.length === 0 ? (
          <div className="text-center py-12">
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {inquiries?.length} {inquiries?.length === 1 ? "inquiry" : "inquiries"}
            </p>
            {inquiries?.map((inquiry) => {
              const StageIcon = stageIcons[inquiry.stage as PipelineStage] || Phone;
              return (
                <button
                  key={inquiry.id}
                  onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                  className="w-full text-left p-4 rounded-lg border bg-card hover-elevate active-elevate-2 transition-colors"
                  data-testid={`inquiry-card-${inquiry.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stageColors[inquiry.stage as PipelineStage]}`}>
                        <StageIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-lg">
                          {inquiry.clientName || inquiry.callerName || "Unknown Caller"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{stageDisplayNames[inquiry.stage as PipelineStage]}</span>
                          {inquiry.phoneNumber && (
                            <>
                              <span>|</span>
                              <span>{inquiry.phoneNumber}</span>
                            </>
                          )}
                          {inquiry.callDateTime && (
                            <>
                              <span>|</span>
                              <span>{format(new Date(inquiry.callDateTime), "MMM d, yyyy")}</span>
                            </>
                          )}
                        </div>
                        {inquiry.insuranceProvider && (
                          <Badge variant="outline" className="mt-1">
                            {inquiry.insuranceProvider}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
