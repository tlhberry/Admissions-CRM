import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Lock, Mail, Shield, AlertTriangle, Loader2, KeyRound } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginStep = "credentials" | "2fa-verify" | "2fa-setup";

interface LoginResponse {
  message: string;
  requiresTwoFactor?: boolean;
  requiresTwoFactorSetup?: boolean;
  totpEnabled?: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  passwordExpired?: boolean;
  mustChangePassword?: boolean;
  remainingAttempts?: number;
}

interface SetupResponse {
  qrCode: string;
  manualKey: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      setError(null);
      setRemainingAttempts(null);

      if (data.requiresTwoFactorSetup) {
        start2FASetup();
      } else if (data.requiresTwoFactor) {
        setStep("2fa-verify");
      } else if (data.user) {
        handleLoginSuccess(data);
      }
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Login failed");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
      } else {
        setError("Unable to connect. Please try again.");
      }
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/auth/2fa/verify", { token });
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      handleLoginSuccess(data);
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Verification failed");
      } else {
        setError("Unable to verify. Please try again.");
      }
      setTotpCode("");
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/2fa/setup/start", {});
      return response.json() as Promise<SetupResponse>;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setStep("2fa-setup");
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Failed to start 2FA setup");
      } else {
        setError("Unable to start 2FA setup. Please try again.");
      }
    },
  });

  const verifySetup2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest("POST", "/api/auth/2fa/setup/verify", { token });
      return response.json() as Promise<LoginResponse>;
    },
    onSuccess: (data) => {
      handleLoginSuccess(data);
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Setup verification failed");
      } else {
        setError("Unable to complete setup. Please try again.");
      }
      setTotpCode("");
    },
  });

  const start2FASetup = () => {
    setup2FAMutation.mutate();
  };

  const handleLoginSuccess = (data: LoginResponse) => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    if (data.mustChangePassword || data.passwordExpired) {
      setLocation("/change-password");
    } else {
      setLocation("/");
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  const handleVerify2FA = () => {
    if (totpCode.length !== 6) return;
    setError(null);
    verify2FAMutation.mutate(totpCode);
  };

  const handleVerifySetup = () => {
    if (totpCode.length !== 6) return;
    setError(null);
    verifySetup2FAMutation.mutate(totpCode);
  };

  const isLoading = loginMutation.isPending || verify2FAMutation.isPending || 
                    setup2FAMutation.isPending || verifySetup2FAMutation.isPending;

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
          {step === "credentials" && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your email and password to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <span className="block mt-1 text-sm">
                          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="pl-10"
                                autoComplete="email"
                                data-testid="input-email"
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
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10"
                                autoComplete="current-password"
                                data-testid="input-password"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-forgot-password">
                    Forgot your password?
                  </Link>
                </div>
              </CardContent>
            </>
          )}

          {step === "2fa-verify" && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={totpCode}
                      onChange={setTotpCode}
                      data-testid="input-2fa-code"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={handleVerify2FA}
                    className="w-full"
                    size="lg"
                    disabled={isLoading || totpCode.length !== 6}
                    data-testid="button-verify-2fa"
                  >
                    {verify2FAMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep("credentials");
                      setTotpCode("");
                      setError(null);
                    }}
                    data-testid="button-back-to-login"
                  >
                    Back to login
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "2fa-setup" && (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Set Up Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Scan the QR code with your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {setupData && (
                  <div className="space-y-6">
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img
                        src={setupData.qrCode}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                        data-testid="img-2fa-qr"
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Or enter this code manually:
                      </p>
                      <code
                        className="block bg-muted px-4 py-2 rounded-md text-sm font-mono break-all"
                        data-testid="text-2fa-manual-key"
                      >
                        {setupData.manualKey}
                      </code>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-center text-muted-foreground">
                        Enter the 6-digit code from your app to complete setup
                      </p>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={totpCode}
                          onChange={setTotpCode}
                          data-testid="input-2fa-setup-code"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>

                    <Button
                      onClick={handleVerifySetup}
                      className="w-full"
                      size="lg"
                      disabled={isLoading || totpCode.length !== 6}
                      data-testid="button-complete-2fa-setup"
                    >
                      {verifySetup2FAMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Completing setup...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                )}

                {setup2FAMutation.isPending && (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Loading 2FA setup...</p>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <footer className="border-t py-4 px-4">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          <p>HIPAA Compliant Secure Login</p>
        </div>
      </footer>
    </div>
  );
}
