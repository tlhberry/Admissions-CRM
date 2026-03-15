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
  Sparkles,
  AlertCircle,
  Lock,
  Unlock,
  Plus,
  Shield,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiBudgetLimit, setAiBudgetLimit] = useState("");
  const [aiSettingsInitialized, setAiSettingsInitialized] = useState(false);
  
  // Add User form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("admissions");

  if (company && !companyNameInitialized) {
    setCompanyName(company.name);
    setCompanyNameInitialized(true);
  }

  if (company && !aiSettingsInitialized) {
    setAiEnabled(company.aiAssistanceEnabled !== "no");
    setAiBudgetLimit(company.aiBudgetLimitCents ? String(company.aiBudgetLimitCents / 100) : "");
    setAiSettingsInitialized(true);
  }

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      const response = await apiRequest("PATCH", "/api/company", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Settings Updated",
        description: "Company settings have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
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

  const unlockAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/auth/admin/unlock/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Account Unlocked",
        description: "The user can now log in again",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock account",
        variant: "destructive",
      });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const response = await apiRequest("POST", `/api/auth/admin/role/${userId}`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been changed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change role",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string; role: UserRole }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Created",
        description: "New team member has been added. They will need to change their password on first login.",
      });
      setShowAddUser(false);
      setNewUserEmail("");
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserPassword("");
      setNewUserRole("admissions");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      firstName: newUserFirstName,
      lastName: newUserLastName,
      role: newUserRole,
    });
  };

  const handleSaveCompany = () => {
    updateCompanyMutation.mutate({ name: companyName });
  };

  const handleSaveAiSettings = () => {
    let budgetCents: number | null = null;
    
    if (aiBudgetLimit && aiBudgetLimit.trim() !== "") {
      const parsed = parseFloat(aiBudgetLimit);
      if (isNaN(parsed) || parsed < 0) {
        toast({
          title: "Invalid Budget",
          description: "Please enter a valid positive number for the budget limit.",
          variant: "destructive",
        });
        return;
      }
      budgetCents = Math.round(parsed * 100);
    }
    
    updateCompanyMutation.mutate({
      aiAssistanceEnabled: aiEnabled ? "yes" : "no",
      aiBudgetLimitCents: budgetCents,
    });
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (cents == null) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const aiUsagePercent = company?.aiBudgetLimitCents && company.aiUsageThisMonthCents
    ? Math.min(100, (company.aiUsageThisMonthCents / company.aiBudgetLimitCents) * 100)
    : 0;

  const isOverBudget = company?.aiBudgetLimitCents && company.aiUsageThisMonthCents
    ? company.aiUsageThisMonthCents >= company.aiBudgetLimitCents
    : false;

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 py-2">
              <TabsTrigger value="company" className="w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Building2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Company</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="users" className="w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Users className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Users</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="billing" className="w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <CreditCard className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Billing</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="ctm" className="w-full justify-center">
                <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                  <Webhook className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">CTM Subscription</span>
                </div>
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
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage user roles and access for your team
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddUser(!showAddUser)}
                  data-testid="button-add-user"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                {showAddUser && (
                  <div className="p-4 mb-4 border rounded-md space-y-4 bg-muted/50">
                    <div className="font-medium">Add New Team Member</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-user-first-name">First Name</Label>
                        <Input
                          id="new-user-first-name"
                          value={newUserFirstName}
                          onChange={(e) => setNewUserFirstName(e.target.value)}
                          placeholder="First name"
                          data-testid="input-new-user-first-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-last-name">Last Name</Label>
                        <Input
                          id="new-user-last-name"
                          value={newUserLastName}
                          onChange={(e) => setNewUserLastName(e.target.value)}
                          placeholder="Last name"
                          data-testid="input-new-user-last-name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-email">Email</Label>
                      <Input
                        id="new-user-email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        data-testid="input-new-user-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-password">Temporary Password</Label>
                      <Input
                        id="new-user-password"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Must be 12+ characters with uppercase, lowercase, number, and symbol"
                        data-testid="input-new-user-password"
                      />
                      <p className="text-xs text-muted-foreground">
                        User will be required to change this on first login
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-role">Role</Label>
                      <Select
                        value={newUserRole}
                        onValueChange={(value) => setNewUserRole(value as UserRole)}
                      >
                        <SelectTrigger data-testid="select-new-user-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="admissions">Admissions</SelectItem>
                          <SelectItem value="clinical">Clinical</SelectItem>
                          <SelectItem value="read_only">Read Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                        data-testid="button-create-user"
                      >
                        {createUserMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Create User
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddUser(false)}
                        data-testid="button-cancel-add-user"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
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
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-md"
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
                            {u.lockedAt && (
                              <Badge variant="destructive" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                            {u.twoFactorSetupComplete === "yes" && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                2FA
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.lockedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unlockAccountMutation.mutate(u.id)}
                              disabled={unlockAccountMutation.isPending}
                              data-testid={`button-unlock-${u.id}`}
                            >
                              {unlockAccountMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-1" />
                                  Unlock
                                </>
                              )}
                            </Button>
                          )}
                          <Select
                            value={u.role}
                            onValueChange={(value) => changeRoleMutation.mutate({ userId: u.id, role: value as UserRole })}
                            disabled={u.id === user?.id || changeRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="admissions">Admissions</SelectItem>
                              <SelectItem value="clinical">Clinical</SelectItem>
                              <SelectItem value="read_only">Read Only</SelectItem>
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
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-muted-foreground" />
                    <CardTitle>AI Assistance</CardTitle>
                  </div>
                  <CardDescription>
                    Configure AI-powered features like call transcription and data extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {companyLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 p-4 border rounded-md">
                        <div className="flex-1">
                          <div className="font-medium">Enable AI Assistance</div>
                          <p className="text-sm text-muted-foreground">
                            When enabled, AI features like automatic call transcription and data extraction are available. When disabled, all forms work manually.
                          </p>
                        </div>
                        <Switch
                          checked={aiEnabled}
                          onCheckedChange={setAiEnabled}
                          data-testid="switch-ai-enabled"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ai-budget">Monthly AI Budget (USD)</Label>
                        <p className="text-sm text-muted-foreground">
                          Set a monthly spending limit for AI features. Leave empty for unlimited.
                        </p>
                        <Input
                          id="ai-budget"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="e.g., 50 (leave empty for unlimited)"
                          value={aiBudgetLimit}
                          onChange={(e) => setAiBudgetLimit(e.target.value)}
                          disabled={!aiEnabled}
                          data-testid="input-ai-budget"
                        />
                      </div>

                      {aiEnabled && company?.aiBudgetLimitCents && (
                        <div className="p-4 border rounded-md space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">This Month&apos;s Usage</span>
                            <span className="text-sm">
                              {formatCurrency(company.aiUsageThisMonthCents)} / {formatCurrency(company.aiBudgetLimitCents)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${aiUsagePercent}%` }}
                            />
                          </div>
                          {isOverBudget && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <AlertCircle className="w-4 h-4" />
                              <span>Budget exceeded. AI features paused until next billing cycle.</span>
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={handleSaveAiSettings}
                        disabled={updateCompanyMutation.isPending}
                        data-testid="button-save-ai-settings"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save AI Settings
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

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
            </div>
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
