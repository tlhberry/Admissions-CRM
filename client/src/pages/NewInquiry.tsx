import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Phone, Heart, Loader2 } from "lucide-react";
import {
  onlineReferralSources,
  onlineReferralSourceDisplayNames,
  accountTypeDisplayNames,
  type ReferralAccount,
  type Inquiry,
  type OnlineReferralSource,
  type AccountType,
} from "@shared/schema";

const newInquirySchema = z.object({
  callerName: z.string().min(1, "Caller name is required"),
  clientName: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  referralOrigin: z.enum(["account", "online"], { required_error: "Please select referral type" }),
  referralAccountId: z.number().optional(),
  onlineSource: z.string().optional(),
  referralDetails: z.string().optional(),
  initialNotes: z.string().optional(),
}).refine((data) => {
  if (data.referralOrigin === "account" && !data.referralAccountId) {
    return false;
  }
  if (data.referralOrigin === "online" && !data.onlineSource) {
    return false;
  }
  return true;
}, {
  message: "Please select a specific referral source",
  path: ["referralAccountId"],
});

type NewInquiryForm = z.infer<typeof newInquirySchema>;

export default function NewInquiry() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: referralAccounts } = useQuery<ReferralAccount[]>({
    queryKey: ["/api/referral-accounts"],
  });

  const form = useForm<NewInquiryForm>({
    resolver: zodResolver(newInquirySchema),
    defaultValues: {
      callerName: "",
      clientName: "",
      phoneNumber: "",
      email: "",
      referralOrigin: undefined,
      referralAccountId: undefined,
      onlineSource: "",
      referralDetails: "",
      initialNotes: "",
    },
  });

  const referralOrigin = form.watch("referralOrigin");

  const createMutation = useMutation({
    mutationFn: async (data: NewInquiryForm) => {
      const response = await apiRequest("POST", "/api/inquiries", {
        callerName: data.callerName,
        clientName: data.clientName,
        phoneNumber: data.phoneNumber,
        email: data.email,
        referralOrigin: data.referralOrigin,
        referralAccountId: data.referralOrigin === "account" ? data.referralAccountId : null,
        onlineSource: data.referralOrigin === "online" ? data.onlineSource : null,
        referralDetails: data.referralDetails,
        initialNotes: data.initialNotes,
        stage: "inquiry",
      });
      return response.json() as Promise<Inquiry>;
    },
    onSuccess: (inquiry) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Inquiry Created",
        description: "The inquiry has been created successfully.",
      });
      navigate(`/inquiry/${inquiry.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create inquiry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewInquiryForm) => {
    createMutation.mutate(data);
  };

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
              <h1 className="text-xl font-bold hidden sm:block">New Inquiry</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Log New Inquiry</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Record the details from an incoming call
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="callerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Caller Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Who is calling?"
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

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Phone Number *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="(555) 123-4567"
                            className="text-lg h-12"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="email@example.com"
                            className="text-lg h-12"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="referralOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Referral Type *</FormLabel>
                      <Select 
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("referralAccountId", undefined);
                          form.setValue("onlineSource", "");
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-lg h-12" data-testid="select-referral-origin">
                            <SelectValue placeholder="Select referral type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account" className="text-base">Referral Account</SelectItem>
                          <SelectItem value="online" className="text-base">Online / Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {referralOrigin === "account" && (
                  <FormField
                    control={form.control}
                    name="referralAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Referral Account *</FormLabel>
                        <Select 
                          onValueChange={(v) => field.onChange(parseInt(v))} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="text-lg h-12" data-testid="select-referral-account">
                              <SelectValue placeholder="Select referral account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {referralAccounts?.map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()} className="text-base">
                                {account.name}
                                {account.type && (
                                  <span className="text-muted-foreground ml-2">
                                    ({accountTypeDisplayNames[account.type as AccountType] || account.type})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {referralOrigin === "online" && (
                  <FormField
                    control={form.control}
                    name="onlineSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Online Source *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="text-lg h-12" data-testid="select-online-source">
                              <SelectValue placeholder="Select online source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {onlineReferralSources.map((source) => (
                              <SelectItem key={source} value={source} className="text-base">
                                {onlineReferralSourceDisplayNames[source as OnlineReferralSource]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="referralDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Referral Details</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Referred by Dr. Smith"
                          className="text-lg h-12"
                          data-testid="input-referral-details"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Initial Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any important details from the call..."
                          className="text-base min-h-32 resize-none"
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => navigate("/")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:flex-1"
                    disabled={createMutation.isPending}
                    data-testid="button-create-inquiry"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Inquiry"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
