import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Phone, 
  ClipboardCheck, 
  Shield, 
  Calendar,
  ArrowRight,
  Mail,
  Loader2,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const [contactForm, setContactForm] = useState({
    email: "",
    phone: "",
    companyName: "",
    message: "",
  });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  const contactMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      setContactSuccess(true);
      setContactError("");
      setContactForm({ email: "", phone: "", companyName: "", message: "" });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      const colonIndex = errorMessage.indexOf(": ");
      if (colonIndex > 0) {
        try {
          const data = JSON.parse(errorMessage.slice(colonIndex + 2));
          setContactError(data.message || "Failed to send message");
          return;
        } catch {}
      }
      setContactError("Failed to send message. Please try again.");
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    contactMutation.mutate(contactForm);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">AdmitSimple</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/login">Sign In</a>
            </Button>
            <Button variant="outline" asChild data-testid="button-signup">
              <a href="/register">Sign Up</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Streamline Your Admissions Process
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              A simple, step-by-step CRM designed for addiction treatment centers. 
              Track inquiries, manage pipelines, and admit more clients with less effort.
            </p>
            <Button size="lg" className="text-lg px-8" asChild data-testid="button-get-started">
              <a href="/login">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-6xl">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Everything You Need
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Call Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Log incoming calls instantly with caller info, referral source, and notes. 
                    Never lose a lead again.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <ClipboardCheck className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Pipeline View</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    See all inquiries at a glance. Track progress from first call 
                    to admission with clear stages.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Insurance VOB</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Collect insurance details and track verification status. 
                    Quote clients with confidence.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Easy Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Schedule admissions and generate summaries automatically. 
                    Keep your team aligned.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">
              Designed for Simplicity
            </h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Large text, clear buttons, and a mobile-friendly design. 
              Your team can use it on any device without training.
            </p>
            <Button variant="outline" size="lg" asChild data-testid="button-learn-more">
              <a href="/login">
                Start Using Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        <section id="contact" className="py-16 px-4 bg-card/30">
          <div className="container mx-auto max-w-xl">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold mb-2">Questions?</h3>
              <p className="text-muted-foreground text-sm">
                Get in touch and we'll help you get started.
              </p>
            </div>
            
            {contactSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Thank you for reaching out!</p>
                <p className="text-muted-foreground text-sm mt-2">We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-sm">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="you@company.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="text-sm">Phone (optional)</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(f => ({ ...f, phone: e.target.value }))}
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-company" className="text-sm">Organization (optional)</Label>
                  <Input
                    id="contact-company"
                    placeholder="Your Treatment Center"
                    value={contactForm.companyName}
                    onChange={(e) => setContactForm(f => ({ ...f, companyName: e.target.value }))}
                    data-testid="input-contact-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-sm">How can we help?</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell us about your needs..."
                    rows={3}
                    value={contactForm.message}
                    onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                    required
                    data-testid="input-contact-message"
                  />
                </div>
                {contactError && (
                  <p className="text-sm text-destructive">{contactError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={contactMutation.isPending}
                  data-testid="button-contact-submit"
                >
                  {contactMutation.isPending ? (
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
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground text-sm">
          <p>AdmitSimple - Admissions CRM for Addiction Treatment Centers</p>
        </div>
      </footer>
    </div>
  );
}
