import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Settings as SettingsIcon, Mail, Bell, Save, MessageCircle, Loader2, CheckCircle, Users, UserPlus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { stageDisplayNames, type PipelineStage, type NotificationSetting, type User } from "@shared/schema";
import { useState, useEffect } from "react";
import { BillingSettings } from "@/components/BillingSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const notifiableStages: PipelineStage[] = [
  "vob_pending",
  "scheduled",
  "admitted",
  "non_viable",
  "lost",
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<NotificationSetting[]>({
    queryKey: ["/api/notification-settings"],
  });

  const [localSettings, setLocalSettings] = useState<Record<string, { enabled: boolean; emails: string }>>({});

  useEffect(() => {
    if (settings) {
      const mapped: Record<string, { enabled: boolean; emails: string }> = {};
      notifiableStages.forEach((stage) => {
        const setting = settings.find((s) => s.stageName === stage);
        mapped[stage] = {
          enabled: setting?.enabled === "yes",
          emails: setting?.emailAddresses || "",
        };
      });
      setLocalSettings(mapped);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { stageName: string; enabled: string; emailAddresses: string }) => {
      const response = await apiRequest("POST", "/api/notification-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = (stage: string) => {
    const setting = localSettings[stage];
    if (setting) {
      saveMutation.mutate({
        stageName: stage,
        enabled: setting.enabled ? "yes" : "no",
        emailAddresses: setting.emails,
      });
    }
  };

  const updateSetting = (stage: string, field: "enabled" | "emails", value: boolean | string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [field]: value,
      },
    }));
  };

  const [supportMessage, setSupportMessage] = useState("");
  const [supportSuccess, setSupportSuccess] = useState(false);

  const supportMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/support", { message });
      return response.json();
    },
    onSuccess: () => {
      setSupportSuccess(true);
      setSupportMessage("");
      toast({
        title: "Message Sent",
        description: "We'll get back to you soon.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supportMessage.trim().length >= 10) {
      supportMutation.mutate(supportMessage);
    }
  };

  // Team Members
  const { data: teamMembers, isLoading: teamLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("user");

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string; role: string }) => {
      const response = await apiRequest("POST", "/api/auth/register/invite", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole("user");
      toast({
        title: "User Invited",
        description: "They will receive a temporary password to log in.",
      });
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to invite user",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to invite user",
          variant: "destructive",
        });
      }
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, { isActive: "no" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deactivated",
        description: "User has been deactivated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate user",
        variant: "destructive",
      });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && inviteFirstName && inviteLastName) {
      inviteMutation.mutate({
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
      });
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    user: "User",
    bd_rep: "BD Rep",
    read_only: "Read Only",
  };

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
              <SettingsIcon className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-lg font-semibold">Settings</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Billing Settings - Admin Only */}
        {user?.role === 'admin' && (
          <BillingSettings />
        )}

        {/* Team Members - Admin Only */}
        {user?.role === 'admin' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage your team members and their roles.
                  </CardDescription>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-user">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a new team member. They will receive a temporary password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-first-name">First Name</Label>
                          <Input
                            id="invite-first-name"
                            value={inviteFirstName}
                            onChange={(e) => setInviteFirstName(e.target.value)}
                            placeholder="John"
                            required
                            data-testid="input-invite-first-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-last-name">Last Name</Label>
                          <Input
                            id="invite-last-name"
                            value={inviteLastName}
                            onChange={(e) => setInviteLastName(e.target.value)}
                            placeholder="Doe"
                            required
                            data-testid="input-invite-last-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="john@company.com"
                          required
                          data-testid="input-invite-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger data-testid="select-invite-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="bd_rep">BD Rep</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="read_only">Read Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowInviteDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={inviteMutation.isPending || !inviteEmail || !inviteFirstName || !inviteLastName}
                          data-testid="button-submit-invite"
                        >
                          {inviteMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Inviting...
                            </>
                          ) : (
                            "Send Invite"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : teamMembers && teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-md border"
                      data-testid={`team-member-${member.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.firstName} {member.lastName}
                          {member.id === user?.id && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.id === user?.id ? (
                          <Badge>{roleLabels[member.role] || member.role}</Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(role) => updateRoleMutation.mutate({ userId: member.id, role })}
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-[120px]" data-testid={`select-role-${member.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="bd_rep">BD Rep</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="read_only">Read Only</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {member.id !== user?.id && member.isActive === "yes" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deactivateMutation.mutate(member.id)}
                            disabled={deactivateMutation.isPending}
                            data-testid={`button-deactivate-${member.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        {member.isActive !== "yes" && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No team members yet.</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Configure email notifications for pipeline stage changes. Enter comma-separated email addresses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              notifiableStages.map((stage) => {
                const setting = localSettings[stage] || { enabled: false, emails: "" };
                return (
                  <div key={stage} className="space-y-3 pb-4 border-b last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-base font-medium">
                        {stageDisplayNames[stage]}
                      </Label>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={(checked) => updateSetting(stage, "enabled", checked)}
                        data-testid={`switch-${stage}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        placeholder="email@example.com, email2@example.com"
                        value={setting.emails}
                        onChange={(e) => updateSetting(stage, "emails", e.target.value)}
                        disabled={!setting.enabled}
                        data-testid={`input-emails-${stage}`}
                      />
                    </div>
                    <Button
                      onClick={() => handleSave(stage)}
                      disabled={saveMutation.isPending}
                      size="sm"
                      data-testid={`button-save-${stage}`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Need help? Send us a message and we'll get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {supportSuccess ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <p className="font-medium">Message sent!</p>
                <p className="text-sm text-muted-foreground mt-1">We'll be in touch soon.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSupportSuccess(false)}
                  data-testid="button-send-another"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support-message">How can we help?</Label>
                  <Textarea
                    id="support-message"
                    placeholder="Describe your question or issue..."
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    data-testid="input-support-message"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                </div>
                <Button
                  type="submit"
                  disabled={supportMutation.isPending || supportMessage.trim().length < 10}
                  data-testid="button-submit-support"
                >
                  {supportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
