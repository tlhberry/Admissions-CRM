import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  Webhook,
  Save,
  Copy,
  Check,
  UserCog,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Company, User, UserRole } from "@shared/schema";

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: company, isLoading: companyLoading, error: companyError } = useQuery<Company>({
    queryKey: ["/api/company"],
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [companyName, setCompanyName] = useState("");
  const [companyNameInitialized, setCompanyNameInitialized] = useState(false);

  if (company && !companyNameInitialized) {
    setCompanyName(company.name);
    setCompanyNameInitialized(true);
  }

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("PATCH", "/api/company", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Company Updated",
        description: "Company profile has been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { role?: UserRole; isActive?: string } }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Updated",
        description: "User settings have been saved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleSaveCompany = () => {
    updateCompanyMutation.mutate({ name: companyName });
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateUserMutation.mutate({ userId, data: { role } });
  };

  const handleActiveChange = (userId: string, isActive: string) => {
    updateUserMutation.mutate({ userId, data: { isActive } });
  };

  const webhookUrl = company?.ctmWebhookToken
    ? `${window.location.origin}/api/webhooks/ctm/${company.ctmWebhookToken}`
    : null;

  const copyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Webhook URL copied to clipboard",
      });
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Only administrators can view Admin Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Admin Settings</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="company" data-testid="tab-company">
              <Building2 className="w-4 h-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="ctm" data-testid="tab-ctm">
              <Webhook className="w-4 h-4 mr-2" />
              CTM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Manage your company name and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                        data-testid="input-company-name"
                      />
                    </div>
                    <Button
                      onClick={handleSaveCompany}
                      disabled={updateCompanyMutation.isPending}
                      data-testid="button-save-company"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage user roles and access for your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users?.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-4 p-4 border rounded-md"
                        data-testid={`user-row-${u.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">
                              {u.firstName} {u.lastName}
                            </span>
                            {u.id === user?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {u.isActive === "no" && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                            disabled={u.id === user?.id || updateUserMutation.isPending}
                          >
                            <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={u.isActive}
                            onValueChange={(value) => handleActiveChange(u.id, value)}
                            disabled={u.id === user?.id || updateUserMutation.isPending}
                          >
                            <SelectTrigger className="w-28" data-testid={`select-active-${u.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Active</SelectItem>
                              <SelectItem value="no">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Billing features coming soon. Contact support for billing inquiries.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ctm">
            <Card>
              <CardHeader>
                <CardTitle>CallTrackingMetrics Integration</CardTitle>
                <CardDescription>
                  Connect your CTM account to automatically create inquiries from phone calls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {companyLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Your Webhook URL</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add this URL to your CallTrackingMetrics webhook settings to automatically create inquiries when calls come in.
                      </p>
                      {webhookUrl ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={webhookUrl}
                            readOnly
                            className="font-mono text-sm"
                            data-testid="input-webhook-url"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyWebhookUrl}
                            data-testid="button-copy-webhook"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No webhook URL configured. Contact support to set up CTM integration.
                        </p>
                      )}
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Setup Instructions</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Log in to your CallTrackingMetrics account</li>
                        <li>Go to Settings then Webhooks</li>
                        <li>Create a new webhook with the URL above</li>
                        <li>Select the events you want to track (e.g., Call Completed)</li>
                        <li>Save the webhook configuration</li>
                      </ol>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
