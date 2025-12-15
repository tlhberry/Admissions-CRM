import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import { Mail, AlertTriangle, Loader2, KeyRound, CheckCircle, ArrowLeft, Copy, Check } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ResetRequestResponse {
  message: string;
  success?: boolean;
  resetLink?: string;
  devNote?: string;
}

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/password/reset-request", data);
      return response.json() as Promise<ResetRequestResponse>;
    },
    onSuccess: (data) => {
      setError(null);
      setSubmitted(true);
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    },
    onError: async (error: Error & { response?: Response }) => {
      if (error.response) {
        const data = await error.response.json();
        setError(data.message || "Failed to send reset link");
      } else {
        setError("Unable to connect. Please try again.");
      }
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setError(null);
    resetMutation.mutate(data);
  };

  const handleCopyLink = async () => {
    if (resetLink) {
      const fullLink = window.location.origin + resetLink;
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          {!submitted ? (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
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
                                data-testid="input-reset-email"
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
                      disabled={resetMutation.isPending}
                      data-testid="button-reset-submit"
                    >
                      {resetMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  If an account exists with that email, you'll receive password reset instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {resetLink && (
                  <Alert className="bg-muted">
                    <AlertDescription className="space-y-3">
                      <p className="text-sm font-medium">Development Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Email is not configured. Use this link to reset your password:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-background p-2 rounded border break-all">
                          {window.location.origin}{resetLink}
                        </code>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCopyLink}
                          data-testid="button-copy-reset-link"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Link href={resetLink}>
                        <Button className="w-full mt-2" data-testid="button-go-to-reset">
                          Go to Reset Password
                        </Button>
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
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
