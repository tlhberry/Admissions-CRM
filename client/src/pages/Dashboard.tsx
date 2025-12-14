import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  ClipboardCheck,
  Calendar,
  UserCheck,
  LogOut,
  User,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Search,
  AlertTriangle,
  PhoneIncoming,
  Settings,
  Building2,
  FileBarChart,
  UserX,
  ClipboardList,
  UserCog,
} from "lucide-react";
import type { Inquiry, PipelineStage, Company } from "@shared/schema";
import { stageDisplayNames } from "@shared/schema";
import { format, differenceInHours } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const stageIcons: Record<PipelineStage, typeof Phone> = {
  inquiry: Phone,
  vob_pending: Clock,
  quote_client: DollarSign,
  pre_assessment: ClipboardCheck,
  scheduled: Calendar,
  admitted: UserCheck,
  non_viable: XCircle,
  lost: UserX,
};

const stageColors: Record<PipelineStage, string> = {
  inquiry: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  vob_pending: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  quote_client: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  pre_assessment: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  scheduled: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  admitted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  non_viable: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  lost: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  const { data: company, error: companyError } = useQuery<Company>({
    queryKey: ["/api/company"],
    retry: false, // Don't retry on 404 - user may not have a company yet
  });

  const testCTMWebhook = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/webhooks/ctm/test", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Test Call Created",
        description: `Inquiry #${data.inquiryId} created from simulated CTM call`,
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Could not create test inquiry",
        variant: "destructive",
      });
    },
  });

  const activeStages: PipelineStage[] = [
    "inquiry",
    "vob_pending",
    "quote_client",
    "pre_assessment",
    "scheduled",
  ];

  const getInquiriesByStage = (stage: PipelineStage) => {
    return inquiries?.filter((i) => i.stage === stage) || [];
  };

  const totalActive = activeStages.reduce(
    (acc, stage) => acc + getInquiriesByStage(stage).length,
    0
  );

  const admittedCount = getInquiriesByStage("admitted").length;
  const nonViableCount = getInquiriesByStage("non_viable").length;

  // Get inquiries that need follow-up (in VOB or quote stages for more than 24 hours)
  const getFollowUpReminders = () => {
    if (!inquiries) return [];
    const now = new Date();
    const reminderStages: PipelineStage[] = ["vob_pending", "quote_client"];
    
    return inquiries
      .filter((inquiry) => {
        if (!reminderStages.includes(inquiry.stage as PipelineStage)) return false;
        if (!inquiry.updatedAt) return false;
        
        const hoursSinceUpdate = differenceInHours(now, new Date(inquiry.updatedAt));
        return hoursSinceUpdate >= 24;
      })
      .sort((a, b) => {
        const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return aDate - bDate; // Oldest first
      });
  };

  const followUpReminders = getFollowUpReminders();

  // Check if inquiry has complete data for its current stage
  const isStageComplete = (inquiry: Inquiry): boolean => {
    const stage = inquiry.stage as PipelineStage;
    switch (stage) {
      case "inquiry":
        return !!(inquiry.insuranceProvider && inquiry.insurancePolicyId);
      case "vob_pending":
        return !!inquiry.vobCompletedAt;
      case "quote_client":
        return !!inquiry.quoteAccepted;
      case "pre_assessment":
        return inquiry.preAssessmentCompleted === "yes";
      case "scheduled":
        return !!(inquiry.expectedAdmitDate && inquiry.levelOfCare);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">AdmitSimple</h1>
            {company && (
              <span className="text-sm text-muted-foreground hidden sm:inline" data-testid="text-company-name">
                {company.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="button-add-new" className="gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">New</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/inquiry/new")} className="cursor-pointer" data-testid="menu-new-inquiry">
                  <Phone className="w-4 h-4 mr-2" />
                  New Inquiry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/accounts?action=new")} className="cursor-pointer" data-testid="menu-add-account">
                  <Building2 className="w-4 h-4 mr-2" />
                  Add Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/accounts?action=activity")} className="cursor-pointer" data-testid="menu-add-activity">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Add Activity
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={() => navigate("/search")}
              data-testid="button-search"
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={() => navigate("/analytics")}
              data-testid="button-analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={() => navigate("/reports")}
              data-testid="button-reports"
              title="Reports"
            >
              <FileBarChart className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={() => testCTMWebhook.mutate()}
              disabled={testCTMWebhook.isPending}
              data-testid="button-test-ctm"
              title="Test CTM Webhook"
            >
              <PhoneIncoming className="w-5 h-5" />
            </Button>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.firstName || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/accounts")} className="cursor-pointer" data-testid="menu-accounts">
                  <Building2 className="w-4 h-4 mr-2" />
                  Referral Accounts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reports")} className="cursor-pointer" data-testid="menu-reports">
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer" data-testid="menu-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer" data-testid="menu-admin-settings">
                    <UserCog className="w-4 h-4 mr-2" />
                    Admin Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Pipeline Overview</h2>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <p>
                {totalActive} active {totalActive === 1 ? "inquiry" : "inquiries"} 
                {" | "} {admittedCount} admitted 
                {" | "} {nonViableCount} non-viable
              </p>
            )}
          </div>
        </div>

        {followUpReminders.length > 0 && (
          <Card className="mb-8 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-follow-up-reminders">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Follow-Up Reminders</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {followUpReminders.length} {followUpReminders.length === 1 ? "inquiry" : "inquiries"} pending for 24+ hours
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {followUpReminders.slice(0, 5).map((inquiry) => {
                const StageIcon = stageIcons[inquiry.stage as PipelineStage] || Clock;
                const hoursAgo = inquiry.updatedAt 
                  ? differenceInHours(new Date(), new Date(inquiry.updatedAt))
                  : 0;
                
                return (
                  <button
                    key={inquiry.id}
                    onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover-elevate active-elevate-2 transition-colors"
                    data-testid={`reminder-card-${inquiry.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${stageColors[inquiry.stage as PipelineStage]}`}>
                          <StageIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {inquiry.clientName || inquiry.callerName || "Unknown Caller"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {stageDisplayNames[inquiry.stage as PipelineStage]} - {hoursAgo} hours ago
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
              {followUpReminders.length > 5 && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  +{followUpReminders.length - 5} more needing attention
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {activeStages.map((stage) => {
            const StageIcon = stageIcons[stage];
            const stageInquiries = getInquiriesByStage(stage);
            
            return (
              <Card key={stage} className="overflow-visible">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stageColors[stage]}`}>
                        <StageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {stageDisplayNames[stage]}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {isLoading ? "-" : stageInquiries.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : stageInquiries.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No inquiries at this stage
                    </p>
                  ) : (
                    stageInquiries.slice(0, 5).map((inquiry) => {
                      const complete = isStageComplete(inquiry);
                      return (
                        <button
                          key={inquiry.id}
                          onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                          className="w-full text-left p-3 rounded-lg border bg-card hover-elevate active-elevate-2 transition-colors"
                          data-testid={`inquiry-card-${inquiry.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    complete 
                                      ? "bg-green-500" 
                                      : "bg-amber-500"
                                  }`}
                                  title={complete ? "Stage complete" : "Needs attention"}
                                  data-testid={`status-dot-${inquiry.id}`}
                                />
                                <p className="font-medium truncate">
                                  {inquiry.clientName || inquiry.callerName || "Unknown Caller"}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground truncate pl-4">
                                {inquiry.callDateTime 
                                  ? format(new Date(inquiry.callDateTime), "MMM d, h:mm a")
                                  : "No date"}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })
                  )}
                  {!isLoading && stageInquiries.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{stageInquiries.length - 5} more
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="overflow-visible border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stageColors.admitted}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {stageDisplayNames.admitted}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  {isLoading ? "-" : admittedCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : admittedCount === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No admissions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {getInquiriesByStage("admitted")
                    .sort((a, b) => {
                      // Sort: clients without email sent first, email sent clients at bottom
                      const aEmailSent = !!a.arrivalEmailSentAt;
                      const bEmailSent = !!b.arrivalEmailSentAt;
                      if (aEmailSent !== bEmailSent) {
                        return aEmailSent ? 1 : -1;
                      }
                      // Within each group, sort by admit date (newest first)
                      const aDate = a.actualAdmitDate ? new Date(a.actualAdmitDate).getTime() : 0;
                      const bDate = b.actualAdmitDate ? new Date(b.actualAdmitDate).getTime() : 0;
                      return bDate - aDate;
                    })
                    .slice(0, 5)
                    .map((inquiry) => {
                      const emailSent = !!inquiry.arrivalEmailSentAt;
                      return (
                        <button
                          key={inquiry.id}
                          onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                          className={`w-full text-left p-3 rounded-lg border hover-elevate active-elevate-2 transition-colors ${
                            emailSent 
                              ? "bg-muted/50 opacity-60" 
                              : "bg-card"
                          }`}
                          data-testid={`inquiry-card-${inquiry.id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    emailSent 
                                      ? "bg-green-300 dark:bg-green-700" 
                                      : "bg-green-500"
                                  }`}
                                  title={emailSent ? "Arrival email sent" : "Waiting to send arrival email"}
                                  data-testid={`email-dot-${inquiry.id}`}
                                />
                                <p className={`font-medium truncate ${emailSent ? "text-muted-foreground" : ""}`}>
                                  {inquiry.clientName || inquiry.callerName || "Unknown"}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground pl-4">
                                {inquiry.actualAdmitDate 
                                  ? format(new Date(inquiry.actualAdmitDate), "MMM d, yyyy")
                                  : "Admitted"}
                                {emailSent && " - Email sent"}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-visible border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stageColors.non_viable}`}>
                    <XCircle className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {stageDisplayNames.non_viable}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  {isLoading ? "-" : nonViableCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : nonViableCount === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No non-viable inquiries
                </p>
              ) : (
                <div className="space-y-2">
                  {getInquiriesByStage("non_viable").slice(0, 3).map((inquiry) => (
                    <button
                      key={inquiry.id}
                      onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover-elevate active-elevate-2 transition-colors"
                      data-testid={`inquiry-card-${inquiry.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {inquiry.clientName || inquiry.callerName || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {inquiry.nonViableReason || "No reason"}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
