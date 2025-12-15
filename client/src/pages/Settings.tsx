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
import { ArrowLeft, Settings as SettingsIcon, Mail, Bell, Save, CreditCard } from "lucide-react";
import { stageDisplayNames, type PipelineStage, type NotificationSetting } from "@shared/schema";
import { useState, useEffect } from "react";
import { BillingSettings } from "@/components/BillingSettings";

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
      </main>
    </div>
  );
}
