import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CreditCard, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  XCircle,
  Receipt
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { BILLING_PRICES, type BillingAccount, type BillingInvoice, type BillingPlanType } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BillingResponse {
  billingAccount: BillingAccount;
  isConfigured: boolean;
  activeUserCount: number;
}

function formatPriceDisplay(planType: BillingPlanType, userCount: number) {
  const prices = BILLING_PRICES[planType];
  const baseDollars = prices.baseCents / 100;
  const userDollars = (prices.perUserCents * userCount) / 100;
  const totalDollars = baseDollars + userDollars;
  const period = planType === 'monthly' ? '/month' : '/year';

  return {
    basePrice: `$${baseDollars.toFixed(2)}`,
    userPrice: `$${userDollars.toFixed(2)}`,
    totalPrice: `$${totalDollars.toFixed(2)}`,
    period,
    perUserRate: `$${(prices.perUserCents / 100).toFixed(2)}`,
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'trial':
      return <Badge variant="secondary" data-testid="badge-status-trial"><Clock className="w-3 h-3 mr-1" />Trial</Badge>;
    case 'active':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="badge-status-active"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    case 'past_due':
      return <Badge variant="destructive" data-testid="badge-status-past-due"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
    case 'cancelled':
      return <Badge variant="outline" data-testid="badge-status-cancelled"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
    case 'expired':
      return <Badge variant="destructive" data-testid="badge-status-expired"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    default:
      return <Badge variant="outline" data-testid="badge-status-unknown">{status}</Badge>;
  }
}

export function BillingSettings() {
  const { toast } = useToast();

  const { data: billing, isLoading } = useQuery<BillingResponse>({
    queryKey: ["/api/billing"],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<BillingInvoice[]>({
    queryKey: ["/api/billing/invoices"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planType: BillingPlanType) => {
      const response = await apiRequest("POST", "/api/billing/subscribe", { planType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/invoices"] });
      toast({
        title: "Subscription Started",
        description: "Your subscription has been activated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/cancel");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const paymentFormMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}/settings?payment=success`;
      const cancelUrl = `${window.location.origin}/settings?payment=cancelled`;
      const response = await apiRequest("POST", "/api/billing/payment-form-token", {
        returnUrl,
        cancelUrl,
      });
      return response.json();
    },
    onSuccess: (data: { token: string; formUrl: string }) => {
      // Open Accept Hosted form in a popup
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        '',
        'AuthorizeNetPayment',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      
      if (popup) {
        // Create form and submit to Accept Hosted
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.formUrl;
        form.target = 'AuthorizeNetPayment';
        
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        // Poll for popup close and refresh billing
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            queryClient.invalidateQueries({ queryKey: ["/api/billing"] });
          }
        }, 500);
      } else {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to add a payment method.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open payment form",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!billing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load billing information.</p>
        </CardContent>
      </Card>
    );
  }

  const { billingAccount, isConfigured, activeUserCount } = billing;
  const isTrialing = billingAccount.status === 'trial';
  const isActive = billingAccount.status === 'active';
  const isCancelled = billingAccount.status === 'cancelled';
  const hasPaymentMethod = !!billingAccount.cardLast4;
  const currentPlan = billingAccount.planType as BillingPlanType | null;

  // Calculate trial days remaining
  let trialDaysRemaining = 0;
  if (isTrialing && billingAccount.trialEndDate) {
    trialDaysRemaining = Math.max(0, differenceInDays(new Date(billingAccount.trialEndDate), new Date()));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing & Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and payment methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        {!isConfigured && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Payment System Not Configured</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Contact your administrator to configure Authorize.net payment processing.
              </p>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Subscription Status</p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(billingAccount.status)}
                {currentPlan && (
                  <span className="text-sm text-muted-foreground">
                    ({currentPlan === 'monthly' ? 'Monthly' : 'Annual'} Plan)
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm" data-testid="text-user-count">{activeUserCount} active user{activeUserCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Trial Info */}
          {isTrialing && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in trial
                </span>
              </div>
              {billingAccount.trialEndDate && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Trial ends on {format(new Date(billingAccount.trialEndDate), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
          )}

          {/* Next Billing Date */}
          {isActive && billingAccount.nextBillingDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Next billing: {format(new Date(billingAccount.nextBillingDate), 'MMMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Pricing Information */}
        <div className="space-y-4">
          <h4 className="font-medium">Pricing</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Plan */}
            <div className={`p-4 rounded-md border ${currentPlan === 'monthly' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium">Monthly Plan</span>
                {currentPlan === 'monthly' && (
                  <Badge variant="outline" className="text-xs">Current</Badge>
                )}
              </div>
              <p className="text-2xl font-bold" data-testid="text-monthly-price">
                {formatPriceDisplay('monthly', activeUserCount).totalPrice}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                $99 base + $25/user ({activeUserCount} users)
              </p>
              {isConfigured && hasPaymentMethod && !isActive && (
                <Button
                  className="w-full mt-3"
                  size="sm"
                  onClick={() => subscribeMutation.mutate('monthly')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-monthly"
                >
                  {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Monthly'}
                </Button>
              )}
              {isActive && currentPlan === 'annual' && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                  onClick={() => subscribeMutation.mutate('monthly')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-switch-monthly"
                >
                  Switch to Monthly
                </Button>
              )}
            </div>

            {/* Annual Plan */}
            <div className={`p-4 rounded-md border ${currentPlan === 'annual' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium">Annual Plan</span>
                <Badge variant="secondary" className="text-xs">Save 16%</Badge>
                {currentPlan === 'annual' && (
                  <Badge variant="outline" className="text-xs">Current</Badge>
                )}
              </div>
              <p className="text-2xl font-bold" data-testid="text-annual-price">
                {formatPriceDisplay('annual', activeUserCount).totalPrice}
                <span className="text-sm font-normal text-muted-foreground">/year</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                $999 base + $250/user ({activeUserCount} users)
              </p>
              {isConfigured && hasPaymentMethod && !isActive && (
                <Button
                  className="w-full mt-3"
                  size="sm"
                  onClick={() => subscribeMutation.mutate('annual')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe-annual"
                >
                  {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Annual'}
                </Button>
              )}
              {isActive && currentPlan === 'monthly' && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                  onClick={() => subscribeMutation.mutate('annual')}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-switch-annual"
                >
                  Switch to Annual
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Method */}
        <div className="space-y-4">
          <h4 className="font-medium">Payment Method</h4>
          
          {hasPaymentMethod ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-card-info">
                    {billingAccount.cardType} ending in {billingAccount.cardLast4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {billingAccount.cardExpMonth}/{billingAccount.cardExpYear}
                  </p>
                </div>
              </div>
              {isConfigured && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paymentFormMutation.mutate()}
                  disabled={paymentFormMutation.isPending}
                  data-testid="button-update-payment"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Card
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">No payment method on file</p>
              {isConfigured && (
                <Button
                  size="sm"
                  onClick={() => paymentFormMutation.mutate()}
                  disabled={paymentFormMutation.isPending}
                  data-testid="button-add-payment"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel Subscription */}
        {isActive && !isCancelled && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-destructive">Cancel Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Your access will continue until the end of your billing period.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive"
                    data-testid="button-cancel-subscription"
                  >
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelMutation.mutate()}
                      className="bg-destructive text-destructive-foreground"
                      data-testid="button-confirm-cancel"
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}

        {/* Invoices */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Billing History
          </h4>
          
          {invoicesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/50"
                  data-testid={`invoice-row-${invoice.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.createdAt && format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">${(invoice.totalCents / 100).toFixed(2)}</span>
                    <Badge 
                      variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
