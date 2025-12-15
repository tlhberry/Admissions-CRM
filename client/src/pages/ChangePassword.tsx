import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import { Lock, KeyRound, AlertTriangle, Loader2, Check, X } from "lucide-react";

interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  historyCount: number;
  maxAgeDays: number;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(12, "Password must be at least 12 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: requirementsData } = useQuery<{ requirements: PasswordRequirements }>({
    queryKey: ["/api/auth/password/requirements"],
  });

  const requirements = requirementsData?.requirements;

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  const passwordChecks = {
    minLength: newPassword.length >= 12,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/password/change", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      setError(null);
      setSuccess(true);
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Failed to change password");
        if (data.errors) {
          setError(data.errors.join(", "));
        }
      } else {
        setError("Unable to change password. Please try again.");
      }
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    setError(null);
    changePasswordMutation.mutate(data);
  };

  const CheckItem = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">AdmitSimple</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold">Password Changed</h2>
                <p className="text-muted-foreground">
                  Your password has been updated successfully. Redirecting to dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">AdmitSimple</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Change Password</CardTitle>
            <CardDescription>
              Your password must be changed to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter current password"
                            className="pl-10"
                            autoComplete="current-password"
                            data-testid="input-current-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            className="pl-10"
                            autoComplete="new-password"
                            data-testid="input-new-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-3">Password Requirements:</p>
                  <CheckItem passed={passwordChecks.minLength} label="At least 12 characters" />
                  <CheckItem passed={passwordChecks.hasUppercase} label="One uppercase letter" />
                  <CheckItem passed={passwordChecks.hasLowercase} label="One lowercase letter" />
                  <CheckItem passed={passwordChecks.hasNumber} label="One number" />
                  <CheckItem passed={passwordChecks.hasSpecial} label="One special character" />
                </div>

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            className="pl-10"
                            autoComplete="new-password"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requirements && (
                  <p className="text-xs text-muted-foreground text-center">
                    Password cannot be one of your last {requirements.historyCount} passwords.
                    Expires after {requirements.maxAgeDays} days.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={changePasswordMutation.isPending || !allChecksPassed}
                  data-testid="button-change-password-submit"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t py-4 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>HIPAA Compliant Secure Password Change</p>
        </div>
      </footer>
    </div>
  );
}
