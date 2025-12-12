import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import type { Inquiry, PipelineStage, NonViableReason, LevelOfCare } from "@shared/schema";
import {
  stageDisplayNames,
  nonViableReasons,
  nonViableReasonDisplayNames,
  levelsOfCare,
  levelOfCareDisplayNames,
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

export default function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showNonViableDialog, setShowNonViableDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: inquiry, isLoading } = useQuery<Inquiry>({
    queryKey: [`/api/inquiries/${id}`],
  });

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

  const handleViabilityDecision = (isViable: boolean) => {
    if (isViable) {
      updateMutation.mutate({ isViable: "yes", stage: "insurance_collection" });
    } else {
      setShowNonViableDialog(true);
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

  const stage = inquiry?.stage as PipelineStage | undefined;
  const StageIcon = stage ? stageIcons[stage] : Phone;

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
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stageColors[stage!]}`}>
                <StageIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{stageDisplayNames[stage!]}</CardTitle>
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
                <p className="font-medium">{inquiry.phoneNumber || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referral Source</p>
                <p className="font-medium">{inquiry.referralSource || "—"}</p>
              </div>
              {inquiry.initialNotes && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium whitespace-pre-line">{inquiry.initialNotes}</p>
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
            </div>
          </CardContent>
        </Card>

        {stage === "inquiry" && (
          <ViabilitySection
            onViable={() => handleViabilityDecision(true)}
            onNonViable={() => handleViabilityDecision(false)}
            isPending={updateMutation.isPending}
          />
        )}

        {stage === "insurance_collection" && (
          <InsuranceForm
            inquiry={inquiry}
            onSubmit={(data) => updateMutation.mutate({ ...data, stage: "vob_pending" })}
            isPending={updateMutation.isPending}
          />
        )}

        {stage === "vob_pending" && (
          <VOBForm
            inquiry={inquiry}
            onSubmit={(data) => updateMutation.mutate({ ...data, stage: "quote_client", vobCompletedAt: new Date() })}
            isPending={updateMutation.isPending}
          />
        )}

        {stage === "quote_client" && (
          <QuoteSection
            inquiry={inquiry}
            onAccept={(notes) => updateMutation.mutate({ quoteAccepted: "yes", quoteNotes: notes, stage: "pre_assessment" })}
            onDecline={(notes) => updateMutation.mutate({ quoteAccepted: "no", quoteNotes: notes, stage: "non_viable", nonViableReason: "client_declined" })}
            isPending={updateMutation.isPending}
          />
        )}

        {stage === "pre_assessment" && (
          <PreAssessmentSection
            onComplete={(notes) => updateMutation.mutate({ preAssessmentCompleted: "yes", preAssessmentDate: new Date(), preAssessmentNotes: notes, stage: "scheduled" })}
            isPending={updateMutation.isPending}
          />
        )}

        {stage === "scheduled" && (
          <SchedulingForm
            inquiry={inquiry}
            onSubmit={(data) => updateMutation.mutate(data)}
            onAdmit={() => updateMutation.mutate({ actualAdmitDate: new Date().toISOString().split("T")[0], stage: "admitted" })}
            isPending={updateMutation.isPending}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}

        {stage === "admitted" && (
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
              <Button
                variant="outline"
                className="mt-4 w-full sm:w-auto"
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
            </CardContent>
          </Card>
        )}

        {stage === "non_viable" && (
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
      </main>

      <NonViableDialog
        open={showNonViableDialog}
        onClose={() => setShowNonViableDialog(false)}
        onConfirm={handleNonViable}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}

function ViabilitySection({
  onViable,
  onNonViable,
  isPending,
}: {
  onViable: () => void;
  onNonViable: () => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Viability Decision</CardTitle>
        <CardDescription>
          Is this caller a potential admission for our facility?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="flex-1 h-16 text-lg"
          onClick={onViable}
          disabled={isPending}
          data-testid="button-viable"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          )}
          Viable - Continue
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-16 text-lg border-destructive text-destructive hover:bg-destructive/10"
          onClick={onNonViable}
          disabled={isPending}
          data-testid="button-non-viable"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Not Viable
        </Button>
      </CardContent>
    </Card>
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

const insuranceSchema = z.object({
  insuranceProvider: z.string().min(1, "Insurance provider is required"),
  insurancePolicyId: z.string().min(1, "Policy ID is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  insuranceNotes: z.string().optional(),
});

function InsuranceForm({
  inquiry,
  onSubmit,
  isPending,
}: {
  inquiry: Inquiry;
  onSubmit: (data: z.infer<typeof insuranceSchema>) => void;
  isPending: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      insuranceProvider: inquiry.insuranceProvider || "",
      insurancePolicyId: inquiry.insurancePolicyId || "",
      dateOfBirth: inquiry.dateOfBirth || "",
      insuranceNotes: inquiry.insuranceNotes || "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-xl">Insurance Information</CardTitle>
            <CardDescription>Collect client insurance details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending}
              data-testid="button-submit-insurance"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit & Start VOB"
              )}
            </Button>
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
});

function VOBForm({
  inquiry,
  onSubmit,
  isPending,
}: {
  inquiry: Inquiry;
  onSubmit: (data: z.infer<typeof vobSchema>) => void;
  isPending: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(vobSchema),
    defaultValues: {
      vobDetails: inquiry.vobDetails || "",
      coverageDetails: inquiry.coverageDetails || "",
      quotedCost: inquiry.quotedCost || "",
      clientResponsibility: inquiry.clientResponsibility || "",
    },
  });

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="vobDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">VOB Results *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter verification results..."
                      className="min-h-32"
                      data-testid="input-vob-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverageDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Coverage Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., In-network, 80% coverage, $5k deductible met..."
                      className="min-h-24"
                      data-testid="input-coverage-details"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="quotedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Quoted Cost</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., $15,000"
                        className="text-lg h-12"
                        data-testid="input-quoted-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientResponsibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Client Responsibility</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., $3,000"
                        className="text-lg h-12"
                        data-testid="input-client-responsibility"
                      />
                    </FormControl>
                    <FormMessage />
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
}: {
  inquiry: Inquiry;
  onAccept: (notes: string) => void;
  onDecline: (notes: string) => void;
  isPending: boolean;
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
            onClick={() => onDecline(notes)}
            disabled={isPending}
            data-testid="button-quote-declined"
          >
            Client Declined
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14"
            onClick={() => onAccept(notes)}
            disabled={isPending}
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
  onComplete,
  isPending,
}: {
  onComplete: (notes: string) => void;
  isPending: boolean;
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
              Complete the clinical screening to ensure client is appropriate
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Assessment Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Pre-assessment findings and notes..."
            className="min-h-32"
            data-testid="input-preassessment-notes"
          />
        </div>

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
              Pre-Assessment Complete
            </>
          )}
        </Button>
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

function SchedulingForm({
  inquiry,
  onSubmit,
  onAdmit,
  isPending,
  onCopy,
  copied,
}: {
  inquiry: Inquiry;
  onSubmit: (data: z.infer<typeof schedulingSchema>) => void;
  onAdmit: () => void;
  isPending: boolean;
  onCopy: () => void;
  copied: boolean;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              variant="outline"
              className="w-full"
              disabled={isPending}
              data-testid="button-save-schedule"
            >
              {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Save Schedule Details
            </Button>
          </form>
        </Form>

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

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={onCopy}
                  className="flex-1"
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
                  size="lg"
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700"
                  onClick={onAdmit}
                  disabled={isPending}
                  data-testid="button-mark-admitted"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="w-5 h-5 mr-2" />
                  )}
                  Mark as Admitted
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
