import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Heart,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  FileText,
  Clock,
  DollarSign,
  ClipboardCheck,
  Calendar,
  UserCheck,
  Copy,
  Check,
  Pencil,
  Mail,
  Wand2,
  Sparkles,
  PhoneOutgoing,
  PhoneIncoming,
  Download,
} from "lucide-react";
import type { Inquiry, PipelineStage, NonViableReason, LevelOfCare, LostReason, ReferralAccount, OnlineReferralSource, CallLog } from "@shared/schema";
import {
  stageDisplayNames,
  nonViableReasons,
  nonViableReasonDisplayNames,
  levelsOfCare,
  levelOfCareDisplayNames,
  lostReasons,
  lostReasonDisplayNames,
  onlineReferralSourceDisplayNames,
} from "@shared/schema";
import { format } from "date-fns";
import { PreAssessmentForms } from "@/components/PreAssessmentForms";
import { StageNavigator } from "@/components/StageNavigator";

const stageIcons: Record<PipelineStage, typeof Phone> = {
  inquiry: Phone,
  vob_pending: Clock,
  quote_client: DollarSign,
  pre_assessment: ClipboardCheck,
  scheduled: Calendar,
  admitted: UserCheck,
  non_viable: XCircle,
  lost: XCircle,
};

const stageColors: Record<PipelineStage, string> = {
  inquiry: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  vob_pending: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  quote_client: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  pre_assessment: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  scheduled: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  admitted: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  non_viable: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  lost: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

export default function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showNonViableDialog, setShowNonViableDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [isDownloadingDocs, setIsDownloadingDocs] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [editingReferral, setEditingReferral] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [presentingProblemsText, setPresentingProblemsText] = useState("");
  const [selectedViewStage, setSelectedViewStage] = useState<PipelineStage | null>(null);

  const { data: inquiry, isLoading } = useQuery<Inquiry>({
    queryKey: [`/api/inquiries/${id}`],
  });

  const { data: referralAccounts } = useQuery<ReferralAccount[]>({
    queryKey: ["/api/referral-accounts"],
  });

  // Fetch call logs for this inquiry
  const { data: callLogs, isLoading: callLogsLoading, isError: callLogsError } = useQuery<CallLog[]>({
    queryKey: ["/api/inquiries", id, "call-logs"],
    enabled: !!id,
  });

  // Sync presenting problems text when inquiry loads
  useEffect(() => {
    if (inquiry?.presentingProblems !== undefined) {
      setPresentingProblemsText(inquiry.presentingProblems || "");
    }
  }, [inquiry?.presentingProblems]);

  // Helper to get referral source display
  const getReferralSourceDisplay = () => {
    if (!inquiry) return "—";
    
    if (inquiry.referralOrigin === "account" && inquiry.referralAccountId) {
      const account = referralAccounts?.find(a => a.id === inquiry.referralAccountId);
      return account?.name || `Account #${inquiry.referralAccountId}`;
    }
    
    if (inquiry.referralOrigin === "online" && inquiry.onlineSource) {
      return onlineReferralSourceDisplayNames[inquiry.onlineSource as OnlineReferralSource] || inquiry.onlineSource;
    }
    
    // Fallback to legacy referralSource
    return inquiry.referralSource || "—";
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Inquiry>) => {
      const response = await apiRequest("PATCH", `/api/inquiries/${id}`, data);
      return response.json() as Promise<Inquiry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inquiries/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Updated",
        description: "Inquiry has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inquiry",
        variant: "destructive",
      });
    },
  });

  const sendArrivalEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/inquiries/${id}/send-arrival-email`);
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/inquiries/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({ title: "Email Sent", description: data.message || "Client arrival email sent successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      // Create the new referral account only
      const response = await apiRequest("POST", "/api/referral-accounts", data);
      return response.json() as Promise<ReferralAccount>;
    },
    onSuccess: async (newAccount) => {
      try {
        // Use updateMutation.mutateAsync to update inquiry through shared pipeline
        await updateMutation.mutateAsync({
          referralOrigin: "account",
          referralAccountId: newAccount.id,
          onlineSource: null,
        });
        
        // Invalidate referral accounts cache after inquiry update succeeds
        await queryClient.invalidateQueries({ queryKey: ["/api/referral-accounts"] });
        
        // Clear UI state and show success
        setShowCreateAccountDialog(false);
        setNewAccountName("");
        setEditingReferral(false);
        setReferralSearch("");
      } catch (err) {
        toast({ title: "Error", description: "Account created but failed to link to inquiry", variant: "destructive" });
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" });
    },
  });

  // Log outbound call (click-to-call)
  const logOutboundCallMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/inquiries/${id}/call-logs`, {});
      return response.json() as Promise<CallLog>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", id, "call-logs"] });
      toast({ title: "Call Logged", description: "Outbound call logged successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to log call", variant: "destructive" });
    },
  });

  // Handle click-to-call - logs call and opens phone dialer
  const handleCallClick = async () => {
    if (inquiry?.phoneNumber) {
      try {
        await logOutboundCallMutation.mutateAsync();
        window.location.href = `tel:${inquiry.phoneNumber}`;
      } catch (error) {
        // Error toast is handled by mutation's onError
      }
    }
  };

  const handleDownloadDocs = async () => {
    if (!id) return;
    setIsDownloadingDocs(true);
    try {
      const response = await fetch(`/api/inquiries/${id}/download-docs`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to download documents");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || "documents.zip";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download Started",
        description: "Your documents are being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingDocs(false);
    }
  };

  const handleDownloadAdmissionsReport = async () => {
    if (!id) return;
    setIsDownloadingReport(true);
    try {
      const response = await fetch(`/api/inquiries/${id}/admissions-report.pdf`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate admissions report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || "admissions-report.pdf";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download Complete",
        description: "Admissions PDF Report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate admissions report.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleNonViable = (reason: NonViableReason, notes: string) => {
    updateMutation.mutate({
      isViable: "no",
      nonViableReason: reason,
      nonViableNotes: notes,
      stage: "non_viable",
    });
    setShowNonViableDialog(false);
  };

  const handleLost = (reason: LostReason, notes: string) => {
    updateMutation.mutate({
      lostReason: reason,
      lostNotes: notes,
      stage: "lost",
    });
    setShowLostDialog(false);
  };

  const stage = inquiry?.stage as PipelineStage | undefined;
  const StageIcon = stage ? stageIcons[stage] : Phone;

  const handleStageClick = (clickedStage: PipelineStage) => {
    // Allow viewing any stage that has been completed or is current
    if (clickedStage === stage) {
      // Clicking on current stage resets to default view
      setSelectedViewStage(null);
    } else {
      setSelectedViewStage(clickedStage);
    }
  };

  // Determine which stage to show content for
  const displayStage = selectedViewStage || stage;

  const generateAdmissionSummary = () => {
    if (!inquiry) return "";
    return `New Admit Expected: ${inquiry.expectedAdmitDate ? format(new Date(inquiry.expectedAdmitDate), "MMMM d, yyyy") : "TBD"}
Client Name: ${inquiry.clientName || inquiry.callerName || "Unknown"}, DOB: ${inquiry.dateOfBirth ? format(new Date(inquiry.dateOfBirth), "MM/dd/yyyy") : "TBD"}
Insurance: ${inquiry.insuranceProvider || "N/A"}, Policy ID: ${inquiry.insurancePolicyId || "N/A"}
Level of Care: ${inquiry.levelOfCare ? levelOfCareDisplayNames[inquiry.levelOfCare as LevelOfCare] : "TBD"}`;
  };

  const copyToClipboard = async () => {
    const summary = generateAdmissionSummary();
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Admission summary copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-3xl">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Inquiry Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This inquiry may have been deleted or doesn't exist.
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-back-home">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
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
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <Heart className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold">
                  {inquiry.clientName || inquiry.callerName || "Unknown"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Inquiry #{inquiry.id}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${stageColors[stage!]} border-0`}>
              {stageDisplayNames[stage!]}
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Stage Navigator */}
        <StageNavigator
          inquiryId={parseInt(id!)}
          currentStage={stage!}
          onStageClick={handleStageClick}
          onDownloadDocs={handleDownloadDocs}
          isDownloading={isDownloadingDocs}
        />

        {/* Show indicator when viewing a different stage */}
        {selectedViewStage && selectedViewStage !== stage && (
          <Card className="bg-muted/50">
            <CardContent className="py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Viewing <strong className="text-foreground">{stageDisplayNames[selectedViewStage]}</strong> stage (Read-only)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedViewStage(null)}
                data-testid="button-return-current-stage"
              >
                Return to Current Stage
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stageColors[stage!]}`}>
                <StageIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="text-xl font-semibold h-10"
                      placeholder="Enter name..."
                      autoFocus
                      data-testid="input-inquiry-name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateMutation.mutate({ callerName: tempName });
                          setEditingName(false);
                        } else if (e.key === "Escape") {
                          setEditingName(false);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate({ callerName: tempName });
                        setEditingName(false);
                      }}
                      data-testid="button-save-name"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingName(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle 
                      className="text-xl cursor-pointer hover-elevate rounded px-1 -mx-1"
                      onClick={() => {
                        setTempName(inquiry.callerName || "");
                        setEditingName(true);
                      }}
                      data-testid="text-inquiry-name"
                    >
                      {inquiry.callerName || stageDisplayNames[stage!]}
                    </CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setTempName(inquiry.callerName || "");
                        setEditingName(true);
                      }}
                      data-testid="button-edit-name"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <CardDescription>
                  {inquiry.callDateTime && (
                    <>Called {format(new Date(inquiry.callDateTime), "MMM d, yyyy 'at' h:mm a")}</>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Caller</p>
                <p className="font-medium">{inquiry.callerName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{inquiry.clientName || "Same as caller"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                {inquiry.phoneNumber ? (
                  <button
                    onClick={handleCallClick}
                    disabled={logOutboundCallMutation.isPending}
                    className="font-medium text-primary hover-elevate flex items-center gap-1 rounded px-1 -mx-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-call-phone"
                  >
                    {logOutboundCallMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    {inquiry.phoneNumber}
                  </button>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referral Source</p>
                {editingReferral ? (
                  <div className="relative">
                    <Input
                      value={referralSearch}
                      onChange={(e) => setReferralSearch(e.target.value)}
                      placeholder="Search accounts or online sources..."
                      className="h-10"
                      autoFocus
                      data-testid="input-referral-search"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditingReferral(false);
                          setReferralSearch("");
                        }
                      }}
                    />
                    {referralSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                        {/* Referral Accounts Section */}
                        {referralAccounts && referralAccounts
                          .filter(a => a.name.toLowerCase().includes(referralSearch.toLowerCase()))
                          .slice(0, 5)
                          .map(account => (
                            <button
                              key={`account-${account.id}`}
                              className="w-full px-3 py-2 text-left hover-elevate flex items-center gap-2"
                              onClick={() => {
                                updateMutation.mutate({
                                  referralOrigin: "account",
                                  referralAccountId: account.id,
                                  onlineSource: null,
                                });
                                setEditingReferral(false);
                                setReferralSearch("");
                              }}
                              data-testid={`option-account-${account.id}`}
                            >
                              <Badge variant="outline" className="text-xs">Account</Badge>
                              <span>{account.name}</span>
                            </button>
                          ))}
                        {/* Online Sources Section */}
                        {Object.entries(onlineReferralSourceDisplayNames)
                          .filter(([, name]) => name.toLowerCase().includes(referralSearch.toLowerCase()))
                          .slice(0, 5)
                          .map(([key, name]) => (
                            <button
                              key={`online-${key}`}
                              className="w-full px-3 py-2 text-left hover-elevate flex items-center gap-2"
                              onClick={() => {
                                updateMutation.mutate({
                                  referralOrigin: "online",
                                  onlineSource: key,
                                  referralAccountId: null,
                                });
                                setEditingReferral(false);
                                setReferralSearch("");
                              }}
                              data-testid={`option-online-${key}`}
                            >
                              <Badge variant="secondary" className="text-xs">Online</Badge>
                              <span>{name}</span>
                            </button>
                          ))}
                        {/* No results */}
                        {(!referralAccounts?.some(a => a.name.toLowerCase().includes(referralSearch.toLowerCase())) &&
                          !Object.values(onlineReferralSourceDisplayNames).some(n => n.toLowerCase().includes(referralSearch.toLowerCase()))) && (
                          <div className="px-3 py-2 text-muted-foreground text-sm">No matching sources found</div>
                        )}
                        {/* Create new account option */}
                        <button
                          className="w-full px-3 py-2 text-left hover-elevate flex items-center gap-2 border-t"
                          onClick={() => {
                            setShowCreateAccountDialog(true);
                            setNewAccountName(referralSearch);
                          }}
                          data-testid="button-create-referral-account"
                        >
                          <Badge variant="outline" className="text-xs">New</Badge>
                          <span>Create "{referralSearch || 'new account'}"</span>
                        </button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-1 top-1"
                      onClick={() => {
                        setEditingReferral(false);
                        setReferralSearch("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p 
                      className="font-medium cursor-pointer hover-elevate rounded px-1 -mx-1"
                      onClick={() => setEditingReferral(true)}
                      data-testid="text-referral-source"
                    >
                      {getReferralSourceDisplay()}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => setEditingReferral(true)}
                      data-testid="button-edit-referral"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              {inquiry.initialNotes && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Call Notes</p>
                  <p className="font-medium whitespace-pre-line" data-testid="text-call-notes">{inquiry.initialNotes}</p>
                </div>
              )}
              {(inquiry.ctmCallId || inquiry.ctmTrackingNumber || inquiry.callDurationSeconds || inquiry.callRecordingUrl) && (
                <>
                  <Separator className="sm:col-span-2" />
                  <div className="sm:col-span-2 pt-2">
                    <p className="text-sm font-medium text-muted-foreground mb-3">CallTrackingMetrics Data</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {inquiry.ctmCallId && (
                        <div>
                          <p className="text-xs text-muted-foreground">CTM Call ID</p>
                          <p className="text-sm font-medium" data-testid="text-ctm-call-id">{inquiry.ctmCallId}</p>
                        </div>
                      )}
                      {inquiry.ctmTrackingNumber && (
                        <div>
                          <p className="text-xs text-muted-foreground">Tracking Number</p>
                          <p className="text-sm font-medium" data-testid="text-ctm-tracking-number">{inquiry.ctmTrackingNumber}</p>
                        </div>
                      )}
                      {inquiry.callDurationSeconds && (
                        <div>
                          <p className="text-xs text-muted-foreground">Call Duration</p>
                          <p className="text-sm font-medium" data-testid="text-call-duration">{inquiry.callDurationSeconds} seconds</p>
                        </div>
                      )}
                      {inquiry.ctmSource && (
                        <div>
                          <p className="text-xs text-muted-foreground">CTM Source</p>
                          <p className="text-sm font-medium" data-testid="text-ctm-source">{inquiry.ctmSource}</p>
                        </div>
                      )}
                      {inquiry.callRecordingUrl && (
                        <div className="sm:col-span-2">
                          <p className="text-xs text-muted-foreground">Call Recording</p>
                          <a 
                            href={inquiry.callRecordingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline"
                            data-testid="link-call-recording"
                          >
                            Listen to Recording
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {/* Call History Section */}
              <>
                <Separator className="sm:col-span-2" />
                <div className="sm:col-span-2 pt-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Call History</p>
                  {callLogsLoading && (
                    <p className="text-sm text-muted-foreground">Loading call history...</p>
                  )}
                  {callLogsError && (
                    <p className="text-sm text-destructive">Failed to load call history</p>
                  )}
                  {!callLogsLoading && !callLogsError && (!callLogs || callLogs.length === 0) && (
                    <p className="text-sm text-muted-foreground">No call history yet</p>
                  )}
                  {callLogs && callLogs.length > 0 && (
                    <div className="space-y-2">
                      {callLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className="flex items-center gap-3 text-sm"
                          data-testid={`call-log-${log.id}`}
                        >
                          {log.direction === "inbound" ? (
                            <PhoneIncoming className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                          <span className="font-medium">
                            {log.direction === "inbound" ? "Inbound" : "Outbound"}
                          </span>
                          <span className="text-muted-foreground">
                            {log.createdAt 
                              ? format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : "—"
                            }
                          </span>
                          {log.durationSeconds && (
                            <span className="text-muted-foreground">
                              ({log.durationSeconds}s)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Type & Presenting Problems Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Treatment Information</CardTitle>
            <CardDescription>Select treatment types and document presenting problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Seeking Treatment For</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sud-treatment"
                    checked={inquiry.seekingSudTreatment === "yes"}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({ seekingSudTreatment: checked ? "yes" : "no" });
                    }}
                    data-testid="checkbox-sud-treatment"
                  />
                  <label
                    htmlFor="sud-treatment"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    SUD Treatment
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mental-health"
                    checked={inquiry.seekingMentalHealth === "yes"}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({ seekingMentalHealth: checked ? "yes" : "no" });
                    }}
                    data-testid="checkbox-mental-health"
                  />
                  <label
                    htmlFor="mental-health"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Mental Health
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="eating-disorder"
                    checked={inquiry.seekingEatingDisorder === "yes"}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({ seekingEatingDisorder: checked ? "yes" : "no" });
                    }}
                    data-testid="checkbox-eating-disorder"
                  />
                  <label
                    htmlFor="eating-disorder"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Eating Disorder
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Presenting Problems</p>
              <Textarea
                placeholder="Document the client's presenting problems, concerns, and initial assessment notes..."
                value={presentingProblemsText}
                onChange={(e) => setPresentingProblemsText(e.target.value)}
                onBlur={() => {
                  if (presentingProblemsText !== (inquiry.presentingProblems || "")) {
                    updateMutation.mutate({ presentingProblems: presentingProblemsText });
                  }
                }}
                className="min-h-[100px]"
                data-testid="textarea-presenting-problems"
              />
            </div>
          </CardContent>
        </Card>

        {displayStage === "inquiry" && (
          <InsuranceForm
            inquiry={inquiry}
            onSubmit={selectedViewStage ? undefined : (data) => updateMutation.mutate({ ...data, stage: "vob_pending" })}
            onNonViable={selectedViewStage ? undefined : () => setShowNonViableDialog(true)}
            isPending={updateMutation.isPending}
            readOnly={!!selectedViewStage}
          />
        )}

        {displayStage === "vob_pending" && (
          <VOBForm
            inquiry={inquiry}
            onSubmit={selectedViewStage ? undefined : (data) => updateMutation.mutate({ ...data, stage: "quote_client", vobCompletedAt: new Date() })}
            isPending={updateMutation.isPending}
            readOnly={!!selectedViewStage}
          />
        )}

        {displayStage === "quote_client" && (
          <QuoteSection
            inquiry={inquiry}
            onAccept={selectedViewStage ? undefined : (notes) => updateMutation.mutate({ quoteAccepted: "yes", quoteNotes: notes, stage: "pre_assessment" })}
            onDecline={selectedViewStage ? undefined : (notes) => updateMutation.mutate({ quoteAccepted: "no", quoteNotes: notes, stage: "non_viable", nonViableReason: "client_declined" })}
            isPending={updateMutation.isPending}
            readOnly={!!selectedViewStage}
          />
        )}

        {displayStage === "pre_assessment" && (
          <PreAssessmentSection
            inquiryId={inquiry.id}
            onComplete={selectedViewStage ? undefined : (notes) => updateMutation.mutate({ preAssessmentCompleted: "yes", preAssessmentDate: new Date(), preAssessmentNotes: notes, stage: "scheduled" })}
            isPending={updateMutation.isPending}
            readOnly={false}
          />
        )}

        {displayStage === "scheduled" && (
          <SchedulingFormWrapper
            inquiry={inquiry}
            onSubmit={selectedViewStage ? undefined : (data) => updateMutation.mutate(data)}
            onAdmit={selectedViewStage ? undefined : () => updateMutation.mutate({ actualAdmitDate: new Date().toISOString().split("T")[0], stage: "admitted" })}
            onLost={selectedViewStage ? undefined : () => setShowLostDialog(true)}
            isPending={updateMutation.isPending}
            onCopy={copyToClipboard}
            copied={copied}
            readOnly={!!selectedViewStage}
          />
        )}

        {displayStage === "admitted" && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-green-700 dark:text-green-300">Admitted</CardTitle>
                  <CardDescription>
                    {inquiry.actualAdmitDate && (
                      <>Admitted on {format(new Date(inquiry.actualAdmitDate), "MMMM d, yyyy")}</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm whitespace-pre-wrap">
                {generateAdmissionSummary()}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => sendArrivalEmailMutation.mutate()}
                  disabled={sendArrivalEmailMutation.isPending}
                  data-testid="button-send-arrival-email"
                >
                  {sendArrivalEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Client Arrived Email
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={copyToClipboard}
                  data-testid="button-copy-summary"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Summary
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadAdmissionsReport}
                  disabled={isDownloadingReport}
                  data-testid="button-download-admissions-report"
                >
                  {isDownloadingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Admissions PDF Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {displayStage === "non_viable" && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-red-700 dark:text-red-300">Non-Viable</CardTitle>
                  <CardDescription>
                    {inquiry.nonViableReason && (
                      <>Reason: {nonViableReasonDisplayNames[inquiry.nonViableReason as NonViableReason]}</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {inquiry.nonViableNotes && (
              <CardContent>
                <p className="text-muted-foreground">{inquiry.nonViableNotes}</p>
              </CardContent>
            )}
          </Card>
        )}

        {displayStage === "lost" && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-xl text-amber-700 dark:text-amber-300">Lost Client</CardTitle>
                  <CardDescription>
                    {inquiry.lostReason && (
                      <>Reason: {lostReasonDisplayNames[inquiry.lostReason as LostReason]}</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {inquiry.lostNotes && (
              <CardContent>
                <p className="text-muted-foreground">{inquiry.lostNotes}</p>
              </CardContent>
            )}
          </Card>
        )}
      </main>

      <NonViableDialog
        open={showNonViableDialog}
        onClose={() => setShowNonViableDialog(false)}
        onConfirm={handleNonViable}
        isPending={updateMutation.isPending}
      />

      <LostClientDialog
        open={showLostDialog}
        onClose={() => setShowLostDialog(false)}
        onConfirm={handleLost}
        isPending={updateMutation.isPending}
      />

      <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Referral Account</DialogTitle>
            <DialogDescription>Enter a name for the new referral source</DialogDescription>
          </DialogHeader>
          <Input
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="Account name"
            data-testid="input-new-account-name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAccountDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createAccountMutation.mutate({ name: newAccountName })}
              disabled={!newAccountName.trim() || createAccountMutation.isPending}
              data-testid="button-confirm-create-account"
            >
              {createAccountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NonViableDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: NonViableReason, notes: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState<NonViableReason | "">("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Non-Viable</DialogTitle>
          <DialogDescription>
            Please select a reason for tracking purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Select value={reason} onValueChange={(v) => setReason(v as NonViableReason)}>
              <SelectTrigger className="h-12" data-testid="select-non-viable-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {nonViableReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {nonViableReasonDisplayNames[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="min-h-24"
              data-testid="input-non-viable-notes"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => reason && onConfirm(reason, notes)}
            disabled={!reason || isPending}
            className="w-full sm:w-auto"
            data-testid="button-confirm-non-viable"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm Non-Viable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LostClientDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: LostReason, notes: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState<LostReason | "">("");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Lost Client</DialogTitle>
          <DialogDescription>
            This client was viable but did not proceed to admission. Please select a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Select value={reason} onValueChange={(v) => setReason(v as LostReason)}>
              <SelectTrigger className="h-12" data-testid="select-lost-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {lostReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {lostReasonDisplayNames[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              className="min-h-24"
              data-testid="input-lost-notes"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={() => reason && onConfirm(reason, notes)}
            disabled={!reason || isPending}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
            data-testid="button-confirm-lost"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm Lost Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const insuranceSchema = z.object({
  callerName: z.string().min(1, "Caller name is required"),
  clientName: z.string().optional(),
  insuranceProvider: z.string().min(1, "Insurance provider is required"),
  insurancePolicyId: z.string().min(1, "Policy ID is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  insuranceNotes: z.string().optional(),
});

interface AIStatus {
  available: boolean;
  reason?: string;
  enabled?: boolean;
  budgetLimitCents?: number | null;
  usageThisMonthCents?: number;
}

function InsuranceForm({
  inquiry,
  onSubmit,
  onNonViable,
  isPending,
  readOnly = false,
}: {
  inquiry: Inquiry;
  onSubmit?: (data: z.infer<typeof insuranceSchema>) => void;
  onNonViable?: () => void;
  isPending: boolean;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const { data: aiStatus, isLoading: aiStatusLoading } = useQuery<AIStatus>({
    queryKey: ["/api/ai/status"],
  });
  
  const form = useForm({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      callerName: inquiry.callerName || "",
      clientName: inquiry.clientName || "",
      insuranceProvider: inquiry.insuranceProvider || "",
      insurancePolicyId: inquiry.insurancePolicyId || "",
      dateOfBirth: inquiry.dateOfBirth || "",
      insuranceNotes: inquiry.insuranceNotes || "",
    },
  });

  const handleAIAutoFill = async () => {
    if (!aiStatus?.available) {
      toast({
        title: "AI Not Available",
        description: aiStatus?.reason || "AI assistance is currently disabled.",
        variant: "destructive",
      });
      return;
    }
    
    setIsTranscribing(true);
    try {
      const response = await apiRequest("POST", `/api/inquiries/${inquiry.id}/transcribe`);
      const result = await response.json();
      
      if (result.success && result.extractedData) {
        const data = result.extractedData;
        if (data.callerName && !form.getValues("callerName")) {
          form.setValue("callerName", data.callerName);
        }
        if (data.clientName && !form.getValues("clientName")) {
          form.setValue("clientName", data.clientName);
        }
        if (data.insuranceProvider && !form.getValues("insuranceProvider")) {
          form.setValue("insuranceProvider", data.insuranceProvider);
        }
        if (data.insurancePolicyId && !form.getValues("insurancePolicyId")) {
          form.setValue("insurancePolicyId", data.insurancePolicyId);
        }
        
        queryClient.invalidateQueries({ queryKey: [`/api/inquiries/${inquiry.id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/ai/status"] });
        
        toast({
          title: "Call Transcribed",
          description: "Form fields have been auto-filled from the call recording.",
        });
      }
    } catch (error: unknown) {
      console.error("Transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not transcribe the call recording.";
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const hasRecording = !!inquiry.callRecordingUrl;
  const aiStatusReady = !aiStatusLoading && aiStatus !== undefined;
  const showAIButton = hasRecording && aiStatusReady && aiStatus?.available;
  const showAIUnavailableMessage = hasRecording && aiStatusReady && !aiStatus?.available;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Insurance Information</CardTitle>
              <CardDescription>Collect client insurance details</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {showAIButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAIAutoFill}
                disabled={isTranscribing}
                data-testid="button-ai-autofill"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use AI Assist
                  </>
                )}
              </Button>
            )}
            {hasRecording && !aiStatusLoading && (
              <Badge variant="outline" className="text-xs" data-testid="badge-manual-entry">
                {showAIUnavailableMessage 
                  ? `AI ${aiStatus?.reason || "Unavailable"} - Fill manually below`
                  : "Or fill manually"
                }
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit ? form.handleSubmit(onSubmit) : (e) => e.preventDefault()} className="space-y-6">
            <fieldset disabled={readOnly}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="callerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Caller Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Who called?"
                        className="text-lg h-12"
                        data-testid="input-caller-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Client Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="If different from caller"
                        className="text-lg h-12"
                        data-testid="input-client-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="insuranceProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Insurance Provider *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., BlueCross BlueShield"
                      className="text-lg h-12"
                      data-testid="input-insurance-provider"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insurancePolicyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Policy ID / Member Number *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Policy number"
                      className="text-lg h-12"
                      data-testid="input-policy-id"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Client Date of Birth *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="text-lg h-12"
                      data-testid="input-dob"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insuranceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional insurance details..."
                      className="min-h-24"
                      data-testid="input-insurance-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {inquiry.callSummary && (
              <div className="p-4 rounded-lg bg-muted/50 border border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Call Summary</span>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-call-summary">
                  {inquiry.callSummary}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={isPending}
                data-testid="button-submit-insurance"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Submit & Start VOB
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="flex-1 border-destructive text-destructive"
                onClick={onNonViable}
                disabled={isPending}
                data-testid="button-mark-non-viable"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Not Viable
              </Button>
            </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const vobSchema = z.object({
  vobDetails: z.string().min(1, "VOB details are required"),
  coverageDetails: z.string().optional(),
  quotedCost: z.string().optional(),
  clientResponsibility: z.string().optional(),
  vobFileUrl: z.string().optional(),
  inNetworkDeductible: z.string().optional(),
  inNetworkDeductibleMet: z.string().optional(),
  inNetworkOopMax: z.string().optional(),
  inNetworkOopMet: z.string().optional(),
  hasOutOfNetworkBenefits: z.string().optional(),
  outOfNetworkDeductible: z.string().optional(),
  outOfNetworkDeductibleMet: z.string().optional(),
  outOfNetworkOopMax: z.string().optional(),
  outOfNetworkOopMet: z.string().optional(),
  stateRestrictions: z.string().optional(),
  preCertRequired: z.string().optional(),
  preAuthRequired: z.string().optional(),
  preCertAuthDetails: z.string().optional(),
  hasSubstanceUseBenefits: z.string().optional(),
  hasMentalHealthBenefits: z.string().optional(),
  benefitNotes: z.string().optional(),
});

function VOBForm({
  inquiry,
  onSubmit,
  isPending,
  readOnly = false,
}: {
  inquiry: Inquiry;
  onSubmit?: (data: z.infer<typeof vobSchema>) => void;
  isPending: boolean;
  readOnly?: boolean;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(vobSchema),
    defaultValues: {
      vobDetails: inquiry.vobDetails || "",
      coverageDetails: inquiry.coverageDetails || "",
      quotedCost: inquiry.quotedCost || "",
      clientResponsibility: inquiry.clientResponsibility || "",
      vobFileUrl: inquiry.vobFileUrl || "",
      inNetworkDeductible: inquiry.inNetworkDeductible || "",
      inNetworkDeductibleMet: inquiry.inNetworkDeductibleMet || "",
      inNetworkOopMax: inquiry.inNetworkOopMax || "",
      inNetworkOopMet: inquiry.inNetworkOopMet || "",
      hasOutOfNetworkBenefits: inquiry.hasOutOfNetworkBenefits || "",
      outOfNetworkDeductible: inquiry.outOfNetworkDeductible || "",
      outOfNetworkDeductibleMet: inquiry.outOfNetworkDeductibleMet || "",
      outOfNetworkOopMax: inquiry.outOfNetworkOopMax || "",
      outOfNetworkOopMet: inquiry.outOfNetworkOopMet || "",
      stateRestrictions: inquiry.stateRestrictions || "",
      preCertRequired: inquiry.preCertRequired || "",
      preAuthRequired: inquiry.preAuthRequired || "",
      preCertAuthDetails: inquiry.preCertAuthDetails || "",
      hasSubstanceUseBenefits: inquiry.hasSubstanceUseBenefits || "",
      hasMentalHealthBenefits: inquiry.hasMentalHealthBenefits || "",
      benefitNotes: inquiry.benefitNotes || "",
    },
  });

  const handleAnalyzeWithAI = async () => {
    const vobText = form.getValues("vobDetails");
    if (!vobText || vobText.trim().length < 20) {
      toast({ 
        title: "More text needed", 
        description: "Please paste the VOB document text first (at least a few sentences)",
        variant: "destructive" 
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-vob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vobText }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      
      if (data.inNetworkDeductible) form.setValue("inNetworkDeductible", data.inNetworkDeductible);
      if (data.inNetworkDeductibleMet) form.setValue("inNetworkDeductibleMet", data.inNetworkDeductibleMet);
      if (data.inNetworkOopMax) form.setValue("inNetworkOopMax", data.inNetworkOopMax);
      if (data.inNetworkOopMet) form.setValue("inNetworkOopMet", data.inNetworkOopMet);
      if (data.hasOutOfNetworkBenefits) form.setValue("hasOutOfNetworkBenefits", data.hasOutOfNetworkBenefits);
      if (data.outOfNetworkDeductible) form.setValue("outOfNetworkDeductible", data.outOfNetworkDeductible);
      if (data.outOfNetworkDeductibleMet) form.setValue("outOfNetworkDeductibleMet", data.outOfNetworkDeductibleMet);
      if (data.outOfNetworkOopMax) form.setValue("outOfNetworkOopMax", data.outOfNetworkOopMax);
      if (data.outOfNetworkOopMet) form.setValue("outOfNetworkOopMet", data.outOfNetworkOopMet);
      if (data.stateRestrictions) form.setValue("stateRestrictions", data.stateRestrictions);
      if (data.preCertRequired) form.setValue("preCertRequired", data.preCertRequired);
      if (data.preAuthRequired) form.setValue("preAuthRequired", data.preAuthRequired);
      if (data.preCertAuthDetails) form.setValue("preCertAuthDetails", data.preCertAuthDetails);
      if (data.hasSubstanceUseBenefits) form.setValue("hasSubstanceUseBenefits", data.hasSubstanceUseBenefits);
      if (data.hasMentalHealthBenefits) form.setValue("hasMentalHealthBenefits", data.hasMentalHealthBenefits);
      if (data.benefitNotes) form.setValue("benefitNotes", data.benefitNotes);
      if (data.vobSummary) form.setValue("coverageDetails", data.vobSummary);

      toast({ title: "Analysis complete", description: "Form fields have been filled automatically" });
    } catch (error) {
      toast({ title: "Analysis failed", description: "Please try again or fill manually", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Verification of Benefits (VOB)</CardTitle>
            <CardDescription>
              Insurance: {inquiry.insuranceProvider} | Policy: {inquiry.insurancePolicyId}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit ? form.handleSubmit(onSubmit) : (e) => e.preventDefault()} className="space-y-6">
            <fieldset disabled={readOnly}>
            <FormField
              control={form.control}
              name="vobDetails"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <FormLabel className="text-base">VOB Results / Paste Document Text *</FormLabel>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAnalyzeWithAI}
                      disabled={analyzing}
                      data-testid="button-analyze-ai"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Fill with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Paste the VOB document text here, then click 'Fill with AI' to automatically extract key information..."
                      className="min-h-40"
                      data-testid="input-vob-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            <h3 className="font-semibold text-lg">In-Network Benefits</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inNetworkDeductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $2,500" className="h-12" data-testid="input-in-deductible" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inNetworkDeductibleMet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible Met / Remaining</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $1,000 met, $1,500 remaining" className="h-12" data-testid="input-in-deductible-met" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inNetworkOopMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Out-of-Pocket Max</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $6,000" className="h-12" data-testid="input-in-oop-max" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inNetworkOopMet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OOP Met / Remaining</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $500 met, $5,500 remaining" className="h-12" data-testid="input-in-oop-met" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">Out-of-Network Benefits</h3>
              <FormField
                control={form.control}
                name="hasOutOfNetworkBenefits"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-32" data-testid="select-has-oon">
                      <SelectValue placeholder="Has OON?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="outOfNetworkDeductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OON Deductible</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $5,000" className="h-12" data-testid="input-oon-deductible" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outOfNetworkDeductibleMet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OON Deductible Met / Remaining</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $0 met, $5,000 remaining" className="h-12" data-testid="input-oon-deductible-met" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outOfNetworkOopMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OON Out-of-Pocket Max</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $12,000" className="h-12" data-testid="input-oon-oop-max" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outOfNetworkOopMet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OON OOP Met / Remaining</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $0 met, $12,000 remaining" className="h-12" data-testid="input-oon-oop-met" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <h3 className="font-semibold text-lg">Pre-Cert / Pre-Auth Requirements</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="preCertRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-Certification Required?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-precert">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preAuthRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-Authorization Required?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-preauth">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="preCertAuthDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-Cert/Auth Details & Mandatory Requirements</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Timeline, phone numbers, required forms, mandatory stipulations..." className="min-h-20" data-testid="input-precert-details" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />
            <h3 className="font-semibold text-lg">Coverage & Restrictions</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hasSubstanceUseBenefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substance Use Benefits?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-sud-benefits">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hasMentalHealthBenefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mental Health Benefits?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12" data-testid="select-mh-benefits">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="stateRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State or Geographic Restrictions</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., In-state only, excludes certain states..." className="h-12" data-testid="input-state-restrictions" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="benefitNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Benefit Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Exclusions, limitations, special conditions..." className="min-h-20" data-testid="input-benefit-notes" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />
            <h3 className="font-semibold text-lg">Quote Information</h3>
            <FormField
              control={form.control}
              name="coverageDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Summary</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Summary of coverage details..." className="min-h-20" data-testid="input-coverage-details" />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quotedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quoted Cost</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $15,000" className="h-12" data-testid="input-quoted-cost" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientResponsibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Responsibility</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $3,000" className="h-12" data-testid="input-client-responsibility" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending}
              data-testid="button-complete-vob"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "VOB Complete - Quote Client"
              )}
            </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function QuoteSection({
  inquiry,
  onAccept,
  onDecline,
  isPending,
  readOnly = false,
}: {
  inquiry: Inquiry;
  onAccept?: (notes: string) => void;
  onDecline?: (notes: string) => void;
  isPending: boolean;
  readOnly?: boolean;
}) {
  const [notes, setNotes] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Quote Client</CardTitle>
            <CardDescription>Present the financial arrangement to the client</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quoted Cost:</span>
            <span className="font-medium">{inquiry.quotedCost || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client Responsibility:</span>
            <span className="font-medium">{inquiry.clientResponsibility || "—"}</span>
          </div>
          {inquiry.coverageDetails && (
            <Separator className="my-2" />
          )}
          {inquiry.coverageDetails && (
            <p className="text-sm text-muted-foreground">{inquiry.coverageDetails}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about the quote discussion..."
            className="min-h-24"
            data-testid="input-quote-notes"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            variant="outline"
            className="flex-1 h-14 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onDecline?.(notes)}
            disabled={isPending || readOnly || !onDecline}
            data-testid="button-quote-declined"
          >
            Client Declined
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14"
            onClick={() => onAccept?.(notes)}
            disabled={isPending || readOnly || !onAccept}
            data-testid="button-quote-accepted"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            )}
            Client Accepts - Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreAssessmentSection({
  inquiryId,
  onComplete,
  isPending,
  readOnly = false,
}: {
  inquiryId: number;
  onComplete?: (notes: string) => void;
  isPending: boolean;
  readOnly?: boolean;
}) {
  const [notes, setNotes] = useState("");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Pre-Assessment</CardTitle>
            <CardDescription>
              Complete all three clinical forms before proceeding
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <PreAssessmentForms inquiryId={inquiryId} />

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Assessment Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pre-assessment findings and notes..."
            className="min-h-32"
            data-testid="input-preassessment-notes"
          />
        </div>

        {!readOnly && onComplete && (
        <Button
          size="lg"
          className="w-full h-14"
          onClick={() => onComplete(notes)}
          disabled={isPending}
          data-testid="button-complete-preassessment"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Pre-Assessment Complete - Schedule Admission
            </>
          )}
        </Button>
        )}
      </CardContent>
    </Card>
  );
}

const schedulingSchema = z.object({
  expectedAdmitDate: z.string().min(1, "Expected admit date is required"),
  levelOfCare: z.string().min(1, "Level of care is required"),
  admissionType: z.string().optional(),
  schedulingNotes: z.string().optional(),
});

function SchedulingFormWrapper({
  inquiry,
  onSubmit,
  onAdmit,
  onLost,
  isPending,
  onCopy,
  copied,
  readOnly = false,
}: {
  inquiry: Inquiry;
  onSubmit?: (data: z.infer<typeof schedulingSchema>) => void;
  onAdmit?: () => void;
  onLost?: () => void;
  isPending: boolean;
  onCopy: () => void;
  copied: boolean;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  
  const notifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/inquiries/${inquiry.id}/notify-staff`);
      return res.json();
    },
    onSuccess: (data: { message?: string }) => {
      toast({ title: "Email Sent", description: data.message || "Schedule email sent to staff" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    },
  });

  const handleSubmitAndNotify = onSubmit ? async (data: z.infer<typeof schedulingSchema>) => {
    onSubmit(data);
    notifyMutation.mutate();
  } : undefined;

  return (
    <SchedulingForm
      inquiry={inquiry}
      onSubmit={handleSubmitAndNotify}
      onAdmit={onAdmit}
      onLost={onLost}
      readOnly={readOnly}
      isPending={isPending}
      onCopy={onCopy}
      copied={copied}
      isNotifying={notifyMutation.isPending}
    />
  );
}

function SchedulingForm({
  inquiry,
  onSubmit,
  onAdmit,
  onLost,
  isPending,
  onCopy,
  copied,
  isNotifying,
  readOnly = false,
}: {
  inquiry: Inquiry;
  onSubmit?: (data: z.infer<typeof schedulingSchema>) => void;
  onAdmit?: () => void;
  onLost?: () => void;
  isPending: boolean;
  onCopy: () => void;
  copied: boolean;
  isNotifying: boolean;
  readOnly?: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(schedulingSchema),
    defaultValues: {
      expectedAdmitDate: inquiry.expectedAdmitDate || "",
      levelOfCare: inquiry.levelOfCare || "",
      admissionType: inquiry.admissionType || "",
      schedulingNotes: inquiry.schedulingNotes || "",
    },
  });

  const isScheduled = !!inquiry.expectedAdmitDate && !!inquiry.levelOfCare;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Schedule Admission</CardTitle>
            <CardDescription>Set the admission date and level of care</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={onSubmit ? form.handleSubmit(onSubmit) : (e) => e.preventDefault()} className="space-y-6">
            <fieldset disabled={readOnly}>
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="expectedAdmitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Expected Admission Date *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="text-lg h-12"
                        data-testid="input-admit-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="levelOfCare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Level of Care *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-lg h-12" data-testid="select-level-of-care">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levelsOfCare.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {levelOfCareDisplayNames[loc]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="admissionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Admission Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12" data-testid="select-admission-type">
                        <SelectValue placeholder="Select type (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_network">In-Network Insurance</SelectItem>
                      <SelectItem value="out_of_network">Out-of-Network Insurance</SelectItem>
                      <SelectItem value="cash_pay">Cash Pay</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedulingNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Scheduling Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Travel arrangements, special needs, etc..."
                      className="min-h-24"
                      data-testid="input-scheduling-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending || isNotifying}
              data-testid="button-send-schedule-email"
            >
              {isPending || isNotifying ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              Send Schedule Email to Staff
            </Button>
            </fieldset>
          </form>
        </Form>

        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={onAdmit}
          disabled={isPending}
          data-testid="button-move-to-admitted"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <UserCheck className="w-5 h-5 mr-2" />
          )}
          Move to Admitted Stage
        </Button>

        <Button
          variant="outline"
          onClick={onLost}
          disabled={isPending}
          className="w-full border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
          data-testid="button-mark-lost"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Mark as Lost Client
        </Button>

        {isScheduled && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-semibold">Admission Summary</h4>
              <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm whitespace-pre-wrap">
                {`New Admit Expected: ${inquiry.expectedAdmitDate ? format(new Date(inquiry.expectedAdmitDate), "MMMM d, yyyy") : "TBD"}
Client Name: ${inquiry.clientName || inquiry.callerName || "Unknown"}, DOB: ${inquiry.dateOfBirth ? format(new Date(inquiry.dateOfBirth), "MM/dd/yyyy") : "TBD"}
Insurance: ${inquiry.insuranceProvider || "N/A"}, Policy ID: ${inquiry.insurancePolicyId || "N/A"}
Level of Care: ${inquiry.levelOfCare ? levelOfCareDisplayNames[inquiry.levelOfCare as LevelOfCare] : "TBD"}`}
              </div>
              <Button
                variant="outline"
                onClick={onCopy}
                className="w-full"
                data-testid="button-copy-summary"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Summary
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
